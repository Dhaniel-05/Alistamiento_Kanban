const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(new AppError('Recurso no encontrado', 404));
}

module.exports = notFound;
