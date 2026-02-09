/**
 * Authentication Controller - Updated to support 'username' and 'email' login
 */

const jwt = require('jsonwebtoken');
const { User, ValidOfficerBadge } = require('../models');
const { successResponse } = require('../utils/response');
const { AuthenticationError, ConflictError, ValidationError } = require('../utils/CustomError');
const config = require('../config/env');
const { Op } = require('sequelize');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expire }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpire }
  );
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, username, password, phone, role, officerBadgeId, department } = req.body;

    // Check if user already exists
    const orConditions = [{ email }];
    if (username) {
      orConditions.push({ username });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: orConditions 
      } 
    });

    if (existingUser) {
      throw new ConflictError('User with this email or username already exists');
    }

    // Validate officer badge if role is officer
    if (role === 'officer') {
      if (!officerBadgeId) {
        throw new ValidationError('Officer Badge ID is required for officer registration');
      }
      
      // Check against ValidOfficerBadge whitelist
      const validBadge = await ValidOfficerBadge.findByPk(officerBadgeId);
      
      if (!validBadge) {
        throw new AuthenticationError('Unauthorized Badge ID. Please contact Admin.');
      }

      if (validBadge.isClaimed) {
        throw new ConflictError('This Badge ID has already been claimed by another officer.');
      }
      
      // Pass dept to next step
      if (!department) {
        throw new ValidationError('Department is required for officer registration');
      }
    }

    // Role validation
    const validRoles = ['officer', 'viewer', 'user', 'driver'];
    const assignedRole = (role && validRoles.includes(role)) ? role : 'viewer';

    // Get registration IP
    const registrationIp = req.ip || req.connection.remoteAddress;

    // Auto-verify officers with valid badge
    const isVerified = (assignedRole === 'officer' && !!officerBadgeId);

    const user = await User.create({
      fullName,
      email,
      username: username || email.split('@')[0],
      passwordHash: password,
      phone,
      role: assignedRole,
      officerBadgeId: assignedRole === 'officer' ? officerBadgeId : null,
      department: assignedRole === 'officer' ? department : null,
      isVerified,
      verifiedAt: isVerified ? new Date() : null,
      registrationIp,
      status: 'active',
    });

    // Mark badge as claimed if officer
    if (assignedRole === 'officer' && isVerified) {
       await ValidOfficerBadge.update({ isClaimed: true, claimedBy: user.id }, { where: { badgeId: officerBadgeId } });
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    await user.update({ refreshToken });
    
    // Remove sensitive data from response
    const userResponse = user.toSafeObject();
    
    // Asynchronously send welcome email (don't block the response)
    sendEmail(
      email,
      'Welcome to Smart Parking System!',
      `Hello ${fullName},\n\nWelcome to the MCD Smart Parking Enforcement System. Your account has been successfully created.\n\nYou can now log in to the portal and start using our services.\n\nBest Regards,\nMCD Support Team`
    ).catch(err => console.error('📧 Welcome email failed:', err.message));

    successResponse(res, { user: userResponse, token: accessToken, refreshToken }, 'User registered successfully', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const identifier = email || username;

    if (!identifier) {
      throw new AuthenticationError('Email or username is required');
    }

    // Find user by email or username
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { username: identifier }
        ]
      },
      attributes: { include: ['passwordHash'] }
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new AuthenticationError(`Your account is ${user.status}. Please contact support.`);
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    await user.update({ refreshToken });
    
    // Remove sensitive data from response
    const userResponse = user.toSafeObject();
    
    successResponse(res, { user: userResponse, token: accessToken, refreshToken }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    successResponse(res, { user }, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const user = await User.findByPk(req.user.id);
    
    const updates = {
      fullName: fullName || user.fullName,
      phone: phone || user.phone,
    };

    if (req.file) {
      // Store relative path
      updates.profilePhoto = `uploads/${req.file.filename}`;
    }

    await user.update(updates);

    successResponse(res, { user }, 'Profile updated successfully');
  } catch (error) {
    console.error('❌ Profile Update Error:', error);
    next(error);
  }
};

const { sendEmail } = require('../utils/mailer');
const { OtpCode } = require('../models');

const requestOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      console.log('❌ Request body:', req.body);
      throw new ValidationError(`DEBUG: Email missing. Body: ${JSON.stringify(req.body)}`);
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save to OtpCode table
    await OtpCode.create({
      contact: email,
      code: otp,
      expiresAt
    });

    // Send Email
    const sent = await sendEmail(
      email,
      'Your Smart Parking OTP',
      `Your verification code is: ${otp}. It expires in 5 minutes.`
    );

    if (!sent) {
      throw new Error('Failed to send OTP email. Please check server logs.');
    }

    successResponse(res, { message: 'OTP sent to your email' });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new ValidationError('Email and OTP are required');
    }

    // Find valid OTP
    const validOtp = await OtpCode.findOne({
      where: {
        contact: email,
        code: otp,
        used: false,
        expiresAt: { [Op.gt]: new Date() } // Not expired
      },
      order: [['createdAt', 'DESC']]
    });

    if (!validOtp) {
      throw new AuthenticationError('Invalid or expired OTP');
    }

    // Mark as used
    await validOtp.update({ used: true });

    // Check if user exists to log them in, or just return success for registration flow
    let user = await User.findOne({ where: { email } });
    let responseData = { verified: true, email };

    if (user) {
      // Login user if they exist
      const accessToken = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      await user.update({ refreshToken });
      
      responseData.token = accessToken;
      responseData.refreshToken = refreshToken;
      responseData.user = user.toSafeObject();
    }

    successResponse(res, responseData, 'OTP verified successfully');
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AuthenticationError('Refresh token is required');

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const user = await User.findOne({ where: { id: decoded.id, refreshToken } });

    if (!user) throw new AuthenticationError('Invalid refresh token');

    const accessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await user.update({ refreshToken: newRefreshToken });

    successResponse(res, {
      token: accessToken,
      refreshToken: newRefreshToken
    }, 'Token refreshed successfully');
  } catch (error) {
    next(new AuthenticationError('Session expired. Please login again.'));
  }
};

const socialLogin = async (req, res, next) => {
  try {
    const { provider, token, profile } = req.body;
    // MOCK social login for demo
    // In production, verify the provider's token here
    
    let user = await User.findOne({ where: { email: profile.email } });

    if (!user) {
      user = await User.create({
        fullName: profile.fullName,
        email: profile.email,
        username: profile.email.split('@')[0],
        passwordHash: 'SOCIAL_LOGIN_' + Math.random(),
        role: 'user',
        status: 'active',
        isVerified: true,
        verifiedAt: new Date()
      });
    }

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    await user.update({ refreshToken });

    successResponse(res, {
      user: user.toSafeObject(),
      token: accessToken,
      refreshToken
    }, `Logged in with ${provider}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  requestOTP,
  verifyOTP,
  refresh,
  socialLogin
};
