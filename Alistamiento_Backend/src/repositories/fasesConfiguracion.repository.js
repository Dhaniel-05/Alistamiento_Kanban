const db = require('../config/conexion_db');

const FASE_CONFIG_PROJECTION = `
  id_fase_config,
  jornada,
  nombre_fase,
  orden,
  color,
  descripcion,
  activo
`;

class FasesConfiguracionRepository {
  async findAll({ jornada } = {}, connection = db) {
    let sql = `SELECT ${FASE_CONFIG_PROJECTION}
               FROM fases_configuracion`;
    const params = [];

    if (jornada) {
      sql += ' WHERE jornada = ?';
      params.push(jornada);
    }

    sql += ' ORDER BY jornada, orden';

    const [rows] = await connection.query(sql, params);
    return rows;
  }

  async findById(id, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${FASE_CONFIG_PROJECTION}
       FROM fases_configuracion
       WHERE id_fase_config = ?`,
      [id],
    );
    return rows[0] ?? null;
  }

  async create(data, connection = db) {
    const { jornada, nombre_fase, orden, color, descripcion, activo } = data;
    const [result] = await connection.query(
      `INSERT INTO fases_configuracion
         (jornada, nombre_fase, orden, color, descripcion, activo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [jornada, nombre_fase, orden, color ?? '#3B82F6', descripcion ?? null, activo ?? 1],
    );
    return result.insertId;
  }

  async update(id, data, connection = db) {
    const { jornada, nombre_fase, orden, color, descripcion, activo } = data;
    const [result] = await connection.query(
      `UPDATE fases_configuracion
       SET jornada = ?,
           nombre_fase = ?,
           orden = ?,
           color = ?,
           descripcion = ?,
           activo = ?
       WHERE id_fase_config = ?`,
      [jornada, nombre_fase, orden, color, descripcion, activo, id],
    );
    return result.affectedRows;
  }

  async delete(id, connection = db) {
    const [result] = await connection.query(
      'DELETE FROM fases_configuracion WHERE id_fase_config = ?',
      [id],
    );
    return result.affectedRows;
  }
}

module.exports = new FasesConfiguracionRepository();
