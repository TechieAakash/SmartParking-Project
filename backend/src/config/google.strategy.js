/**
 * Google OAuth Strategy Configuration
 * Handles authentication via Google OAuth 2.0
 */

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const config = require('./env');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: '30d' }
  );
};

// Only configure if Google credentials exist
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('🔐 Configuring Google OAuth strategy...');
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract email from profile
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      // Find or create user
      let user = await User.findOne({ where: { email } });

      if (!user) {
        // Create new user from Google profile
        const username = email.split('@')[0] + '_' + Date.now().toString().slice(-4);
        
        user = await User.create({
          fullName: profile.displayName || 'Google User',
          email: email,
          username: username,
          passwordHash: 'GOOGLE_OAUTH_' + Math.random().toString(36),
          role: 'user',
          status: 'active',
          isVerified: true,
          verifiedAt: new Date(),
          googleId: profile.id
        });
        
        console.log(`✅ New user created via Google OAuth: ${email}`);
      } else {
        // Update googleId if not set
        if (!user.googleId) {
          await user.update({ googleId: profile.id, isVerified: true });
        }
        console.log(`✅ Existing user logged in via Google OAuth: ${email}`);
      }

      // Generate tokens
      const token = generateToken(user);
      const refreshTkn = generateRefreshToken(user);
      await user.update({ refreshToken: refreshTkn });

      // Pass user and tokens to callback
      return done(null, { user, token, refreshToken: refreshTkn });
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((data, done) => {
    done(null, data);
  });

  // Deserialize user from session
  passport.deserializeUser((data, done) => {
    done(null, data);
  });

  console.log('✅ Google OAuth strategy configured successfully');
} else {
  console.warn('⚠️ Google OAuth not configured - GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing');
}

module.exports = passport;
