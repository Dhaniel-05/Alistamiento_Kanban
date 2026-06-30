const db = require('../config/conexion_db');
const AppError = require('../utils/AppError');

/**
 * Exige al menos uno de los permisos indicados (consulta roles_permisos por usuario del token).
 * Administrador siempre pasa.
 * @param {...string} permisosRequeridos
 */
function autorizarPermiso(...permisosRequeridos) {
  return async (req, res, next) => {
    try {
      if (req.user?.rol === 'Administrador') {
        return next();
      }

      const userId = req.user?.id;
      if (!userId) {
        return next(new AppError('Acceso denegado: usuario no identificado', 403, true, 'AUTH_REQUIRED'));
      }

      const [rows] = await db.query(
        `SELECT p.nombre
         FROM instructores i
         JOIN roles_permisos rp ON rp.id_rol = i.id_rol
         JOIN permisos p ON p.id_permiso = rp.id_permiso
         WHERE i.id_instructor = ?`,
        [userId],
      );

      const permisosUsuario = rows.map((row) => row.nombre);
      const autorizado = permisosRequeridos.some((permiso) => permisosUsuario.includes(permiso));

      if (!autorizado) {
        return next(new AppError('Acceso denegado: permiso insuficiente', 403, true, 'FORBIDDEN'));
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = autorizarPermiso;
