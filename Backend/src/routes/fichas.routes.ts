/**
 * Rutas para Fichas
 * Para usar en Backend/src/routes/fichas.routes.ts
 */

import { Router } from 'express';
import { query } from '../config/database';
import requireAuth from '../middleware/auth.middleware';
import * as fichasController from '../controllers/fichas.controller';

const router: Router = Router();

// proteger rutas de fichas (panel admin)
router.use(requireAuth);

/**
 * GET /api/fichas
 * Obtener fichas:
 * - Si es SuperUsuario: todas las fichas
 * - Si no es SuperUsuario: solo fichas asignadas al usuario
 */
router.get('/', async (req: any, res) => {
  try {
    const user = req.user; // Obtenido del middleware requireAuth
    const isAdmin = user?.rol === 'SuperUsuario' || user?.rol?.toLowerCase() === 'admin';

    // Filtros soportados: programaId, jornada, estado, q (texto), page, limit
    const { programaId, jornada, estado, q, page = '1', limit = '50' } = req.query as any;
    const where: string[] = [];
    const params: any[] = [];

    // Si no es admin, filtrar solo fichas asignadas al usuario
    if (!isAdmin && user?.id_usuario) {
      // Para instructores: fichas donde tienen resultados asignados O fichas asignadas directamente
      if (user.rol === 'Instructor') {
        where.push(`(
          f.id_ficha IN (
            SELECT DISTINCT id_ficha FROM asignar_crear_fichas WHERE id_usuario = ?
          )
          OR f.id_ficha IN (
            SELECT DISTINCT f2.id_ficha 
            FROM fichas f2
            INNER JOIN competencias c ON f2.id_programa = c.id_programa
            INNER JOIN resultado_de_aprendizaje r ON c.id_competencia = r.id_competencia
            WHERE r.id_usuario = ?
          )
        )`);
        params.push(user.id_usuario, user.nom_completo);
      } else {
        // Para otros roles no-admin: solo fichas asignadas directamente
        where.push(`f.id_ficha IN (
          SELECT id_ficha FROM asignar_crear_fichas WHERE id_usuario = ?
        )`);
        params.push(user.id_usuario);
      }
    }

    if (programaId) {
      where.push('f.id_programa = ?');
      params.push(Number(programaId));
    }
    if (jornada) {
      where.push('f.jornada = ?');
      params.push(jornada);
    }
    if (estado) {
      where.push('f.estado = ?');
      params.push(estado);
    }
    if (q) {
      where.push('(f.codigo_ficha LIKE ? OR f.nombre_ficha LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }

    // Asegurar que limit y page sean números enteros válidos
    const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 50));
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const offset = (pageNum - 1) * limitNum;

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Interpolar limit y offset directamente en el SQL (ya están validados)
    const sql = `
      SELECT
        f.id_ficha as id,
        f.id_ficha,
        f.codigo_ficha as codigo,
        f.codigo_ficha,
        f.nombre_ficha as nombre,
        f.nombre_ficha,
        f.ambiente,
        f.modalidad_formacion as modalidad,
        f.modalidad_formacion,
        f.jornada,
        f.estado,
        f.fecha_inicio,
        f.fecha_fin,
        f.id_programa,
        p.titulo_obtenido as programa_nombre,
        p.codigo_programa as programa_codigo
      FROM fichas f
      LEFT JOIN programa_formativo p ON f.id_programa = p.id_programa
      ${whereSql}
      ORDER BY COALESCE(f.fecha_inicio, '1900-01-01') DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    // Construir array de parámetros correctamente - solo para WHERE
    const queryParams: any[] = [];
    if (params.length > 0) {
      queryParams.push(...params);
    }

    // Log para depuración
    console.log('🔍 Usuario:', user?.id_usuario, 'Rol:', user?.rol, 'Es Admin:', isAdmin);
    console.log('🔍 Query params:', queryParams);
    console.log('🔍 Limit:', limitNum, 'Offset:', offset);

    const results = await query(sql, queryParams);

    res.json({ success: true, data: results });

  } catch (error) {
    console.error('Error al obtener fichas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener fichas'
    });
  }
});

/**
 * GET /api/fichas/:id
 * Obtener una ficha específica
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const fichas = await query(`
      SELECT
        f.id_ficha as id,
        f.codigo_ficha as codigo,
        f.nombre_ficha as nombre,
        f.ambiente,
        f.jornada,
        f.estado,
        f.fecha_inicio,
        f.fecha_fin,
        f.id_programa,
        p.titulo_obtenido as programa_nombre,
        p.codigo_programa as programa_codigo,
        p.version as programa_version
      FROM fichas f
      LEFT JOIN programa_formativo p ON f.id_programa = p.id_programa
      WHERE f.id_ficha = ?
    `, [id]);

    if (fichas.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ficha no encontrada'
      });
    }

    res.json({
      success: true,
      data: fichas[0]
    });
  } catch (error) {
    console.error('Error al obtener ficha:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener ficha'
    });
  }
});

/**
 * GET /api/fichas/:id/competencias
 * Obtener TODAS las competencias del programa de la ficha
 */
router.get('/:id/competencias', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener competencias del programa asociado a la ficha
    // Calcular estado automáticamente basado en resultados culminados:
    // - Si todos los resultados están culminados -> "Terminado"
    // - Si al menos uno está culminado -> "En Progreso"
    // - Si ninguno está culminado -> "Por Asignar"
    const competencias = await query(`
      SELECT
        c.id_competencia as id,
        c.codigo_competencia as codigo,
        c.nombre_competencia as nombre,
        c.norma_competencia,
        c.duracion_competencia as horas,
        c.id_programa,
        GROUP_CONCAT(DISTINCT CONCAT(u.id_usuario, ':', u.nom_completo) SEPARATOR '||') as instructores,
        GROUP_CONCAT(DISTINCT r.fase_vista SEPARATOR '||') as fases_vista,
        GROUP_CONCAT(DISTINCT r.fase_base SEPARATOR '||') as fases_base,
        NULL as estados,
        COUNT(DISTINCT r.id_resultado) as total_resultados,
        -- Estado de competencia ya no se calcula basado en resultado.estado (columna eliminada)
        CASE
          WHEN COUNT(DISTINCT r.id_resultado) = 0 THEN 'Por Asignar'
          WHEN SUM(CASE WHEN r.culminado = 1 THEN 1 ELSE 0 END) = COUNT(DISTINCT r.id_resultado) THEN 'Terminado'
          WHEN SUM(CASE WHEN r.culminado = 1 THEN 1 ELSE 0 END) > 0 THEN 'En Progreso'
          ELSE 'Por Iniciar'
        END as estado_competencia
      FROM fichas f
      INNER JOIN competencias c ON f.id_programa = c.id_programa AND c.id_ficha = ?
      LEFT JOIN resultado_de_aprendizaje r ON c.id_competencia = r.id_competencia
        AND r.id_ficha = ?
      LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE f.id_ficha = ?
      GROUP BY c.id_competencia, c.codigo_competencia, c.nombre_competencia, c.norma_competencia, c.duracion_competencia, 
           c.id_programa
      ORDER BY c.codigo_competencia, c.id_competencia
    `, [id, id, id]);

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
 * GET /api/fichas/:id/resultados
 * Obtener resultados de aprendizaje específicos de esta ficha
 * 
 * IMPORTANTE: Solo muestra resultados con id_ficha = :id
 * - Cuando se crea una ficha, se duplican las competencias/resultados del programa
 * - Después solo se muestran los específicos de esta ficha
 * - Si se agrega una nueva competencia/resultado al programa DESPUÉS de crear la ficha,
 *   NO aparecerá en esta ficha (solo en nuevas fichas creadas después)
 */
router.get('/:id/resultados', async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener SOLO resultados específicos de esta ficha (id_ficha = :id)
    const resultados = await query(`
      SELECT
        r.id_resultado as id,
        r.nombre_resultado as nombre,
        r.codigo as codigo,
        NULL as estado,
        r.id_usuario as instructor_asignado,
        r.id_competencia as competencia_id,
        NULL as horas_resultado,
        r.fase_base,
        r.fase_vista,
        r.id_ficha,
        r.orden,
        r.culminado,
        -- Campos del formulario de detalles
        r.actividad_proyecto,
        r.conocimientos_saber,
        r.conocimientos_proceso,
        r.criterios_evaluacion,
        r.actividad_aprendizaje,
        r.evidencia_aprendizaje,
        r.estrategias_didacticas,
        r.materiales_formacion,
        c.codigo_competencia as competencia_codigo,
        c.nombre_competencia as competencia_nombre,
        c.duracion_competencia as competencia_horas,
        c.id_programa as competencia_programa,
        u.nom_completo as instructor_nombre,
        -- Calcular horas: (duracion_competencia / cantidad de resultados de esa competencia en esta ficha)
        CASE 
          WHEN (
            SELECT COUNT(*) 
            FROM resultado_de_aprendizaje r2 
            WHERE r2.id_competencia = r.id_competencia 
              AND r2.id_ficha = ?
          ) > 0
          THEN CAST(c.duracion_competencia AS DECIMAL(10,2)) / (
            SELECT COUNT(*) 
            FROM resultado_de_aprendizaje r2 
            WHERE r2.id_competencia = r.id_competencia 
              AND r2.id_ficha = ?
          )
          ELSE 0
        END as horas_calculadas
      FROM resultado_de_aprendizaje r
      INNER JOIN competencias c ON r.id_competencia = c.id_competencia
      LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_ficha = ?
      ORDER BY c.codigo_competencia, r.orden
    `, [id, id, id]);

    console.log(`✅ [GET /resultados] Ficha ${id}: ${resultados.length} resultados cargados (solo de esta ficha)`);
    console.log(`📊 Ejemplo de resultado:`, resultados.length > 0 ? {
      id: resultados[0].id,
      fase_vista: resultados[0].fase_vista,
      fase_base: resultados[0].fase_base,
      id_ficha: resultados[0].id_ficha,
      horas_calculadas: resultados[0].horas_calculadas,
      competencia_horas: resultados[0].competencia_horas
    } : 'N/A');

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
 * GET /api/fichas/:id/fases-kanban
 * Obtiene las columnas del kanban desde ficha_fases
 * Si no existen fases, las crea automáticamente según la jornada
 */
router.get('/:id/fases-kanban', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔍[fases - kanban] Request para ficha ${id}`);

    // 1. Obtener fases de la ficha desde ficha_fases (incluyendo todas, no solo activas)
    let fases = await query(`
      SELECT 
        id_ficha_fase as id,
      nombre_fase as nombre,
      orden,
      color,
      activo
      FROM ficha_fases
      WHERE id_ficha = ?
      ORDER BY orden
      `, [id]);

    // 2. Si no hay fases, crearlas automáticamente según la jornada
    if (fases.length === 0) {
      console.log(`⚠️[fases - kanban] No hay fases para ficha ${id}, creando automáticamente...`);

      // Obtener jornada de la ficha
      const fichaRow: any[] = await query(`SELECT jornada FROM fichas WHERE id_ficha = ? `, [id]);
      const jornada = fichaRow && fichaRow[0] ? fichaRow[0].jornada : null;

      if (jornada) {
        // Copiar fases de configuración
        await query(`
          INSERT INTO ficha_fases(id_ficha, nombre_fase, orden, color, activo)
          SELECT ?, nombre_fase, orden, color, 1
          FROM fases_configuracion
          WHERE jornada = ? AND activo = 1
          ORDER BY orden
      `, [id, jornada]);

        // Volver a obtener las fases recién creadas
        fases = await query(`
          SELECT 
            id_ficha_fase as id,
      nombre_fase as nombre,
      orden,
      color,
      activo
          FROM ficha_fases
          WHERE id_ficha = ?
          ORDER BY orden
      `, [id]);

        console.log(`✅[fases - kanban] Creadas ${fases.length} fases para jornada ${jornada}`);
      }
    }

    // 3. Agregar columna "Sin Asignar" al inicio (siempre habilitada)
    const lanes = [
      {
        id: 999,
        nombre: 'Sin Asignar',
        orden: 0,
        color: '#6B7280',
        activo: 1,
        habilitada: true
      },
      ...fases.map((f: any) => ({
        ...f,
        activo: f.activo !== undefined ? f.activo : 1,
        habilitada: f.activo !== 0
      }))
    ];

    console.log(`[fases - kanban] Ficha ${id}, Lanes: ${lanes.length}`);

    res.json({ success: true, data: lanes });
  } catch (error: any) {
    console.error('Error al construir fases-kanban:', error);
    res.status(500).json({ success: false, error: 'Error al obtener fases-kanban' });
  }
});



// POST /api/fichas - crear ficha
router.post('/', fichasController.createFicha);

// PUT /api/fichas/:id - actualizar ficha completa
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo_ficha, nombre_ficha, modalidad_formacion, jornada, ambiente, fecha_inicio, fecha_fin, id_programa, estado } = req.body;

    const updateSql = `
      UPDATE fichas SET codigo_ficha = ?, nombre_ficha = ?, modalidad_formacion = ?, jornada = ?, ambiente = ?, fecha_inicio = ?, fecha_fin = ?, id_programa = ?, estado = ?
      WHERE id_ficha = ?
        `;

    await query(updateSql, [codigo_ficha, nombre_ficha, modalidad_formacion || null, jornada || null, ambiente || null, fecha_inicio || null, fecha_fin || null, id_programa || null, estado || 'Por Iniciar', id]);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando ficha:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar ficha' });
  }
});

// PATCH /api/fichas/:id - actualizar estado parcial (por ejemplo inactivar)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ success: false, error: 'Se requiere campo estado en body' });
    }

    await query(`UPDATE fichas SET estado = ? WHERE id_ficha = ? `, [estado, id]);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando estado de ficha:', error);
    return res.status(500).json({ success: false, error: 'Error al actualizar estado' });
  }
});

// DELETE /api/fichas/:id - eliminar ficha
router.delete('/:id', fichasController.deleteFicha);

/**
 * PUT /api/fichas/:idFicha/resultados/:idResultado/fase
 * Actualizar la fase de un resultado para una ficha específica (drag and drop)
 * Body: { fase_id: number | null } donde fase_id es el id_ficha_fase
 */
/**
 * PUT /api/fichas/:idFicha/resultados/:idResultado/instructor
 * Asignar instructor a un resultado para una ficha específica
 */
router.put('/:idFicha/resultados/:idResultado/instructor', async (req, res) => {
  try {
    const { idFicha, idResultado } = req.params;
    const { instructorId } = req.body; // Puede ser null

    // Insertar o actualizar en planeacion_resultados
    await query(`
      INSERT INTO planeacion_resultados(id_ficha, id_resultado, instructor_id)
      VALUES(?, ?, ?)
      ON DUPLICATE KEY UPDATE instructor_id = VALUES(instructor_id)
      `, [idFicha, idResultado, instructorId]);

    await query(`
      UPDATE resultado_de_aprendizaje
      SET id_usuario = ?
      WHERE id_resultado = ?
    `, [instructorId || null, idResultado]);

    // Obtener nombre del instructor para devolverlo
    let instructorNombre = null;
    if (instructorId) {
      const [rows]: any = await query('SELECT nom_completo FROM usuarios WHERE id_usuario = ?', [instructorId]);
      if (rows.length > 0) instructorNombre = rows[0].nom_completo;
    }

    res.json({ success: true, message: 'Instructor asignado correctamente', instructor_nombre: instructorNombre });
  } catch (error: any) {
    console.error('Error asignando instructor:', error);
    res.status(500).json({ success: false, error: 'Error al asignar instructor' });
  }
});

/**
 * PUT /api/fichas/:id_ficha/fases/:id_fase
 * Actualizar fase de una ficha (Equipo Ejecutor y SuperUsuario)
 */
router.put('/:id_ficha/fases/:id_fase', async (req, res) => {
  try {
    const user = (req as any).user;
    const { id_ficha, id_fase } = req.params;

    // Verificar si es SuperUsuario
    if (user?.rol === 'SuperUsuario') {
      // SuperUsuario tiene todos los permisos
    } else {
      // Verificar si el usuario tiene rol "Equipo Ejecutor" en el sistema
      if (user?.rol !== 'Equipo Ejecutor') {
        // Si no es Equipo Ejecutor en el sistema, verificar si tiene rol "Equipo Ejecutor" en la ficha
        const asignacion = await query(`
          SELECT rol_ficha 
          FROM asignar_crear_fichas 
          WHERE id_ficha = ? AND id_usuario = ?
        `, [id_ficha, user?.id_usuario || user?.id]);

        if (!asignacion || asignacion.length === 0 || asignacion[0].rol_ficha !== 'Equipo Ejecutor') {
          return res.status(403).json({
            success: false,
            error: 'No autorizado. Solo Equipo Ejecutor o SuperUsuario pueden gestionar fases'
          });
        }
      }
    }

    const faseData = req.body;

    // Importar el servicio de fases
    const fasesService = await import('../services/fases.service.js');
    await fasesService.default.updateFaseFicha(parseInt(id_ficha), parseInt(id_fase), faseData);

    // Si se está inhabilitando la fase (activo = false), marcar todos los resultados de esa fase como culminados
    if (faseData.activo === false) {
      // Obtener el nombre de la fase
      const faseInfo: any = await query(`
        SELECT nombre_fase 
        FROM ficha_fases 
        WHERE id_ficha_fase = ? AND id_ficha = ?
      `, [id_fase, id_ficha]);

      if (faseInfo && faseInfo.length > 0) {
        const nombreFase = faseInfo[0].nombre_fase;

        // Calcular nombre base si termina en 1 (ej: "Análisis 1" -> "Análisis")
        let nombreBase = nombreFase;
        if (nombreFase.match(/\s*1$/)) {
          nombreBase = nombreFase.replace(/\s*1$/, '').trim();
        }

        // Obtener todos los resultados de la ficha actual que están en esta fase
        // Buscar por fase_vista (la fase actual donde están los resultados)
        // Incluir tanto el nombre exacto como el nombre base
        const resultadosEnFase: any = await query(`
          SELECT r.id_resultado
          FROM resultado_de_aprendizaje r
          WHERE r.id_ficha = ? AND (r.fase_vista = ? OR r.fase_vista = ? OR r.fase_base = ?)
        `, [id_ficha, nombreFase, nombreBase, nombreFase]);

        // Marcar todos los resultados de esta fase como culminados
        if (resultadosEnFase && resultadosEnFase.length > 0) {
          const idsResultados = resultadosEnFase.map((r: any) => r.id_resultado);
          if (idsResultados.length > 0) {
            await query(`
              UPDATE resultado_de_aprendizaje 
              SET culminado = 1 
              WHERE id_resultado IN (${idsResultados.map(() => '?').join(',')}) 
              AND id_ficha = ?
            `, [...idsResultados, id_ficha]);
            console.log(`✅ Marcados ${idsResultados.length} resultados como culminados al inhabilitar fase ${nombreFase} (base: ${nombreBase}) en ficha ${id_ficha}`);
          }
        }
      }
    } else if (faseData.activo === true) {
      // Si se está habilitando la fase, desmarcar los resultados como culminados
      // Obtener el nombre de la fase
      const faseInfo: any = await query(`
        SELECT nombre_fase 
        FROM ficha_fases 
        WHERE id_ficha_fase = ? AND id_ficha = ?
      `, [id_fase, id_ficha]);

      if (faseInfo && faseInfo.length > 0) {
        const nombreFase = faseInfo[0].nombre_fase;

        // Calcular nombre base si termina en 1
        let nombreBase = nombreFase;
        if (nombreFase.match(/\s*1$/)) {
          nombreBase = nombreFase.replace(/\s*1$/, '').trim();
        }

        // Obtener todos los resultados de la ficha actual que están en esta fase
        const resultadosEnFase: any = await query(`
          SELECT r.id_resultado
          FROM resultado_de_aprendizaje r
          WHERE r.id_ficha = ? AND (r.fase_vista = ? OR r.fase_vista = ? OR r.fase_base = ?) AND r.culminado = 1
        `, [id_ficha, nombreFase, nombreBase, nombreFase]);

        // Desmarcar todos los resultados de esta fase como no culminados
        if (resultadosEnFase && resultadosEnFase.length > 0) {
          const idsResultados = resultadosEnFase.map((r: any) => r.id_resultado);
          if (idsResultados.length > 0) {
            await query(`
              UPDATE resultado_de_aprendizaje 
              SET culminado = 0 
              WHERE id_resultado IN (${idsResultados.map(() => '?').join(',')}) 
              AND id_ficha = ?
            `, [...idsResultados, id_ficha]);
            console.log(`✅ Desmarcados ${idsResultados.length} resultados (culminado = 0) al habilitar fase ${nombreFase} (base: ${nombreBase}) en ficha ${id_ficha}`);
          }
        }
      }
    }

    res.json({
      success: true,
      message: 'Fase actualizada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al actualizar fase:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/fichas/:id_ficha/fases
 * Agregar fase personalizada a una ficha (Equipo Ejecutor y SuperUsuario)
 */
router.post('/:id_ficha/fases', async (req, res) => {
  try {
    const user = (req as any).user;
    const { id_ficha } = req.params;

    if (user?.rol !== 'Equipo Ejecutor' && user?.rol !== 'SuperUsuario') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado. Solo Equipo Ejecutor puede gestionar fases'
      });
    }

    const faseData = req.body;

    if (!faseData.nombre_fase || faseData.orden === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: nombre_fase, orden'
      });
    }

    const fasesService = await import('../services/fases.service.js');
    const id = await fasesService.default.addFaseToFicha(parseInt(id_ficha), faseData);

    res.status(201).json({
      success: true,
      data: { id_ficha_fase: id },
      message: 'Fase agregada exitosamente'
    });
  } catch (error: any) {
    console.error('Error al agregar fase:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Ya existe una fase con ese nombre en esta ficha'
      });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/fichas/:id_ficha/fases/:id_fase
 * Eliminar fase de una ficha (Equipo Ejecutor y SuperUsuario)
 */
router.delete('/:id_ficha/fases/:id_fase', async (req, res) => {
  try {
    const user = (req as any).user;
    const { id_ficha, id_fase } = req.params;

    if (user?.rol !== 'Equipo Ejecutor' && user?.rol !== 'SuperUsuario') {
      return res.status(403).json({
        success: false,
        error: 'No autorizado'
      });
    }

    const fasesService = await import('../services/fases.service.js');
    await fasesService.default.deleteFaseFicha(parseInt(id_ficha), parseInt(id_fase));

    res.json({
      success: true,
      message: 'Fase eliminada exitosamente. Los resultados fueron movidos a otra fase.'
    });
  } catch (error: any) {
    console.error('Error al eliminar fase:', error);

    if (error.message === 'No se puede eliminar la última fase activa') {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/fichas/:fichaId/resultados/:resultadoId/fase
 * Actualizar fase_vista/fase_base de un resultado específico en contexto de una ficha
 * Body: { fase_id: number | null }
 */
router.put('/:fichaId/resultados/:resultadoId/fase', async (req, res) => {
  try {
    const { fichaId, resultadoId } = req.params;
    const { fase_id } = req.body;

    // Log inicial detallado
    try {
      console.log('===== [DRAG&DROP FICHA] Request received =====');
      console.log('URL:', req.originalUrl);
      console.log('Method:', req.method);
      console.log('User:', (req as any).user ? { id: (req as any).user.id_usuario || (req as any).user.id, rol: (req as any).user.rol } : null);
      console.log('Params:', JSON.stringify(req.params));
      console.log('Query:', JSON.stringify(req.query));
      console.log('Body:', JSON.stringify(req.body));
    } catch (logErr) {
      console.error('Error logging request details:', logErr);
    }

    // Estado actual del resultado (antes de update)
    try {
      const beforeRows: any = await query(`SELECT id_resultado, fase_vista, fase_base, id_ficha FROM resultado_de_aprendizaje WHERE id_resultado = ?`, [Number(resultadoId)]);
      if (beforeRows && beforeRows.length > 0) {
        console.log('[DRAG&DROP FICHA] Before update:', beforeRows[0]);
      } else {
        console.log(`[DRAG&DROP FICHA] Antes: resultado ${resultadoId} no encontrado`);
      }
    } catch (err) {
      console.error('Error fetching before-state of resultado:', err);
    }

    let faseVista: string | null = null;
    let faseBase: string | null = null;

    if (fase_id === null || typeof fase_id === 'undefined' || Number(fase_id) === 999) {
      faseVista = null;
      faseBase = null;
    } else {
      // Buscar el nombre exacto de la fase en ficha_fases por id_ficha_fase y id_ficha
      const fasesRows: any[] = await query(`SELECT nombre_fase FROM ficha_fases WHERE id_ficha_fase = ? AND id_ficha = ?`, [Number(fase_id), Number(fichaId)]);
      if (!fasesRows || fasesRows.length === 0) {
        return res.status(400).json({ success: false, error: 'fase_id inválido o no pertenece a la ficha' });
      }
      const nombreFase = fasesRows[0].nombre_fase;
      // Normalizar: remover tildes y convertir a minúsculas
      const normalize = (text: string) => {
        return text
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();
      };
      // Determinar número final si existe
      const matchNum = (typeof nombreFase === 'string') ? nombreFase.match(/\s*(\d+)\s*$/) : null;
      const num = matchNum ? Number(matchNum[1]) : null;
      // fase_base será el nombre sin número final y normalizado (ej: 'analisis')
      const baseNormalizada = typeof nombreFase === 'string' ? normalize(nombreFase.replace(/\s*\d+$/, '')) : null;
      // Si el número es 1, no queremos el sufijo '1' en fase_vista: guardamos solo la base
      if (num === 1) {
        faseVista = baseNormalizada;
      } else if (num !== null) {
        // Número distinto de 1: mantener el número en fase_vista (ej: 'analisis 2')
        faseVista = normalize(nombreFase as string);
      } else {
        // No hay número: usar el nombre normalizado tal cual
        faseVista = typeof nombreFase === 'string' ? normalize(nombreFase) : null;
      }
      faseBase = baseNormalizada;
    }

    // Log de depuración antes de actualizar (solo se modificará `fase_vista`)
    console.log(`[DRAG&DROP FICHA] Intentando actualizar resultado ${resultadoId} en ficha ${fichaId} a fase_id=${fase_id}, fase_vista='${faseVista}' (fase_base no se modifica)`);

    // Actualizar resultado: set solo fase_vista y asegurar id_ficha (no modificar fase_base)
    const updateResult: any = await query(
      `UPDATE resultado_de_aprendizaje
       SET fase_vista = ?, id_ficha = ?
       WHERE id_resultado = ?`,
      [faseVista, Number(fichaId), Number(resultadoId)]
    );

    console.log(`[DRAG&DROP FICHA] Update result:`, updateResult);
    console.log(`[DRAG&DROP FICHA] affectedRows = ${updateResult.affectedRows}, changedRows = ${updateResult.changedRows}`);

    if (updateResult.affectedRows === 0) {
      console.warn(`⚠️ [DRAG&DROP FICHA] UPDATE no afectó ninguna fila. Verificando si resultado existe...`);
      const checkRows: any = await query(`SELECT id_resultado FROM resultado_de_aprendizaje WHERE id_resultado = ?`, [Number(resultadoId)]);
      console.log(`[DRAG&DROP FICHA] Existe resultado ${resultadoId}?`, checkRows.length > 0 ? 'SÍ' : 'NO');
    }

    // Leer el registro actualizado para confirmar que fase_vista fue guardada
    let updatedRow: any = null;
    try {
      const afterRows: any = await query(`SELECT id_resultado, fase_vista, fase_base, id_ficha FROM resultado_de_aprendizaje WHERE id_resultado = ?`, [Number(resultadoId)]);
      if (afterRows && afterRows.length > 0) {
        updatedRow = afterRows[0];
        console.log('[DRAG&DROP FICHA] After update:', updatedRow);
      } else {
        console.log(`[DRAG&DROP FICHA] Después: resultado ${resultadoId} no encontrado`);
      }
    } catch (err) {
      console.error('Error fetching after-state of resultado:', err);
    }

    console.log(`[DRAG&DROP FICHA] Resultado ${resultadoId} en ficha ${fichaId} movido a fase: ${faseVista || 'sin asignar'}`);

    return res.json({
      success: true,
      message: 'Fase actualizada correctamente (ficha)',
      data: {
        id_resultado: parseInt(String(resultadoId), 10),
        fase_vista: faseVista,
        // fase_base no se modifica por esta operación; devolver valor actual desde la fila actualizada
        fase_base: updatedRow ? updatedRow.fase_base : null,
        fase_id: fase_id === null || Number(fase_id) === 999 ? null : Number(fase_id),
        updatedRow: updatedRow
      }
    });
  } catch (error) {
    console.error('Error al actualizar fase de resultado en ficha:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar fase' });
  }
});

export default router;
