
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// middleware ensures admin
router.use(auth);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
});

// list users
router.get('/users', async (req, res) => {
  const users = await User.find().select('-password');
  res.json({ users });
});

// update user role
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  if (!['admin','user'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.role = role;
  await user.save();
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
});

module.exports = router;
