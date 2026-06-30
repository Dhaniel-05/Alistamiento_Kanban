const db = require('../config/conexion_db');

const PLANEACION_PROJECTION = `
  pp.id_planeacion,
  pp.id_ficha,
  pp.id_trimestre,
  pp.observaciones,
  pp.fecha_creacion
`;

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
         (id_planeacion, id_rap, codigo_rap, nombre_rap, competencia, horas_trimestre,
          actividades_aprendizaje, duracion_directa, duracion_independiente,
          descripcion_evidencia, estrategias_didacticas, ambientes_aprendizaje,
          materiales_formacion, observaciones, saberes_conceptos, saberes_proceso, criterios_evaluacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

  async findPlaneacionesByFicha(idFicha, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${PLANEACION_PROJECTION},
              t.no_trimestre,
              COUNT(dpp.id_detalle) AS total_raps
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
         id_detalle,
         id_planeacion,
         id_rap,
         codigo_rap,
         nombre_rap,
         competencia,
         horas_trimestre,
         actividades_aprendizaje,
         duracion_directa,
         duracion_independiente,
         descripcion_evidencia,
         estrategias_didacticas,
         ambientes_aprendizaje,
         materiales_formacion,
         observaciones,
         saberes_conceptos,
         saberes_proceso,
         criterios_evaluacion
       FROM detalle_planeacion_pedagogica
       WHERE id_planeacion = ?
       ORDER BY id_detalle`,
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
       JOIN detalle_planeacion_pedagogica dpp ON dpp.id_planeacion = pp.id_planeacion
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
