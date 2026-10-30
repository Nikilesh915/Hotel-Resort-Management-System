import { AppError } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle Mongoose Duplicate Key Error (e.g. Unique index on room_daily_allocations, idempotency_key, email)
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY_CONFLICT';
    const fields = Object.keys(err.keyPattern || {});
    if (fields.includes('room_id') && fields.includes('date')) {
      message = 'Selected room is no longer available for the requested dates';
      code = 'ROOM_ALREADY_RESERVED';
    } else if (fields.includes('idempotency_key')) {
      message = 'Duplicate transaction key detected';
      code = 'DUPLICATE_TRANSACTION';
    } else {
      message = `Duplicate value for field(s): ${fields.join(', ')}`;
    }
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
  }

  // Handle JWT Error
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  if (process.env.NODE_ENV !== 'test' && statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    }
  });
};
