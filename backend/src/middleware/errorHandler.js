const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const uploadError = err.code && err.code.startsWith('LIMIT_');
  const invalidFileError = err.message && err.message.includes('Only PDF documents are allowed');
  const statusCode = err.statusCode || (uploadError || invalidFileError ? 400 : 500);
  const message = err.message || 'Internal server error';

  return res.status(statusCode).json({ message });
};

module.exports = errorHandler;
