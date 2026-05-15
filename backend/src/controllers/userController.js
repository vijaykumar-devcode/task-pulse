const User = require('../models/User');
const tryCatch = require('../utils/tryCatch');

const sanitizeUser = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const listUsers = tryCatch(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const search = req.query.search?.trim();
  const role = req.query.role;

  const filter = {};
  if (search) {
    filter.email = { $regex: search, $options: 'i' };
  }
  if (role) {
    filter.role = role;
  }

  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('_id email role createdAt updatedAt'),
    User.countDocuments(filter),
  ]);

  return res.json({
    items: users.map(sanitizeUser),
    page,
    limit,
    total,
    pages: Math.max(Math.ceil(total / limit), 1),
  });
});

const getUser = tryCatch(async (req, res) => {
  const { id } = req.params;
  const isOwner = req.user._id.toString() === id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = await User.findById(id).select('_id email role createdAt updatedAt');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({ user: sanitizeUser(user) });
});

const createUser = tryCatch(async (req, res) => {
  const { email, password, role } = req.body;
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = await User.create({ email, password, role: role || 'user' });
  return res.status(201).json({ user: sanitizeUser(user) });
});

const updateUser = tryCatch(async (req, res) => {
  const { id } = req.params;
  const isOwner = req.user._id.toString() === id;
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const user = await User.findById(id).select('+password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (typeof req.body.email === 'string') {
    user.email = req.body.email;
  }
  if (typeof req.body.password === 'string' && req.body.password.trim()) {
    user.password = req.body.password;
  }
  if (isAdmin && req.body.role) {
    user.role = req.body.role;
  }

  await user.save();
  return res.json({ user: sanitizeUser(user) });
});

const deleteUser = tryCatch(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const deletedUser = await User.findByIdAndDelete(req.params.id);
  if (!deletedUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(204).send();
});

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser, sanitizeUser };
