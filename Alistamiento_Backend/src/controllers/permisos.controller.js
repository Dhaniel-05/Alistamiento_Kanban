const db = require('../config/conexion_db');
const logger = require('../config/logger');

const PERMISO_PROJECTION = 'id_permiso, nombre, descripcion';

class PermisosController {
  async obtenerPermisos(req, res) {
    try {
      const [permisos] = await db.query(
        `SELECT ${PERMISO_PROJECTION} FROM permisos ORDER BY nombre`,
      );
      res.json(permisos);
    } catch (error) {
      logger.error('Error en operación de permisos', { stack: error.stack });
      res.status(500).json({ error: 'Error al obtener permisos' });
    }
  }

  async obtenerPermisoPorId(req, res) {
    const { id } = req.params;
    try {
      const [permiso] = await db.query(
        `SELECT ${PERMISO_PROJECTION} FROM permisos WHERE id_permiso = ?`,
        [id],
      );
      if (permiso.length === 0) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }
      res.json(permiso[0]);
    } catch (error) {
      logger.error('Error en operación de permisos', { stack: error.stack });
      res.status(500).json({ error: 'Error al obtener permiso' });
    }
  }

  async agregarPermiso(req, res) {
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del permiso es obligatorio' });
    }

    try {
      const [result] = await db.query(
        'INSERT INTO permisos (nombre, descripcion) VALUES (?, ?)',
        [nombre.trim(), descripcion?.trim() || null],
      );
      res.json({
        mensaje: 'Permiso agregado correctamente',
        id_permiso: result.insertId,
      });
    } catch (error) {
      logger.error('Error en operación de permisos', { stack: error.stack });
      res.status(500).json({ error: 'Error al agregar permiso' });
    }
  }

  async actualizarPermiso(req, res) {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del permiso es obligatorio' });
    }

    try {
      const [result] = await db.query(
        'UPDATE permisos SET nombre = ?, descripcion = ? WHERE id_permiso = ?',
        [nombre.trim(), descripcion?.trim() || null, id],
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }
      res.json({ mensaje: 'Permiso actualizado correctamente' });
    } catch (error) {
      logger.error('Error en operación de permisos', { stack: error.stack });
      res.status(500).json({ error: 'Error al actualizar permiso' });
    }
  }

  async eliminarPermiso(req, res) {
    const { id } = req.params;
    try {
      const [result] = await db.query('DELETE FROM permisos WHERE id_permiso = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Permiso no encontrado' });
      }
      res.json({ mensaje: 'Permiso eliminado correctamente' });
    } catch (error) {
      logger.error('Error en operación de permisos', { stack: error.stack });
      res.status(500).json({ error: 'Error al eliminar permiso' });
    }
  }
}

module.exports = PermisosController;
