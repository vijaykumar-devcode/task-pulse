const User = require('../models/User');
const { verifyToken } = require('../utils/jwt');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub).select('_id email role');

  if (!user) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.user = user;
  next();
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
};

module.exports = { authenticate, authorizeRoles };
