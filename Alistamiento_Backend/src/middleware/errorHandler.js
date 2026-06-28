const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  const correlationId = crypto.randomUUID();
  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  logger.error(err.message || 'Unhandled error', {
    correlationId,
    name: err.name,
    code: err.code,
    stack: err.stack,
    sql: err.sql,
    sqlMessage: err.sqlMessage,
    errno: err.errno,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
  });

  if (err.isOperational) {
    if (err.responseBody) {
      return res.status(statusCode).json(err.responseBody);
    }
    const body = { error: err.message };
    if (err.code) body.code = err.code;
    if (config.nodeEnv === 'development' && err.details) {
      body.details = err.details;
    }
    return res.status(statusCode).json(body);
  }

  return res.status(statusCode).json({
    error: 'Error interno del servidor',
    correlationId,
  });
}

module.exports = errorHandler;
