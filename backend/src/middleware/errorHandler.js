function notFound(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function logError(err, req) {
  console.error('\n--- API ERROR ---');
  console.error('Route:', req.method, req.originalUrl);
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('-----------------\n');
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.statusCode) {
    if (err.statusCode >= 500) {
      logError(err, req);
    }
    const body = { message: err.message };
    if (err.code) {
      body.code = err.code;
    }
    return res.status(err.statusCode).json(body);
  }

  if (err.name === 'ValidationError') {
    const errors = {};
    Object.values(err.errors).forEach((e) => {
      errors[e.path] = e.message;
    });
    return res.status(400).json({
      message: 'Validation failed',
      errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({
      message: `${field} already exists`
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Invalid JSON in request body'
    });
  }

  logError(err, req);
  res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };