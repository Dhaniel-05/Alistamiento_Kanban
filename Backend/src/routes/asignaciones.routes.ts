/**
 * Rutas para Asignación de Fichas a Usuarios
 */

import { Router } from 'express';
import { query, pool } from '../config/database';
import requireAuth from '../middleware/auth.middleware';

const router: Router = Router();

// Proteger todas las rutas
router.use(requireAuth);

/**
 * POST /api/asignaciones
 * Asignar una ficha a un usuario
 * Body: { id_usuario: number, id_ficha: number, rol_ficha?: string }
 */
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { id_usuario, id_ficha, rol_ficha } = req.body;

    if (!id_usuario || !id_ficha) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren id_usuario e id_ficha'
      });
    }

    await connection.beginTransaction();

    // Verificar que el usuario existe
    const [usuarios]: any = await connection.query(
      'SELECT id_usuario FROM usuarios WHERE id_usuario = ?',
      [id_usuario]
    );

    if (usuarios.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar que la ficha existe
    const [fichas]: any = await connection.query(
      'SELECT id_ficha FROM fichas WHERE id_ficha = ?',
      [id_ficha]
    );

    if (fichas.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Ficha no encontrada'
      });
    }

    // Verificar si ya existe la asignación
    const [existentes]: any = await connection.query(
      'SELECT id_asignar_crear FROM asignar_crear_fichas WHERE id_usuario = ? AND id_ficha = ?',
      [id_usuario, id_ficha]
    );

    if (existentes.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: 'Esta ficha ya está asignada a este usuario'
      });
    }

    // Crear la asignación
    const [result]: any = await connection.query(
      'INSERT INTO asignar_crear_fichas (id_usuario, id_ficha, rol_ficha) VALUES (?, ?, ?)',
      [id_usuario, id_ficha, rol_ficha || null]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      data: {
        id_asignacion: result.insertId,
        id_usuario,
        id_ficha,
        rol_ficha
      }
    });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al asignar ficha:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al asignar ficha'
    });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/asignaciones/ficha/:id_ficha
 * Obtener usuarios asignados a una ficha
 */
router.get('/ficha/:id_ficha', async (req, res) => {
  try {
    const { id_ficha } = req.params;

    const asignaciones = await query(`
      SELECT
        ac.id_asignar_crear as id,
        ac.id_usuario,
        ac.id_ficha,
        ac.rol_ficha,
        u.nom_completo as usuario_nombre,
        u.num_ident as usuario_identificacion,
        u.correo as usuario_correo,
        u.rol as usuario_rol
      FROM asignar_crear_fichas ac
      INNER JOIN usuarios u ON ac.id_usuario = u.id_usuario
      WHERE ac.id_ficha = ?
    `, [id_ficha]);

    res.json({
      success: true,
      data: asignaciones
    });
  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener asignaciones'
    });
  }
});

/**
 * GET /api/asignaciones/usuario/:id_usuario
 * Obtener fichas asignadas a un usuario
 */
router.get('/usuario/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const asignaciones = await query(`
      SELECT
        ac.id_asignar_crear as id,
        ac.id_usuario,
        ac.id_ficha,
        ac.rol_ficha,
        f.codigo_ficha,
        f.nombre_ficha,
        f.estado,
        f.jornada,
        f.modalidad_formacion,
        p.titulo_obtenido as programa_nombre
      FROM asignar_crear_fichas ac
      INNER JOIN fichas f ON ac.id_ficha = f.id_ficha
      LEFT JOIN programa_formativo p ON f.id_programa = p.id_programa
      WHERE ac.id_usuario = ?
    `, [id_usuario]);

    res.json({
      success: true,
      data: asignaciones
    });
  } catch (error) {
    console.error('Error al obtener fichas del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener fichas del usuario'
    });
  }
});

/**
 * DELETE /api/asignaciones/:id
 * Eliminar una asignación
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await query(
      'DELETE FROM asignar_crear_fichas WHERE id_asignar_crear = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Asignación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar asignación:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar asignación'
    });
  }
});

export default router;

