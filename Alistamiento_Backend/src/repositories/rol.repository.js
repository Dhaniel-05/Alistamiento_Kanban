const db = require('../config/conexion_db');

class RolRepository {
  async findById(idRol) {
    const [rows] = await db.query(
      'SELECT id_rol, nombre FROM roles WHERE id_rol = ? LIMIT 1',
      [idRol],
    );
    return rows[0] ?? null;
  }

  async findByNames(nombres) {
    if (!nombres.length) {
      return [];
    }

    const placeholders = nombres.map(() => '?').join(', ');
    const [rows] = await db.query(
      `SELECT id_rol, nombre
       FROM roles
       WHERE nombre IN (${placeholders})
       ORDER BY nombre`,
      nombres,
    );
    return rows;
  }
}

module.exports = new RolRepository();
