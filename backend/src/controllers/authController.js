const User = require('../models/User');
const tryCatch = require('../utils/tryCatch');
const { signToken } = require('../utils/jwt');

const buildAuthResponse = (user) => ({
  token: signToken(user),
  user: {
    id: user._id,
    email: user.email,
    role: user.role,
  },
});

const register = tryCatch(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const user = await User.create({
    email,
    password,
    role: role === 'admin' && req.user?.role === 'admin' ? 'admin' : 'user',
  });

  return res.status(201).json(buildAuthResponse(user));
});

const login = tryCatch(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  return res.json(buildAuthResponse(user));
});

const me = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id).select('_id email role createdAt updatedAt');
  return res.json({ user });
});

module.exports = { register, login, me };
