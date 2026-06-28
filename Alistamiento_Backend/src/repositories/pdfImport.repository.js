const { extraerNumeroHoras } = require('../utils/pdfText');

class PdfImportRepository {
  async insertPrograma(connection, programa) {
    const [result] = await connection.query(
      `INSERT INTO programa_formacion
        (codigo_programa, nombre_programa, vigencia, tipo_programa,
         version_programa, horas_totales, horas_etapa_lectiva, horas_etapa_productiva)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        programa.codigo_programa || null,
        programa.nombre_programa || null,
        programa.vigencia || null,
        programa.tipo || null,
        programa.version_programa || null,
        extraerNumeroHoras(programa.horas_totales),
        extraerNumeroHoras(programa.horas_etapa_lectiva),
        extraerNumeroHoras(programa.horas_etapa_productiva),
      ],
    );

    return result.insertId;
  }

  async insertCompetencia(connection, competencia, idPrograma) {
    const [result] = await connection.query(
      `INSERT INTO competencias
        (id_programa, codigo_norma, nombre_competencia, unidad_competencia, duracion_maxima)
       VALUES (?, ?, ?, ?, ?)`,
      [
        idPrograma,
        competencia.codigo_norma || null,
        competencia.nombre_competencia || null,
        competencia.unidad_competencia || null,
        extraerNumeroHoras(competencia.duracion_maxima),
      ],
    );

    return result.insertId;
  }

  async findCompetenciaByCodigo(connection, codigoNorma) {
    const [rows] = await connection.query(
      `SELECT id_competencia, duracion_maxima
       FROM competencias
       WHERE codigo_norma = ?`,
      [codigoNorma],
    );

    return rows[0] ?? null;
  }

  async insertRap(connection, { idCompetencia, codigo, denominacion, duracion }) {
    const [result] = await connection.query(
      `INSERT INTO raps (id_competencia, codigo, denominacion, duracion)
       VALUES (?, ?, ?, ?)`,
      [idCompetencia, codigo, denominacion, duracion],
    );

    return result.insertId;
  }

  async insertConocimientoProceso(connection, idRap, nombre) {
    await connection.query(
      `INSERT INTO conocimiento_proceso (id_rap, nombre) VALUES (?, ?)`,
      [idRap, nombre],
    );
  }

  async insertConocimientoSaber(connection, idRap, nombre) {
    await connection.query(
      `INSERT INTO conocimiento_saber (id_rap, nombre) VALUES (?, ?)`,
      [idRap, nombre],
    );
  }

  async insertCriterioEvaluacion(connection, idRap, nombre) {
    await connection.query(
      `INSERT INTO criterios_evaluacion (id_rap, nombre) VALUES (?, ?)`,
      [idRap, nombre],
    );
  }

  async findProgramaIdByCodigo(connection, codigoPrograma) {
    const [rows] = await connection.query(
      `SELECT id_programa
       FROM programa_formacion
       WHERE codigo_programa = ?`,
      [codigoPrograma],
    );

    return rows[0]?.id_programa ?? null;
  }

  async insertProyecto(connection, proyecto, idPrograma) {
    const [result] = await connection.query(
      `INSERT INTO proyectos
        (codigo_proyecto, nombre_proyecto, codigo_programa,
         centro_formacion, regional, id_programa)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        proyecto.codigo_proyecto || null,
        proyecto.nombre_proyecto || null,
        proyecto.codigo_programa || null,
        proyecto.centro_formacion || null,
        proyecto.regional || null,
        idPrograma,
      ],
    );

    return result.insertId;
  }

  async insertFase(connection, nombre) {
    await connection.query(
      `INSERT INTO fases (nombre) VALUES (?)`,
      [nombre],
    );
  }

  async insertActividad(connection, fase, nombreActividad) {
    const [result] = await connection.query(
      `INSERT INTO actividades_proyecto (fase, nombre_actividad) VALUES (?, ?)`,
      [fase, nombreActividad],
    );

    return result.insertId;
  }

  async findRapByCodigoAndDenominacion(connection, codigoRap, denominacionPrefix) {
    const [rows] = await connection.query(
      `SELECT id_rap, denominacion
       FROM raps
       WHERE codigo = ?
         AND denominacion LIKE ?
       LIMIT 1`,
      [codigoRap, `%${denominacionPrefix.substring(0, 30)}%`],
    );

    return rows[0] ?? null;
  }

  async insertActividadRap(connection, idActividad, idRap) {
    await connection.query(
      `INSERT INTO actividad_rap (id_actividad, id_rap) VALUES (?, ?)`,
      [idActividad, idRap],
    );
  }
}

module.exports = new PdfImportRepository();
