const db = require('../config/conexion_db');

const SABANA_BASE_PROJECTION = `
  f.id_ficha,
  c.id_competencia,
  c.codigo_norma,
  c.nombre_competencia,
  c.duracion_maxima,
  r.id_rap,
  r.codigo AS codigo_rap,
  r.denominacion AS descripcion_rap,
  r.duracion AS duracion_rap,
  t.id_trimestre,
  t.no_trimestre,
  t.fase AS nombre_fase,
  rt.id_rap_trimestre,
  rt.horas_trimestre,
  rt.horas_semana,
  rt.estado,
  rt.id_instructor,
  instr.nombre AS instructor_asignado
`;

class SabanaRepository {
  async fichaExists(idFicha, connection = db) {
    const [rows] = await connection.query(
      'SELECT id_ficha FROM fichas WHERE id_ficha = ? LIMIT 1',
      [idFicha],
    );
    return rows.length > 0;
  }

  async findSabanaBaseByFicha(idFicha, connection = db) {
    const [rows] = await connection.query(
      `SELECT ${SABANA_BASE_PROJECTION}
       FROM fichas f
       JOIN proyectos p ON f.id_programa = p.id_programa
       JOIN competencias c ON c.id_programa = p.id_programa
       JOIN raps r ON r.id_competencia = c.id_competencia
       JOIN trimestre t ON t.id_ficha = f.id_ficha
       LEFT JOIN rap_trimestre rt
         ON rt.id_rap = r.id_rap
        AND rt.id_trimestre = t.id_trimestre
        AND rt.id_ficha = f.id_ficha
       LEFT JOIN instructores instr ON instr.id_instructor = rt.id_instructor
       WHERE f.id_ficha = ?
       ORDER BY c.id_competencia, CAST(r.codigo AS UNSIGNED), r.id_rap, t.no_trimestre`,
      [idFicha],
    );
    return rows;
  }
}

module.exports = new SabanaRepository();
