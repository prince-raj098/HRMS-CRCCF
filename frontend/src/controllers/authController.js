const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: 'Username and password required.' });

    // Case-insensitive lookup and trimming for username
    const cleanUsername = username.trim();
    const user = await User.findOne({ username: new RegExp(`^${cleanUsername}$`, 'i') }).populate('employee');
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    const isMatch = await user.correctPassword(password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    await user.constructor.updateOne({ _id: user._id }, { lastLogin: new Date() });

    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
        employee: user.employee,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'Both passwords required.' });

    const user = await User.findById(req.user._id);
    const isMatch = await user.correctPassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

    user.password = newPassword;
    user.isFirstLogin = false;
    user.passwordResetAt = new Date();
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};
