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
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { username }] 
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
    const validRoles = ['officer', 'contractor', 'viewer', 'user'];
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
    
    await user.update({
      fullName: fullName || user.fullName,
      phone: phone || user.phone,
    });

    successResponse(res, { user }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const requestOTP = async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    const identifier = email || phone;

    if (!identifier) {
      throw new ValidationError('Email or phone number is required');
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }]
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const otp = generateOTP();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.update({
      otpCode: otp,
      otpExpiry: expiry
    });

    // MOCK: In a real system, send SMS/Email here
    console.log(`[AUTH] OTP for ${identifier}: ${otp}`);

    successResponse(res, { message: 'OTP sent successfully (Demo: check server logs)' });
  } catch (error) {
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, phone, otp } = req.body;
    const identifier = email || phone;

    const user = await User.findOne({
      where: {
        [Op.or]: [{ email: identifier }, { phone: identifier }]
      }
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (!user.otpCode || user.otpCode !== otp || new Date() > user.otpExpiry) {
      throw new AuthenticationError('Invalid or expired OTP');
    }

    // Clear OTP and verify user
    await user.update({
      otpCode: null,
      otpExpiry: null,
      isVerified: true,
      verifiedAt: new Date()
    });

    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user);
    await user.update({ refreshToken });

    successResponse(res, {
      user: user.toSafeObject(),
      token: accessToken,
      refreshToken
    }, 'OTP verified successfully');
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
