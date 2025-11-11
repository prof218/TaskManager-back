
const jwt = require('jsonwebtoken');
const User = require('../models/User');
module.exports = async function(req, res, next) {
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded.user;
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user.role = user.role;
    req.user.isVerified = user.isVerified;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
