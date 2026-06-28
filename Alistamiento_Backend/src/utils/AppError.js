class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true, code = undefined, responseBody = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.responseBody = responseBody;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
