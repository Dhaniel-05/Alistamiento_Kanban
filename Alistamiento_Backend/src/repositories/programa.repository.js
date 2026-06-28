const db = require('../config/conexion_db');

const PROGRAMA_LIST_PROJECTION = `
  p.id_programa,
  p.codigo_programa,
  p.nombre_programa,
  COUNT(f.id_ficha) AS total_fichas
`;

class ProgramaRepository {
  async findAll({ page = 1, limit } = {}) {
    const usePagination = limit !== undefined && limit !== null;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = usePagination ? Math.min(Math.max(1, Number(limit) || 10), 100) : null;
    const offset = usePagination ? (safePage - 1) * safeLimit : 0;

    let sql = `
      SELECT ${PROGRAMA_LIST_PROJECTION}
      FROM programa_formacion p
      LEFT JOIN fichas f ON f.id_programa = p.id_programa
      GROUP BY p.id_programa, p.codigo_programa, p.nombre_programa
    `;
    const params = [];

    if (usePagination) {
      sql += ' LIMIT ? OFFSET ?';
      params.push(safeLimit, offset);
    }

    const [rows] = await db.query(sql, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await db.query(
      `SELECT
        p.id_programa,
        p.codigo_programa,
        p.nombre_programa,
        COUNT(f.id_ficha) AS total_fichas
      FROM programa_formacion p
      LEFT JOIN fichas f ON f.id_programa = p.id_programa
      WHERE p.id_programa = ?
      GROUP BY p.id_programa, p.codigo_programa, p.nombre_programa`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findSummaryById(id) {
    const [rows] = await db.query(
      `SELECT id_programa, nombre_programa
       FROM programa_formacion
       WHERE id_programa = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findFichasByProgramaId(id) {
    const [rows] = await db.query(
      `SELECT id_ficha, codigo_ficha
       FROM fichas
       WHERE id_programa = ?`,
      [id],
    );
    return rows;
  }

  async create({ codigo_programa, nombre_programa }) {
    const [result] = await db.query(
      `INSERT INTO programa_formacion (codigo_programa, nombre_programa)
       VALUES (?, ?)`,
      [codigo_programa, nombre_programa],
    );
    return result.insertId;
  }

  async update(id, { codigo_programa, nombre_programa }) {
    const [result] = await db.query(
      `UPDATE programa_formacion
       SET codigo_programa = ?, nombre_programa = ?
       WHERE id_programa = ?`,
      [codigo_programa, nombre_programa, id],
    );
    return result.affectedRows;
  }

  async existsById(id) {
    const [rows] = await db.query(
      'SELECT id_programa FROM programa_formacion WHERE id_programa = ? LIMIT 1',
      [id],
    );
    return rows.length > 0;
  }

  async deleteCascade(id) {
    const connection = await db.getConnection();

    try {
      const programa = await this._findSummaryWithConnection(connection, id);
      if (!programa) {
        return { notFound: true };
      }

      const fichas = await this._findFichasWithConnection(connection, id);
      const fichasAEliminar = fichas.map((f) => f.id_ficha);

      await connection.beginTransaction();
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');

      try {
        if (fichasAEliminar.length > 0) {
          const placeholders = fichasAEliminar.map(() => '?').join(',');

          await connection.query(
            `DELETE FROM instructor_ficha WHERE id_ficha IN (${placeholders})`,
            fichasAEliminar,
          );

          const [trimestresFichas] = await connection.query(
            `SELECT id_trimestre FROM trimestre WHERE id_ficha IN (${placeholders})`,
            fichasAEliminar,
          );

          if (trimestresFichas.length > 0) {
            const idsTrimestres = trimestresFichas.map((t) => t.id_trimestre);
            const trimPlaceholders = idsTrimestres.map(() => '?').join(',');

            await connection.query(
              `DELETE FROM rap_trimestre WHERE id_trimestre IN (${trimPlaceholders})`,
              idsTrimestres,
            );

            await connection.query(
              `DELETE FROM trimestre WHERE id_ficha IN (${placeholders})`,
              fichasAEliminar,
            );
          }

          await connection.query(
            `DELETE FROM planeacion_pedagogica WHERE id_ficha IN (${placeholders})`,
            fichasAEliminar,
          );

          await connection.query(
            'DELETE FROM fichas WHERE id_programa = ?',
            [id],
          );
        }

        const [competencias] = await connection.query(
          'SELECT id_competencia FROM competencias WHERE id_programa = ?',
          [id],
        );
        const competenciasIds = competencias.map((c) => c.id_competencia);

        if (competenciasIds.length > 0) {
          const compPlaceholders = competenciasIds.map(() => '?').join(',');

          const [raps] = await connection.query(
            `SELECT id_rap FROM raps WHERE id_competencia IN (${compPlaceholders})`,
            competenciasIds,
          );
          const rapsIds = raps.map((r) => r.id_rap);

          if (rapsIds.length > 0) {
            const rapPlaceholders = rapsIds.map(() => '?').join(',');

            await connection.query(
              `DELETE FROM actividad_rap WHERE id_rap IN (${rapPlaceholders})`,
              rapsIds,
            );
            await connection.query(
              `DELETE FROM conocimiento_saber WHERE id_rap IN (${rapPlaceholders})`,
              rapsIds,
            );
            await connection.query(
              `DELETE FROM conocimiento_proceso WHERE id_rap IN (${rapPlaceholders})`,
              rapsIds,
            );
            await connection.query(
              `DELETE FROM criterios_evaluacion WHERE id_rap IN (${rapPlaceholders})`,
              rapsIds,
            );
            await connection.query(
              `DELETE FROM raps WHERE id_competencia IN (${compPlaceholders})`,
              competenciasIds,
            );
          }

          await connection.query(
            `DELETE FROM competencias WHERE id_competencia IN (${compPlaceholders})`,
            competenciasIds,
          );
        } else {
          await connection.query(
            'DELETE FROM competencias WHERE id_programa = ?',
            [id],
          );
        }

        await connection.query(
          'DELETE FROM programa_formacion WHERE id_programa = ?',
          [id],
        );

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        await connection.commit();

        return {
          notFound: false,
          programa,
          fichas,
          competenciasIds,
        };
      } catch (error) {
        await connection.rollback();
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        throw error;
      }
    } finally {
      connection.release();
    }
  }

  async _findSummaryWithConnection(connection, id) {
    const [rows] = await connection.query(
      `SELECT id_programa, nombre_programa
       FROM programa_formacion
       WHERE id_programa = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  async _findFichasWithConnection(connection, id) {
    const [rows] = await connection.query(
      `SELECT id_ficha, codigo_ficha
       FROM fichas
       WHERE id_programa = ?`,
      [id],
    );
    return rows;
  }
}

module.exports = new ProgramaRepository();
