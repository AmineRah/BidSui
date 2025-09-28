/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Internal Server Error',
    status: 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      success: false,
      message: `Validation Error: ${message}`,
      status: 400
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      message: `${field} already exists`,
      status: 400
    };
  }

  // Cast error
  if (err.name === 'CastError') {
    error = {
      success: false,
      message: 'Resource not found',
      status: 404
    };
  }

  // Sui transaction error
  if (err.message?.includes('Transaction failed')) {
    error = {
      success: false,
      message: 'Blockchain transaction failed',
      status: 400,
      details: err.message
    };
  }

  // Sui object not found error
  if (err.message?.includes('not found')) {
    error = {
      success: false,
      message: err.message,
      status: 404
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      status: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      status: 401
    };
  }

  // Rate limit error
  if (err.message?.includes('Too many requests')) {
    error = {
      success: false,
      message: err.message,
      status: 429
    };
  }

  // File upload error
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      success: false,
      message: 'File too large',
      status: 413
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      success: false,
      message: 'Unexpected file field',
      status: 400
    };
  }

  // Custom application errors
  if (err.status) {
    error.status = err.status;
    error.message = err.message;
  }

  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = err;
  }

  res.status(error.status).json(error);
}
