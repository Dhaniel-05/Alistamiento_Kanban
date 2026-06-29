const db = require('../config/conexion_db');

const FICHA_FASE_PROJECTION = `
  id_ficha_fase,
  id_ficha,
  nombre_fase,
  orden,
  color,
  estado,
  activo
`;

class FichaFasesRepository {
  async findByFicha(idFicha, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${FICHA_FASE_PROJECTION}
       FROM ficha_fases
       WHERE id_ficha = ?
       ORDER BY orden`,
      [idFicha],
    );
    return rows;
  }

  async countPlantillaActiva(jornada, connection) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM fases_configuracion
       WHERE jornada = ? AND activo = 1`,
      [jornada],
    );
    return Number(rows[0].total);
  }

  async copiarPlantillaAFicha(idFicha, jornada, connection) {
    const [result] = await connection.query(
      `INSERT IGNORE INTO ficha_fases (id_ficha, nombre_fase, orden, color, activo)
       SELECT ?, nombre_fase, orden, color, activo
       FROM fases_configuracion
       WHERE jornada = ? AND activo = 1`,
      [idFicha, jornada],
    );
    return result.affectedRows;
  }

  async findById(idFichaFase, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${FICHA_FASE_PROJECTION}
       FROM ficha_fases
       WHERE id_ficha_fase = ?`,
      [idFichaFase],
    );
    return rows[0] ?? null;
  }

  async updateEstado(idFichaFase, estado, connection = db) {
    const [result] = await connection.query(
      `UPDATE ficha_fases
       SET estado = ?
       WHERE id_ficha_fase = ?`,
      [estado, idFichaFase],
    );
    return result.affectedRows;
  }
}

module.exports = new FichaFasesRepository();
