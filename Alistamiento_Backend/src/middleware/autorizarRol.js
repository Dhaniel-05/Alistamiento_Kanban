const AppError = require('../utils/AppError');

const ROLES = Object.freeze({
  ADMIN: 'Administrador',
  INSTRUCTOR: 'Instructor',
  GESTOR: 'Gestor',
});

/**
 * @param {...string} rolesPermitidos - Roles de BD: Administrador | Instructor | Gestor
 */
function autorizarRol(...rolesPermitidos) {
  return (req, res, next) => {
    const rol = req.user?.rol;

    if (!rol) {
      return next(new AppError('Acceso denegado: rol no identificado', 403));
    }

    if (!rolesPermitidos.includes(rol)) {
      return next(new AppError('Acceso denegado: rol no autorizado', 403));
    }

    return next();
  };
}

/**
 * Permite acceso si req.user.id coincide con req.params[paramName];
 * en caso contrario exige uno de los roles indicados.
 * @param {string} paramName
 * @param {...string} rolesPermitidos
 */
function autorizarPropietarioORol(paramName, ...rolesPermitidos) {
  return (req, res, next) => {
    const resourceId = Number(req.params[paramName]);
    const userId = Number(req.user?.id);

    if (Number.isFinite(resourceId) && Number.isFinite(userId) && resourceId === userId) {
      return next();
    }

    return autorizarRol(...rolesPermitidos)(req, res, next);
  };
}

/**
 * Propietario del recurso, roles privilegiados o permiso de lectura (p. ej. instructor.leer).
 */
function autorizarPropietarioRolOPermiso(paramName, permiso, ...rolesPermitidos) {
  return (req, res, next) => {
    const resourceId = Number(req.params[paramName]);
    const userId = Number(req.user?.id);

    if (Number.isFinite(resourceId) && Number.isFinite(userId) && resourceId === userId) {
      return next();
    }

    const rol = req.user?.rol;
    if (rol && rolesPermitidos.includes(rol)) {
      return next();
    }

    return autorizarPermiso(permiso)(req, res, next);
  };
}

module.exports = autorizarRol;
module.exports.autorizarPropietarioORol = autorizarPropietarioORol;
module.exports.autorizarPropietarioRolOPermiso = autorizarPropietarioRolOPermiso;
module.exports.ROLES = ROLES;
