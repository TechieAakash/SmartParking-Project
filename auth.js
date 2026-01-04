// // const express = require('express');
// const bcrypt = require('bcryptjs');
// const { Op } = require('sequelize');
// const { User } = require('../models');
// const { generateToken, authenticate } = require('../middleware/auth');

const express = require('express');   // ✅ THIS WAS MISSING
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();



/**
 * ✅ REGISTER (SIGN UP)
 * POST /api/auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists'
      });
    }

    // Create user (password will be hashed automatically by model hook)
    const user = await User.create({
      username,
      email,
      password_hash: password,
      full_name,
      role: role || 'viewer'
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

/**
 * ✅ LOGIN
 * POST /api/auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username/email and password are required'
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          username ? { username } : null,
          email ? { email } : null
        ].filter(Boolean)
      }
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isMatch = await user.checkPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // ✅ Update last login ONLY here
    await user.update({ last_login: new Date() });

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * ✅ GET CURRENT USER
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user.toSafeObject()
  });
});

module.exports = router;
