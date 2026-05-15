const jwt = require('jsonwebtoken');

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

module.exports = { signToken, verifyToken };
