const db = require('../config/conexion_db');

const FICHA_PROJECTION = `
  id_ficha,
  id_programa,
  codigo_ficha,
  modalidad,
  jornada,
  ambiente,
  fecha_inicio,
  fecha_final,
  cantidad_trimestre
`;

class FichaRepository {
  async insert(connection, data) {
    const {
      id_programa,
      codigo_ficha,
      modalidad,
      jornada,
      ambiente,
      fecha_inicio,
      fecha_final,
      cantidad_trimestre,
    } = data;

    const [result] = await connection.query(
      `INSERT INTO fichas
         (id_programa, codigo_ficha, modalidad, jornada, ambiente, fecha_inicio, fecha_final, cantidad_trimestre)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id_programa,
        codigo_ficha,
        modalidad,
        jornada,
        ambiente,
        fecha_inicio,
        fecha_final,
        cantidad_trimestre,
      ],
    );

    return result.insertId;
  }

  async findById(id, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${FICHA_PROJECTION}
       FROM fichas
       WHERE id_ficha = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  async insertTrimestres(connection, idFicha, jornada) {
    const totalTrimestres = jornada === 'Diurna' ? 7 : jornada === 'Nocturna' ? 9 : 0;

    if (totalTrimestres === 0) {
      return { totalTrimestres: 0, invalidJornada: true };
    }

    const fases = [
      'ANÁLISIS',
      'ANÁLISIS',
      'PLANEACIÓN',
      'EJECUCIÓN',
      'EJECUCIÓN',
      'EJECUCIÓN',
      'EVALUACIÓN',
    ];

    const valores = [];
    for (let t = 1; t <= totalTrimestres; t += 1) {
      const fase = fases[t - 1] || 'EJECUCIÓN';
      valores.push([idFicha, t, fase]);
    }

    await connection.query(
      'INSERT INTO trimestre (id_ficha, no_trimestre, fase) VALUES ?',
      [valores],
    );

    return { totalTrimestres, invalidJornada: false };
  }

  /**
   * Sincroniza trimestre.fase desde ficha_fases (orden = no_trimestre).
   * @param {import('mysql2/promise').PoolConnection} connection
   * @param {number|null} idFicha - Si es null, actualiza todas las fichas.
   * @returns {Promise<number>} Filas actualizadas
   */
  async syncTrimestreFasesFromFichaFases(connection, idFicha = null) {
    let sql = `
      UPDATE trimestre t
      INNER JOIN ficha_fases ff
        ON ff.id_ficha = t.id_ficha
       AND ff.orden = t.no_trimestre
      SET t.fase = ff.nombre_fase`;

    const params = [];

    if (idFicha != null) {
      sql += ' WHERE t.id_ficha = ?';
      params.push(idFicha);
    }

    const [result] = await connection.query(sql, params);
    return result.affectedRows ?? 0;
  }

  async insertInstructorFicha(connection, idInstructor, idFicha, rol) {
    await connection.query(
      'INSERT INTO instructor_ficha (id_instructor, id_ficha, rol) VALUES (?, ?, ?)',
      [idInstructor, idFicha, rol],
    );
  }
}

module.exports = new FichaRepository();
