const db = require('../config/conexion_db');

const PLANEACION_PROJECTION = `
  pp.id_planeacion,
  pp.id_ficha,
  pp.id_trimestre,
  pp.observaciones,
  pp.fecha_creacion
`;

const DETALLE_PEDAGOGIC_FIELDS = [
  'actividades_aprendizaje',
  'duracion_directa',
  'duracion_independiente',
  'descripcion_evidencia',
  'estrategias_didacticas',
  'ambientes_aprendizaje',
  'materiales_formacion',
  'observaciones',
];

const SABERES_CONCEPTOS_DERIVADO_SQL = `(
  SELECT GROUP_CONCAT(cs.nombre ORDER BY cs.id_conocimiento_saber SEPARATOR '\\n')
  FROM conocimiento_saber cs
  WHERE cs.id_rap = dpp.id_rap
)`;

const SABERES_PROCESO_DERIVADO_SQL = `(
  SELECT GROUP_CONCAT(cp.nombre ORDER BY cp.id_conocimiento_proceso SEPARATOR '\\n')
  FROM conocimiento_proceso cp
  WHERE cp.id_rap = dpp.id_rap
)`;

const CRITERIOS_DERIVADO_SQL = `(
  SELECT GROUP_CONCAT(ce.nombre ORDER BY ce.id_criterio_evaluacion SEPARATOR '\\n')
  FROM criterios_evaluacion ce
  WHERE ce.id_rap = dpp.id_rap
)`;

const SABERES_CRITERIOS_DERIVADOS_PROJECTION = `
  COALESCE(${SABERES_CONCEPTOS_DERIVADO_SQL}, dpp.saberes_conceptos) AS saberes_conceptos,
  COALESCE(${SABERES_PROCESO_DERIVADO_SQL}, dpp.saberes_proceso) AS saberes_proceso,
  COALESCE(${CRITERIOS_DERIVADO_SQL}, dpp.criterios_evaluacion) AS criterios_evaluacion`;

const INSTRUCTOR_SABANA_PROJECTION = `
  COALESCE(inst_rt.nombre, rt.instructor_asignado, '') AS instructor_responsable,
  rt.id_instructor`;

const RAP_TRIMESTRE_INSTRUCTOR_JOIN = `
  LEFT JOIN rap_trimestre rt
    ON rt.id_rap = dpp.id_rap
   AND rt.id_ficha = pp.id_ficha
   AND rt.id_trimestre = pp.id_trimestre
  LEFT JOIN instructores inst_rt ON inst_rt.id_instructor = rt.id_instructor`;

const DETALLE_UPDATE_FIELDS = [
  'actividades_aprendizaje',
  'duracion_directa',
  'duracion_independiente',
  'descripcion_evidencia',
  'estrategias_didacticas',
  'ambientes_aprendizaje',
  'materiales_formacion',
  'observaciones',
  'saberes_conceptos',
  'saberes_proceso',
  'criterios_evaluacion',
];

class PlaneacionRepository {
  async findTrimestreByFichaAndNumero(connection, idFicha, noTrimestre) {
    const [rows] = await connection.query(
      `SELECT id_trimestre, no_trimestre, fase
       FROM trimestre
       WHERE id_ficha = ? AND no_trimestre = ?
       LIMIT 1`,
      [idFicha, noTrimestre],
    );
    return rows[0] ?? null;
  }

  async findTrimestreByIdAndFicha(connection, idTrimestre, idFicha) {
    const [rows] = await connection.query(
      `SELECT id_trimestre, no_trimestre, fase
       FROM trimestre
       WHERE id_trimestre = ? AND id_ficha = ?
       LIMIT 1`,
      [idTrimestre, idFicha],
    );
    return rows[0] ?? null;
  }

  async usuarioTieneAccesoFicha(connection, userId, rol, idFicha) {
    if (rol === 'Administrador' || rol === 'Gestor') {
      return true;
    }

    const [rows] = await connection.query(
      `SELECT 1
       FROM instructor_ficha
       WHERE id_ficha = ? AND id_instructor = ?
       LIMIT 1`,
      [idFicha, userId],
    );

    return rows.length > 0;
  }

  async insertPlaneacion(connection, { idFicha, idTrimestre, observaciones, fechaCreacion }) {
    const [result] = await connection.query(
      `INSERT INTO planeacion_pedagogica
         (id_ficha, id_trimestre, observaciones, fecha_creacion)
       VALUES (?, ?, ?, ?)`,
      [idFicha, idTrimestre, observaciones, fechaCreacion],
    );
    return result.insertId;
  }

  async insertDetalle(connection, idPlaneacion, rap) {
    const [result] = await connection.query(
      `INSERT INTO detalle_planeacion_pedagogica
         (id_planeacion, id_rap, activo, codigo_rap, nombre_rap, competencia, horas_trimestre,
          actividades_aprendizaje, duracion_directa, duracion_independiente,
          descripcion_evidencia, estrategias_didacticas, ambientes_aprendizaje,
          materiales_formacion, observaciones, saberes_conceptos, saberes_proceso, criterios_evaluacion)
       VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idPlaneacion,
        rap.id_rap,
        rap.codigo_rap ?? null,
        rap.nombre_rap ?? null,
        rap.competencia ?? null,
        rap.horas_trimestre ?? null,
        rap.actividades_aprendizaje ?? '',
        rap.duracion_directa ?? 0,
        rap.duracion_independiente ?? 0,
        rap.descripcion_evidencia ?? '',
        rap.estrategias_didacticas ?? '',
        rap.ambientes_aprendizaje ?? '',
        rap.materiales_formacion ?? '',
        rap.observaciones ?? '',
        rap.saberes_conceptos ?? '',
        rap.saberes_proceso ?? '',
        rap.criterios_evaluacion ?? '',
      ],
    );
    return result.insertId;
  }

  async insertDetalleVacioDesdeSabana(connection, idPlaneacion, sabanaRow) {
    const [result] = await connection.query(
      `INSERT INTO detalle_planeacion_pedagogica
         (id_planeacion, id_rap, activo, codigo_rap, nombre_rap, competencia, horas_trimestre,
          actividades_aprendizaje, duracion_directa, duracion_independiente,
          descripcion_evidencia, estrategias_didacticas, ambientes_aprendizaje,
          materiales_formacion, observaciones, saberes_conceptos, saberes_proceso, criterios_evaluacion)
       VALUES (?, ?, 1, ?, ?, ?, ?, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL)`,
      [
        idPlaneacion,
        sabanaRow.id_rap,
        sabanaRow.codigo_rap ?? null,
        sabanaRow.nombre_rap ?? null,
        sabanaRow.competencia ?? null,
        sabanaRow.horas_trimestre ?? null,
      ],
    );
    return result.insertId;
  }

  async findSabanaPairsByFicha(idFicha, connection = db) {
    const [rows] = await connection.query(
      `SELECT
         rt.id_rap,
         rt.id_trimestre,
         rt.horas_trimestre,
         rt.id_instructor,
         rt.instructor_asignado,
         t.no_trimestre,
         r.codigo AS codigo_rap,
         r.denominacion AS nombre_rap,
         c.nombre_competencia AS competencia
       FROM rap_trimestre rt
       INNER JOIN trimestre t ON t.id_trimestre = rt.id_trimestre
       INNER JOIN raps r ON r.id_rap = rt.id_rap
       INNER JOIN competencias c ON c.id_competencia = r.id_competencia
       WHERE rt.id_ficha = ?
       ORDER BY t.no_trimestre, rt.id_rap`,
      [idFicha],
    );
    return rows;
  }

  async findDetallesActivosByFicha(idFicha, connection = db) {
    const [rows] = await connection.query(
      `SELECT
         dpp.id_detalle,
         dpp.id_planeacion,
         dpp.id_rap,
         dpp.codigo_rap,
         dpp.nombre_rap,
         dpp.competencia,
         dpp.horas_trimestre,
         dpp.activo,
         ${DETALLE_PEDAGOGIC_FIELDS.map((f) => `dpp.${f}`).join(',\n         ')},
         ${SABERES_CRITERIOS_DERIVADOS_PROJECTION},
         ${INSTRUCTOR_SABANA_PROJECTION},
         pp.id_trimestre,
         t.no_trimestre
       FROM detalle_planeacion_pedagogica dpp
       INNER JOIN planeacion_pedagogica pp ON pp.id_planeacion = dpp.id_planeacion
       INNER JOIN trimestre t ON t.id_trimestre = pp.id_trimestre
       ${RAP_TRIMESTRE_INSTRUCTOR_JOIN}
       WHERE pp.id_ficha = ?
         AND dpp.activo = 1
       ORDER BY t.no_trimestre, dpp.id_detalle`,
      [idFicha],
    );
    return rows;
  }

  async findPlaneacionIdByFichaAndTrimestre(connection, idFicha, idTrimestre) {
    const [rows] = await connection.query(
      `SELECT id_planeacion
       FROM planeacion_pedagogica
       WHERE id_ficha = ? AND id_trimestre = ?
       LIMIT 1`,
      [idFicha, idTrimestre],
    );
    return rows[0]?.id_planeacion ?? null;
  }

  async findOrCreatePlaneacion(connection, idFicha, idTrimestre, noTrimestre) {
    const existingId = await this.findPlaneacionIdByFichaAndTrimestre(
      connection,
      idFicha,
      idTrimestre,
    );
    if (existingId) {
      return existingId;
    }

    const observaciones = `Planeación Trimestre ${noTrimestre} - Ficha ${idFicha}`;
    return this.insertPlaneacion(connection, {
      idFicha,
      idTrimestre,
      observaciones,
      fechaCreacion: new Date(),
    });
  }

  async updateDetalleHorasDesdeSabana(connection, idDetalle, horasTrimestre) {
    const [result] = await connection.query(
      `UPDATE detalle_planeacion_pedagogica
       SET horas_trimestre = ?
       WHERE id_detalle = ?
         AND activo = 1`,
      [horasTrimestre, idDetalle],
    );
    return result.affectedRows;
  }

  async moveDetalleToPlaneacion(connection, idDetalle, idPlaneacion) {
    const [result] = await connection.query(
      `UPDATE detalle_planeacion_pedagogica
       SET id_planeacion = ?
       WHERE id_detalle = ?
         AND activo = 1`,
      [idPlaneacion, idDetalle],
    );
    return result.affectedRows;
  }

  async archiveDetalle(connection, idDetalle) {
    const [result] = await connection.query(
      `UPDATE detalle_planeacion_pedagogica
       SET activo = 0
       WHERE id_detalle = ?
         AND activo = 1`,
      [idDetalle],
    );
    return result.affectedRows;
  }

  async findArchivadosByRapAndTrimestre(connection, idFicha, idRap, idTrimestre) {
    const [rows] = await connection.query(
      `SELECT
         dpp.id_detalle,
         dpp.id_planeacion,
         dpp.id_rap,
         dpp.fecha_creacion
       FROM detalle_planeacion_pedagogica dpp
       INNER JOIN planeacion_pedagogica pp ON pp.id_planeacion = dpp.id_planeacion
       WHERE pp.id_ficha = ?
         AND pp.id_trimestre = ?
         AND dpp.id_rap = ?
         AND dpp.activo = 0
       ORDER BY dpp.id_detalle DESC`,
      [idFicha, idTrimestre, idRap],
    );
    return rows;
  }

  async reactivateDetalle(connection, idDetalle, idPlaneacion, horasTrimestre) {
    const [result] = await connection.query(
      `UPDATE detalle_planeacion_pedagogica
       SET activo = 1,
           id_planeacion = ?,
           horas_trimestre = ?
       WHERE id_detalle = ?
         AND activo = 0`,
      [idPlaneacion, horasTrimestre, idDetalle],
    );
    return result.affectedRows;
  }

  async findPlaneacionesByFicha(idFicha, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${PLANEACION_PROJECTION},
              t.no_trimestre,
              COUNT(CASE WHEN dpp.activo = 1 THEN dpp.id_detalle END) AS total_raps
       FROM planeacion_pedagogica pp
       LEFT JOIN detalle_planeacion_pedagogica dpp ON pp.id_planeacion = dpp.id_planeacion
       LEFT JOIN trimestre t ON t.id_trimestre = pp.id_trimestre
       WHERE pp.id_ficha = ?
       GROUP BY pp.id_planeacion, pp.id_ficha, pp.id_trimestre, pp.observaciones, pp.fecha_creacion, t.no_trimestre
       ORDER BY pp.fecha_creacion DESC`,
      [idFicha],
    );
    return rows;
  }

  async findPlaneacionById(idPlaneacion, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${PLANEACION_PROJECTION}, t.no_trimestre
       FROM planeacion_pedagogica pp
       LEFT JOIN trimestre t ON t.id_trimestre = pp.id_trimestre
       WHERE pp.id_planeacion = ?`,
      [idPlaneacion],
    );
    return rows[0] ?? null;
  }

  async findDetallesByPlaneacion(idPlaneacion, connection = db) {
    const [rows] = await connection.query(
      `SELECT
         dpp.id_detalle,
         dpp.id_planeacion,
         dpp.id_rap,
         dpp.codigo_rap,
         dpp.nombre_rap,
         dpp.competencia,
         dpp.horas_trimestre,
         dpp.actividades_aprendizaje,
         dpp.duracion_directa,
         dpp.duracion_independiente,
         dpp.descripcion_evidencia,
         dpp.estrategias_didacticas,
         dpp.ambientes_aprendizaje,
         dpp.materiales_formacion,
         dpp.observaciones,
         ${SABERES_CRITERIOS_DERIVADOS_PROJECTION},
         dpp.activo,
         ${INSTRUCTOR_SABANA_PROJECTION}
       FROM detalle_planeacion_pedagogica dpp
       INNER JOIN planeacion_pedagogica pp ON pp.id_planeacion = dpp.id_planeacion
       ${RAP_TRIMESTRE_INSTRUCTOR_JOIN}
       WHERE dpp.id_planeacion = ?
         AND dpp.activo = 1
       ORDER BY dpp.id_detalle`,
      [idPlaneacion],
    );
    return rows;
  }

  async findDetalleById(idDetalle, connection = db) {
    const [rows] = await connection.query(
      `SELECT id_detalle, id_planeacion, id_rap
       FROM detalle_planeacion_pedagogica
       WHERE id_detalle = ?`,
      [idDetalle],
    );
    return rows[0] ?? null;
  }

  async updateDetalle(connection, idDetalle, fields) {
    const setClauses = [];
    const values = [];

    for (const key of DETALLE_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        setClauses.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (setClauses.length === 0) {
      return 0;
    }

    values.push(idDetalle);

    const [result] = await connection.query(
      `UPDATE detalle_planeacion_pedagogica
       SET ${setClauses.join(', ')}
       WHERE id_detalle = ?`,
      values,
    );

    return result.affectedRows;
  }

  async deleteDetallesByPlaneacion(connection, idPlaneacion) {
    const [result] = await connection.query(
      'DELETE FROM detalle_planeacion_pedagogica WHERE id_planeacion = ?',
      [idPlaneacion],
    );
    return result.affectedRows;
  }

  async deletePlaneacion(connection, idPlaneacion) {
    const [result] = await connection.query(
      'DELETE FROM planeacion_pedagogica WHERE id_planeacion = ?',
      [idPlaneacion],
    );
    return result.affectedRows;
  }

  async findIntegrantesFicha(idFicha, connection = db) {
    const [rows] = await connection.query(
      `SELECT i.nombre, i.email, inf.rol
       FROM instructor_ficha inf
       JOIN instructores i ON i.id_instructor = inf.id_instructor
       WHERE inf.id_ficha = ?
       ORDER BY inf.rol DESC, i.nombre`,
      [idFicha],
    );
    return rows;
  }

  /**
   * Filas para export GFPI-F-134 (parametrizado por ficha y trimestre opcional).
   */
  async findExportRows(idFicha, idTrimestre = null, connection = db) {
    const params = [idFicha, idTrimestre, idTrimestre];

    const [rows] = await connection.query(
      `SELECT
         t.fase AS fase_proyecto,
         (
           SELECT ap.nombre_actividad
           FROM actividad_rap ar
           JOIN actividades_proyecto ap ON ap.id_actividad = ar.id_actividad
           WHERE ar.id_rap = dpp.id_rap
           LIMIT 1
         ) AS actividad_proyecto,
         dpp.competencia,
         dpp.nombre_rap,
         dpp.saberes_conceptos,
         dpp.saberes_proceso,
         dpp.criterios_evaluacion,
         dpp.actividades_aprendizaje,
         dpp.duracion_directa,
         dpp.duracion_independiente,
         dpp.descripcion_evidencia,
         dpp.estrategias_didacticas,
         dpp.ambientes_aprendizaje,
         dpp.materiales_formacion,
         COALESCE(inst_rt.nombre, rt.instructor_asignado, '') AS instructores_responsables,
         dpp.observaciones,
         pp.fecha_creacion,
         pf.nombre_programa,
         f.modalidad,
         pf.codigo_programa,
         pf.version_programa,
         pr.nombre_proyecto,
         pr.codigo_proyecto,
         t.no_trimestre
       FROM planeacion_pedagogica pp
       JOIN fichas f ON f.id_ficha = pp.id_ficha
       JOIN programa_formacion pf ON pf.id_programa = f.id_programa
       LEFT JOIN proyectos pr ON pr.id_programa = f.id_programa
       JOIN detalle_planeacion_pedagogica dpp ON dpp.id_planeacion = pp.id_planeacion AND dpp.activo = 1
       LEFT JOIN trimestre t ON t.id_trimestre = pp.id_trimestre
       LEFT JOIN rap_trimestre rt
         ON rt.id_rap = dpp.id_rap
        AND rt.id_ficha = pp.id_ficha
        AND rt.id_trimestre = pp.id_trimestre
       LEFT JOIN instructores inst_rt ON inst_rt.id_instructor = rt.id_instructor
       WHERE pp.id_ficha = ?
         AND (? IS NULL OR pp.id_trimestre = ?)
       ORDER BY t.no_trimestre, dpp.id_detalle`,
      params,
    );

    return rows;
  }

  async findExportMetadata(idFicha, connection = db) {
    const [rows] = await connection.query(
      `SELECT
         f.modalidad,
         pf.nombre_programa,
         pf.codigo_programa,
         pf.version_programa,
         pr.nombre_proyecto,
         pr.codigo_proyecto
       FROM fichas f
       JOIN programa_formacion pf ON pf.id_programa = f.id_programa
       LEFT JOIN proyectos pr ON pr.id_programa = f.id_programa
       WHERE f.id_ficha = ?
       LIMIT 1`,
      [idFicha],
    );
    return rows[0] ?? null;
  }
}

module.exports = new PlaneacionRepository();
