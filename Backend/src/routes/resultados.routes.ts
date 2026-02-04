/**
 * Rutas para Resultados de Aprendizaje y Drag & Drop
 * Para usar en Backend/src/routes/resultados.routes.ts
 */

import { Router } from 'express';
import { query } from '../config/database';
import pool from '../config/database';

const router: Router = Router();

/**
 * GET /api/resultados
 * Obtener todos los resultados de aprendizaje con nombre_resultado y estado
 */
router.get('/', async (req, res) => {
  try {
    const resultados = await query(`
      SELECT 
        r.id_resultado as id,
        r.nombre_resultado as nombre,
        r.id_competencia as competencia_id,
        NULL as codigo,
        NULL as estado,
        NULL as horas_resultado,
        r.id_usuario,
        c.codigo_competencia as competencia_codigo,
        c.nombre_competencia as competencia_nombre,
        c.id_programa,
        p.codigo_programa as programa_codigo,
        p.nombre_programa as programa_nombre,
        u.nom_completo as instructor_nombre,
        r.fase_base as fase_base,
        r.fase_vista as fase_vista
      FROM resultado_de_aprendizaje r
      INNER JOIN competencias c ON r.id_competencia = c.id_competencia
      LEFT JOIN programa_formativo p ON c.id_programa = p.id_programa
      LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
      ORDER BY c.codigo_competencia, r.id_resultado
    `);

    res.json({
      success: true,
      data: resultados
    });
  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resultados'
    });
  }
});

/**
 * GET /api/resultados/:id
 * Obtener un resultado específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultados = await query(`
      SELECT 
        r.id_resultado as id,
        r.nombre_resultado as nombre,
        r.id_competencia as competencia_id,
        r.id_usuario,
        r.fase_base,
        r.fase_vista,
        r.culminado,
        -- Campos del resultado
        r.actividad_proyecto,
        r.conocimientos_saber,
        r.conocimientos_proceso,
        r.criterios_evaluacion,
        r.actividad_aprendizaje,
        r.evidencia_aprendizaje,
        r.estrategias_didacticas,
        r.materiales_formacion,
        -- Campos de la competencia
        c.codigo_competencia as competencia_codigo,
        c.nombre_competencia as competencia_nombre,
        c.id_programa,
        p.codigo_programa as programa_codigo,
        p.nombre_programa as programa_nombre,
        u.nom_completo as instructor_nombre
      FROM resultado_de_aprendizaje r
      INNER JOIN competencias c ON r.id_competencia = c.id_competencia
      LEFT JOIN programa_formativo p ON c.id_programa = p.id_programa
      LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_resultado = ?
    `, [id]);

    if (resultados.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Resultado no encontrado'
      });
    }

    res.json({
      success: true,
      data: resultados[0]
    });
  } catch (error) {
    console.error('Error al obtener resultado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener resultado'
    });
  }
});

/**
 * PUT /api/resultados/:id
 * Actualizar datos generales de un resultado
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      id_competencia,
      actividad_proyecto,
      conocimientos_saber,
      conocimientos_proceso,
      criterios_evaluacion,
      actividad_aprendizaje,
      evidencia_aprendizaje,
      estrategias_didacticas,
      materiales_formacion
    } = req.body;

    // Construir la query dinámicamente solo con los campos proporcionados
    const updates: string[] = [];
    const params: any[] = [];

    if (nombre !== undefined) {
      updates.push('nombre_resultado = ?');
      params.push(nombre);
    }
    if (id_competencia !== undefined) {
      updates.push('id_competencia = ?');
      params.push(id_competencia);
    }
    if (actividad_proyecto !== undefined) {
      updates.push('actividad_proyecto = ?');
      params.push(actividad_proyecto);
    }
    if (conocimientos_saber !== undefined) {
      updates.push('conocimientos_saber = ?');
      params.push(conocimientos_saber);
    }
    if (conocimientos_proceso !== undefined) {
      updates.push('conocimientos_proceso = ?');
      params.push(conocimientos_proceso);
    }
    if (criterios_evaluacion !== undefined) {
      updates.push('criterios_evaluacion = ?');
      params.push(criterios_evaluacion);
    }
    if (actividad_aprendizaje !== undefined) {
      updates.push('actividad_aprendizaje = ?');
      params.push(actividad_aprendizaje);
    }
    if (evidencia_aprendizaje !== undefined) {
      updates.push('evidencia_aprendizaje = ?');
      params.push(evidencia_aprendizaje);
    }
    if (estrategias_didacticas !== undefined) {
      updates.push('estrategias_didacticas = ?');
      params.push(estrategias_didacticas);
    }
    if (materiales_formacion !== undefined) {
      updates.push('materiales_formacion = ?');
      params.push(materiales_formacion);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionaron campos para actualizar'
      });
    }

    params.push(id);

    await query(`
      UPDATE resultado_de_aprendizaje
      SET ${updates.join(', ')}
      WHERE id_resultado = ?
    `, params);

    res.json({
      success: true,
      message: 'Resultado actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar resultado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar resultado'
    });
  }
});

/**
 * PUT /api/resultados/:id/phase
 * Actualizar `fase_base` y `fase_vista` de un resultado
 * Body: { fase_base?: string, fase_vista?: string }
 * Prioridad: fase_vista tiene prioridad; si no se proporciona fase_vista pero sí fase_base, 
 * se usa fase_base para ambos campos
 */
router.put('/:id/phase', async (req, res) => {
  try {
    const { id } = req.params;
    let { fase_base, fase_vista } = req.body;

    // Obtener valores actuales para logging
    const [current]: any = await query(`
      SELECT id_resultado, nombre_resultado, fase_base, fase_vista, id_competencia
      FROM resultado_de_aprendizaje 
      WHERE id_resultado = ?
    `, [id]);

    if (!current || current.length === 0) {
      return res.status(404).json({ success: false, error: 'Resultado no encontrado' });
    }

    const resultadoActual = current[0];
    const faseBaseAnterior = resultadoActual.fase_base || null;
    const faseVistaAnterior = resultadoActual.fase_vista || null;

    // Lógica de prioridad: fase_vista tiene prioridad
    // Si se proporciona fase_vista, usarla; si no, usar fase_base para ambos
    if (typeof fase_vista === 'undefined' && typeof fase_base !== 'undefined') {
      // Si solo se proporciona fase_base, usarlo para ambos campos
      fase_vista = fase_base;
    } else if (typeof fase_vista !== 'undefined' && typeof fase_base === 'undefined') {
      // Si solo se proporciona fase_vista, extraer fase_base (remover números al final)
      fase_base = fase_vista.replace(/[0-9]+$/, '').trim() || fase_vista;
    }

    if (typeof fase_base === 'undefined' && typeof fase_vista === 'undefined') {
      return res.status(400).json({ success: false, error: 'Se requiere fase_base y/o fase_vista' });
    }

    const fields: string[] = [];
    const params: any[] = [];

    if (typeof fase_base !== 'undefined') {
      fields.push('fase_base = ?');
      params.push(fase_base || null);
    }
    if (typeof fase_vista !== 'undefined') {
      fields.push('fase_vista = ?');
      params.push(fase_vista || null);
    }

    params.push(id);

    const [updateResult]: any = await query(
      `UPDATE resultado_de_aprendizaje SET ${fields.join(', ')} WHERE id_resultado = ?`,
      params
    );

    // Log del movimiento
    console.log(`[MOVIMIENTO RESULTADO] ID: ${id}, Resultado: "${resultadoActual.nombre_resultado?.substring(0, 50)}..."`);
    console.log(`  Fase anterior: base="${faseBaseAnterior}", vista="${faseVistaAnterior}"`);
    console.log(`  Fase nueva: base="${fase_base || 'null'}", vista="${fase_vista || 'null'}"`);
    console.log(`  Competencia ID: ${resultadoActual.id_competencia}`);
    console.log(`  Filas afectadas: ${updateResult.affectedRows}`);

    res.json({
      success: true,
      message: 'Fase actualizada (fase_base/fase_vista) correctamente',
      data: {
        id_resultado: parseInt(id),
        fase_base: fase_base || null,
        fase_vista: fase_vista || null,
        anterior: {
          fase_base: faseBaseAnterior,
          fase_vista: faseVistaAnterior
        }
      }
    });
  } catch (error) {
    console.error('Error al actualizar fase de resultado (phase):', error);
    res.status(500).json({ success: false, error: 'Error al actualizar fase' });
  }
});

/**
 * PUT /api/resultados/:id/fase
 * Actualizar fase_vista y fase_base desde el drag-and-drop del Kanban
 * Body: { fase_id: number | null }
 * Mapeo: 1=analisis, 2=planeacion, 3=ejecucion, 4=evaluacion, null/999=sin asignar
 */
router.put('/:id/fase', async (req, res) => {
  try {
    const { id } = req.params;
    const { fase_id } = req.body;

    // Mapear fase_id numérico a nombre de fase_vista
    const faseMap: Record<number, string | null> = {
      1: 'analisis',
      2: 'planeacion',
      3: 'ejecucion',
      4: 'evaluacion',
      999: null  // Sin Asignar
    };

    let faseVista: string | null;

    if (fase_id === null || fase_id === undefined || fase_id === 999) {
      faseVista = null;
    } else {
      faseVista = faseMap[fase_id];
      if (faseVista === undefined) {
        return res.status(400).json({ success: false, error: 'fase_id inválido' });
      }
    }

    // Actualizar tanto fase_vista como fase_base con el mismo valor
    await query(
      `UPDATE resultado_de_aprendizaje 
       SET fase_vista = ?, fase_base = ? 
       WHERE id_resultado = ?`,
      [faseVista, faseVista, id]
    );

    console.log(`[DRAG&DROP] Resultado ${id} movido a fase: ${faseVista || 'sin asignar'}`);

    res.json({
      success: true,
      message: 'Fase actualizada correctamente',
      data: {
        id_resultado: parseInt(id),
        fase_vista: faseVista,
        fase_base: faseVista,
        fase_id: fase_id === null || fase_id === 999 ? null : fase_id
      }
    });
  } catch (error) {
    console.error('Error al actualizar fase de resultado:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar fase' });
  }
});

/**
 * PUT /api/resultados/:id/estado
 * Actualizar el estado de un resultado
 * 
 * Body: {
 *   estado: 'Por Asignar' | 'Por Iniciar' | 'En Proceso' | 'Terminado'
 * }
 */
router.put('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['Por Asignar', 'Por Iniciar', 'En Proceso', 'Terminado'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        error: `Estado inválido. Debe ser uno de: ${estadosValidos.join(', ')}`
      });
    }

    await query(`
      UPDATE resultado_de_aprendizaje
      SET estado = ?
      WHERE id_resultado = ?
    `, [estado, id]);

    res.json({
      success: true,
      message: 'Estado actualizado correctamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar estado'
    });
  }
});

/**
 * PUT /api/resultados/:id/instructor
 * Asignar instructor a un resultado
 * 
 * Body: {
 *   instructorId: number
 * }
 */
router.put('/:id/instructor', async (req, res) => {
  try {
    const { id } = req.params;
    const { instructorId } = req.body;

    // Si instructorId es null o 'none', quitar la asignación
    if (!instructorId || instructorId === 'none' || instructorId === null) {
      await query(`
        UPDATE resultado_de_aprendizaje
        SET instructor_asignado = NULL
        WHERE id_resultado = ?
      `, [id]);

      return res.json({
        success: true,
        message: 'Asignación de instructor removida correctamente'
      });
    }

    // Verificar que el instructor existe y tiene rol de Instructor
    const instructor = await query(`
      SELECT id_usuario, rol, nom_completo
      FROM usuarios 
      WHERE id_usuario = ?
    `, [instructorId]);

    if (instructor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Instructor no encontrado'
      });
    }

    if (instructor[0].rol !== 'Instructor' && instructor[0].rol !== 'SuperUsuario') {
      return res.status(400).json({
        success: false,
        error: 'El usuario no tiene rol de instructor'
      });
    }

    const instructorNombre = instructor[0].nom_completo;

    // Actualizar resultado con instructor_asignado
    await query(`
      UPDATE resultado_de_aprendizaje
      SET instructor_asignado = ?
      WHERE id_resultado = ?`,
      [instructorId || null, id]
    );

    res.json({
      success: true,
      data: {
        instructor_asignado: instructorId,
        instructor_nombre: instructorNombre
      }
    });
  } catch (error) {
    console.error('Error asignando instructor:', error);
    res.status(500).json({ success: false, error: 'Error al asignar instructor' });
  }
});

/**
 * POST /api/resultados
 * Crear un nuevo resultado de aprendizaje
 */
router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      idCompetencia,
      faseBase,
      faseVista,
      conocimientosSaber,
      conocimientosProceso,
      actividadAprendizaje,
      evidenciaAprendizaje,
      idFicha
    } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el nombre del resultado'
      });
    }

    // Log del payload para facilitar depuración cuando haya 500
    console.log('[CREAR RESULTADO] Payload:', {
      nombre,
      idCompetencia,
      faseBase,
      faseVista,
      idFicha
    });

    const result: any = await query(`
      INSERT INTO resultado_de_aprendizaje 
      (nombre_resultado, id_competencia, id_ficha, fase_base, fase_vista, conocimientos_saber, conocimientos_proceso, actividad_aprendizaje, evidencia_aprendizaje)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nombre,
      idCompetencia,
      idFicha || null,
      faseBase || null,
      faseVista || null,
      conocimientosSaber || null,
      conocimientosProceso || null,
      actividadAprendizaje || null,
      evidenciaAprendizaje || null
    ]);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        nombre,
        idCompetencia
      }
    });
  } catch (error) {
    console.error('Error al crear resultado:', error);
    // Mostrar mensaje más detallado en desarrollo para ayudar a depurar
    const errMsg = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      success: false,
      error: 'Error al crear resultado: ' + errMsg, // Expose error for debugging
      message: errMsg
    });
  }
});

/**
 * DELETE /api/resultados/:id
 * Eliminar un resultado
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await query(`
      DELETE FROM resultado_de_aprendizaje WHERE id_resultado = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Resultado eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar resultado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar resultado'
    });
  }
});

export default router;
