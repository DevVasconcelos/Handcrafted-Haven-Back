const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, null, false, error.stack);
  }

  const errorLog = {
    message: error.message,
    statusCode: error.statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: error.stack,
  };

  if (error.statusCode >= 500) {
    logger.error('Server Error', errorLog);
  } else if (process.env.NODE_ENV === 'development') {
    logger.warn('Client Error', errorLog);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.details && { errors: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};

const notFound = (req, res, next) => {
  const error = ApiError.notFound(`Rota não encontrada: ${req.originalUrl}`);
  next(error);
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};
