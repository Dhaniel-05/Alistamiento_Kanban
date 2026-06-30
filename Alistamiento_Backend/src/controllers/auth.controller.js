const db = require('../config/conexion_db');
const config = require('../config/env');
const logger = require('../config/logger');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authService = require('../services/auth.service');
const { DUMMY_BCRYPT_HASH, INVALID_CREDENTIALS_RESPONSE } = require('../utils/authLogin.constants');

class AuthController {
  async login(req, res) {
    const { email, password } = req.body;

    try {
      const [instructores] = await db.query(
        `SELECT i.*, r.nombre AS rol
         FROM instructores i
         LEFT JOIN roles r ON i.id_rol = r.id_rol
         WHERE i.email = ?`,
        [email],
      );

      if (instructores.length === 0) {
        await bcrypt.compare(password, DUMMY_BCRYPT_HASH);
        logger.warn('Login rechazado: email no registrado', { email });
        return res.status(401).json(INVALID_CREDENTIALS_RESPONSE);
      }

      const instructor = instructores[0];
      const esValida = await bcrypt.compare(password, instructor.contrasena || DUMMY_BCRYPT_HASH);

      if (!esValida) {
        logger.warn('Login rechazado: contraseña inválida', {
          email,
          id_instructor: instructor.id_instructor,
        });
        return res.status(401).json(INVALID_CREDENTIALS_RESPONSE);
      }

      // Obtener permisos del rol (si los tiene)
      const [permisos] = await db.query(
        `SELECT p.nombre AS permiso
         FROM roles_permisos rp
         JOIN permisos p ON rp.id_permiso = p.id_permiso
         WHERE rp.id_rol = ?`,
        [instructor.id_rol]
      );

      // Generar token JWT
      const token = jwt.sign(
        { id: instructor.id_instructor, rol: instructor.rol },
        config.jwtSecret,
        { expiresIn: '2h' }
      );

      // ✅ AGREGAR: Verificar si existe la columna primer_acceso
      let primer_acceso = true; // Valor por defecto
      
      // Si la columna existe en la base de datos, usar su valor
      if (instructor.primer_acceso !== undefined) {
        primer_acceso = instructor.primer_acceso === 1;
      }

      // Respuesta al frontend
      res.json({
        mensaje: 'Inicio de sesión exitoso',
        token,
        instructor: {
          id: instructor.id_instructor,
          nombre: instructor.nombre,
          email: instructor.email,
          cedula: instructor.cedula,
          rol: instructor.rol || 'Sin rol',
          permisos: permisos.map(p => p.permiso),
          primer_acceso: primer_acceso // ✅ ENVIAR ESTE CAMPO
        }
      });
    } catch (error) {
      logger.error('Error en login', { stack: error.stack });
      res.status(500).json({ error: 'Error del servidor' });
    }
  }

  async me(req, res, next) {
    try {
      const instructor = await authService.obtenerSesionVigente(req.user.id);
      res.json({
        mensaje: 'Sesión vigente',
        instructor,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();