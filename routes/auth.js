
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { sendMail } = require('../utils/mailer');

const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES_DAYS = 30;

function genAccess(user) {
  const payload = { user: { id: user.id } };
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: ACCESS_EXPIRES });
}

function genRefreshTokenString() {
  return require('crypto').randomBytes(40).toString('hex');
}

// Signup - now sends verification email
router.post('/signup', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    user = new User({ name, email, password, isVerified: false });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    // send verification email
    try {
      const token = jwt.sign({ user: { id: user.id }, type: 'verify' }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      const url = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify?token=${token}`;
      const html = `<p>Hello ${user.name},</p>
        <p>Click to verify your email: <a href="${url}">${url}</a></p>`;
      await sendMail(user.email, 'Verify your email', html);
    } catch (e) {
      console.error('Failed to send verification email', e);
    }

    // create refresh token
    const refreshString = genRefreshTokenString();
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS*24*60*60*1000);
    const r = await RefreshToken.create({ token: refreshString, user: user._id, expiresAt });

    const access = genAccess(user);
    res.json({ token: access, refreshToken: refreshString, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Signin - returns refresh token
router.post('/signin', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const access = genAccess(user);
    const refreshString = genRefreshTokenString();
    const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_DAYS*24*60*60*1000);
    await RefreshToken.create({ token: refreshString, user: user._id, expiresAt });

    res.json({ token: access, refreshToken: refreshString, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'No refresh token' });
  try {
    const stored = await RefreshToken.findOne({ token: refreshToken }).populate('user');
    if (!stored) return res.status(401).json({ message: 'Invalid refresh token' });
    if (new Date() > stored.expiresAt) {
      await stored.remove();
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    const access = genAccess(stored.user);
    res.json({ token: access, user: { id: stored.user.id, name: stored.user.name, email: stored.user.email, role: stored.user.role, isVerified: stored.user.isVerified } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Logout - revoke refresh token
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'No refresh token' });
  try {
    await RefreshToken.deleteOne({ token: refreshToken });
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Email verification endpoint
router.get('/verify', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('Invalid token');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (!decoded.type || decoded.type !== 'verify') return res.status(400).send('Invalid token type');
    const userId = decoded.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');
    user.isVerified = true;
    await user.save();
    // redirect to client to a success page
    return res.redirect((process.env.CLIENT_URL || 'http://localhost:5173') + '/verify-success');
  } catch (err) {
    console.error(err);
    return res.status(400).send('Verification failed or token expired');
  }
});

module.exports = router;
