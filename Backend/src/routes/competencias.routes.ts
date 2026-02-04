/**
 * Rutas para Competencias y Drag & Drop
 * Para usar en Backend/src/routes/competencias.routes.ts
 */

import { Router } from 'express';
import { query, pool } from '../config/database';
import {
  getInstructoresPorCompetencia,
  getCompetenciasConInstructores,
} from '../controllers/competencias.controller';

const router: Router = Router();

/**
 * GET /api/competencias
 * Obtener todas las competencias
 */
router.get('/', async (req, res) => {
  try {
    const competencias = await query(`
      SELECT 
        c.id_competencia as id,
        c.codigo_competencia as codigo,
        c.nombre_competencia as nombre,
        c.duracion_competencia as horas,
        c.id_programa,
        p.titulo_obtenido as programa_nombre,
        p.codigo_programa as programa_codigo
      FROM competencias c
      LEFT JOIN programa_formativo p ON c.id_programa = p.id_programa
      ORDER BY c.codigo_competencia
    `);

    res.json({
      success: true,
      data: competencias
    });
  } catch (error) {
    console.error('Error al obtener competencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener competencias'
    });
  }
});



/**
 * PUT /api/competencias/:id/fase
 * Actualizar la fase de una competencia
 * 
 * Body: {
 *   faseBase: string,
 *   faseVista?: string
 * }
 */
router.put('/:id/fase', async (req, res) => {
  try {
    const { id } = req.params;
    const { faseBase, faseVista } = req.body;
    // Actualizar fases en TODOS los resultados asociados a esta competencia
    if (typeof faseBase === 'undefined' && typeof faseVista === 'undefined') {
      return res.status(400).json({ success: false, error: 'Se requiere faseBase y/o faseVista' });
    }

    const fields: string[] = [];
    const params: any[] = [];
    if (typeof faseBase !== 'undefined') {
      fields.push('fase_base = ?');
      params.push(faseBase || null);
    }
    if (typeof faseVista !== 'undefined') {
      fields.push('fase_vista = ?');
      params.push(faseVista || null);
    }

    params.push(id);

    await query(`UPDATE resultado_de_aprendizaje SET ${fields.join(', ')} WHERE id_competencia = ?`, params);

    res.json({ success: true, message: 'Fases de los resultados de la competencia actualizadas' });
  } catch (error) {
    console.error('Error al actualizar fase:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar fase'
    });
  }
});

/**
 * PUT /api/competencias/:id/estado
 * Actualizar el estado (Por Asignar, Por Iniciar, En Proceso, Terminado)
 * del conjunto de resultados asociados a una competencia.
 * Body: { estado: string }
 */
router.put('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ success: false, error: 'Se requiere campo estado en body' });
    }

    // estado column removed from resultado_de_aprendizaje - no se actualiza aquí
    // Si se necesita persistir estado, usar tabla separada o campo del contexto

    res.json({ success: true, message: 'Estado ya no se persiste en tabla de resultados (columna eliminada)' });
  } catch (error) {
    console.error('Error al actualizar estado de competencia:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar estado' });
  }
});

/**
 * POST /api/competencias
 * Crear una nueva competencia
 */
router.post('/', async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      horas,
      idPrograma,
      normaCompetencia,
      actividadProyecto,
      criteriosEvaluacion,
      conocimientosProceso,
      conocimientosSaber,
      idFicha // Optional: para asociar a una ficha específica
    } = req.body;

    if (!codigo || !nombre || !horas || !idPrograma) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: codigo, nombre, horas, idPrograma'
      });
    }

    const result: any = await query(`
      INSERT INTO competencias 
      (codigo_competencia, nombre_competencia, duracion_competencia, id_programa, 
       norma_competencia, id_ficha)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [codigo, nombre, horas, idPrograma,
      normaCompetencia || null, idFicha || null]);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        codigo,
        nombre,
        horas,
        idPrograma
      }
    });
  } catch (error: any) {
    console.error('Error al crear competencia:', error);

    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Ya existe una competencia con ese código'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al crear competencia: ' + (error.message || error)
    });
  }
});

/**
 * DELETE /api/competencias/:id
 * Eliminar una competencia
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Las relaciones en competencias_fases se eliminarán automáticamente 
    // por el ON DELETE CASCADE
    await query(`
      DELETE FROM competencias WHERE id_competencia = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Competencia eliminada correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar competencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar competencia'
    });
  }
});

// Obtener instructores de una competencia específica
router.get('/:id/instructores', getInstructoresPorCompetencia);

// Obtener todas las competencias con sus instructores
router.get('/con-instructores', getCompetenciasConInstructores);

/**
 * GET /api/competencias/:id/resultados
 * Obtener resultados asociados a una competencia
 */
router.get('/:id/resultados', async (req, res) => {
  try {
    const { id } = req.params;
    const { fichaId } = req.query;

    let whereClause = `WHERE r.id_competencia = ?`;
    let params: any[] = [id];

    // Si se proporciona fichaId, filtrar solo resultados de esa ficha
    if (fichaId) {
      whereClause += ` AND r.id_ficha = ?`;
      params.push(fichaId);
    }

    const resultados = await query(`
      SELECT
        r.id_resultado as id,
        r.nombre_resultado as nombre,
        NULL as codigo,
        NULL as estado,
        r.id_competencia,
        r.id_usuario,
        NULL as horas_resultado,
        r.fase_vista,
        c.nombre_competencia as competencia_nombre,
        u.nom_completo as instructor_nombre
      FROM resultado_de_aprendizaje r
      INNER JOIN competencias c ON r.id_competencia = c.id_competencia
      LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
      ${whereClause}
      ORDER BY r.nombre_resultado
    `, params);

    res.json({
      success: true,
      data: resultados
    });
  } catch (error) {
    console.error('Error al obtener resultados de competencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resultados'
    });
  }
});

export default router;
