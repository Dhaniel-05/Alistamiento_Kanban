const db = require('../config/conexion_db');

const INSTRUCTOR_LIST_PROJECTION = `
  i.id_instructor,
  i.cedula,
  i.nombre,
  i.email,
  i.id_rol,
  r.nombre AS rol,
  COALESCE(GROUP_CONCAT(p.nombre ORDER BY p.id_permiso SEPARATOR ', '), 'Sin Permisos') AS permisos
`;

const INSTRUCTOR_FROM_JOINS = `
  FROM instructores i
  LEFT JOIN roles r ON i.id_rol = r.id_rol
  LEFT JOIN roles_permisos rp ON r.id_rol = rp.id_rol
  LEFT JOIN permisos p ON rp.id_permiso = p.id_permiso
`;

class InstructorRepository {
  async findAll({ page = 1, limit } = {}) {
    const usePagination = limit !== undefined && limit !== null;
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = usePagination ? Math.min(Math.max(1, Number(limit) || 10), 100) : null;
    const offset = usePagination ? (safePage - 1) * safeLimit : 0;

    let sql = `
      SELECT ${INSTRUCTOR_LIST_PROJECTION}
      ${INSTRUCTOR_FROM_JOINS}
      GROUP BY i.id_instructor, i.cedula, i.nombre, i.email, i.id_rol, r.nombre
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
        i.id_instructor,
        i.nombre,
        i.email,
        i.cedula,
        i.id_rol,
        r.nombre AS rol,
        COALESCE(GROUP_CONCAT(p.nombre SEPARATOR ', '), 'Sin Permisos') AS permisos
      ${INSTRUCTOR_FROM_JOINS}
      WHERE i.id_instructor = ?
      GROUP BY i.id_instructor, i.nombre, i.email, i.cedula, i.id_rol, r.nombre`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByEmail(email) {
    const [rows] = await db.query(
      `SELECT
        id_instructor,
        nombre,
        email,
        cedula,
        id_rol
      FROM instructores
      WHERE email = ?`,
      [email],
    );
    return rows[0] ?? null;
  }

  /**
   * Solo para autenticación (login). Incluye hash de contraseña y primer_acceso.
   */
  async findByEmailForAuth(email) {
    const [rows] = await db.query(
      `SELECT
        i.id_instructor,
        i.nombre,
        i.email,
        i.cedula,
        i.id_rol,
        i.contrasena,
        i.primer_acceso,
        r.nombre AS rol
      FROM instructores i
      LEFT JOIN roles r ON i.id_rol = r.id_rol
      WHERE i.email = ?`,
      [email],
    );
    return rows[0] ?? null;
  }

  async findPermisoNombresByInstructorId(idInstructor) {
    const [rows] = await db.query(
      `SELECT p.nombre
       FROM instructores i
       JOIN roles_permisos rp ON rp.id_rol = i.id_rol
       JOIN permisos p ON p.id_permiso = rp.id_permiso
       WHERE i.id_instructor = ?
       ORDER BY p.nombre`,
      [idInstructor],
    );
    return rows.map((row) => row.nombre);
  }

  /** Perfil de sesión con permisos vigentes desde roles_permisos (sin datos sensibles). */
  async findSessionById(idInstructor) {
    const [rows] = await db.query(
      `SELECT
        i.id_instructor,
        i.nombre,
        i.email,
        i.cedula,
        i.id_rol,
        i.primer_acceso,
        r.nombre AS rol
       FROM instructores i
       LEFT JOIN roles r ON i.id_rol = r.id_rol
       WHERE i.id_instructor = ?`,
      [idInstructor],
    );

    const instructor = rows[0];
    if (!instructor) {
      return null;
    }

    const permisos = await this.findPermisoNombresByInstructorId(idInstructor);

    return {
      id: instructor.id_instructor,
      nombre: instructor.nombre,
      email: instructor.email,
      cedula: instructor.cedula,
      rol: instructor.rol || 'Sin rol',
      permisos,
      primer_acceso: instructor.primer_acceso === undefined
        ? true
        : instructor.primer_acceso === 1 || instructor.primer_acceso === true,
    };
  }

  async existsByCedula(cedula) {
    const [rows] = await db.query(
      'SELECT id_instructor FROM instructores WHERE cedula = ? LIMIT 1',
      [cedula],
    );
    return rows.length > 0;
  }

  async existsByCedulaExcluding(cedula, excludeId) {
    const [rows] = await db.query(
      'SELECT id_instructor FROM instructores WHERE cedula = ? AND id_instructor != ? LIMIT 1',
      [cedula, excludeId],
    );
    return rows.length > 0;
  }

  async create({ id_rol, nombre, email, contrasenaHash, cedula, estado }) {
    const [result] = await db.query(
      `INSERT INTO instructores (id_rol, nombre, email, contrasena, cedula, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_rol, nombre, email, contrasenaHash, cedula, estado],
    );
    return result.insertId;
  }

  async update(id, { nombre, email, id_rol, cedula, estado }) {
    const [result] = await db.query(
      `UPDATE instructores
       SET nombre = ?, email = ?, id_rol = ?, cedula = ?, estado = ?
       WHERE id_instructor = ?`,
      [nombre, email, id_rol, cedula, estado, id],
    );
    return result.affectedRows;
  }

  async updateWithPassword(id, { nombre, email, contrasenaHash, id_rol, cedula, estado }) {
    const [result] = await db.query(
      `UPDATE instructores
       SET nombre = ?, email = ?, contrasena = ?, id_rol = ?, cedula = ?, estado = ?
       WHERE id_instructor = ?`,
      [nombre, email, contrasenaHash, id_rol, cedula, estado, id],
    );
    return result.affectedRows;
  }

  async updatePassword(id, contrasenaHash) {
    const [result] = await db.query(
      'UPDATE instructores SET contrasena = ?, primer_acceso = 0 WHERE id_instructor = ?',
      [contrasenaHash, id],
    );
    return result.affectedRows;
  }

  async delete(id) {
    const [result] = await db.query(
      'DELETE FROM instructores WHERE id_instructor = ?',
      [id],
    );
    return result.affectedRows;
  }

  async findFichasByInstructorId(id) {
    const [rows] = await db.query(
      `SELECT
        f.id_ficha,
        f.codigo_ficha,
        f.modalidad,
        f.jornada,
        f.ambiente,
        f.fecha_inicio,
        f.fecha_final,
        f.cantidad_trimestre,
        p.id_programa,
        p.nombre_programa,
        p.codigo_programa
      FROM instructor_ficha inf
      INNER JOIN fichas f ON inf.id_ficha = f.id_ficha
      LEFT JOIN programa_formacion p ON p.id_programa = f.id_programa
      WHERE inf.id_instructor = ?`,
      [id],
    );
    return rows;
  }
}

module.exports = new InstructorRepository();
