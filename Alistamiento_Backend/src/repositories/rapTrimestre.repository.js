class RapTrimestreRepository {
  async getCompetenciaDeRap(connection, idRap) {
    const [rows] = await connection.query(
      `SELECT id_competencia
       FROM raps
       WHERE id_rap = ?`,
      [idRap],
    );
    return rows[0]?.id_competencia ?? null;
  }

  async getDuracionCompetencia(connection, idCompetencia) {
    const [rows] = await connection.query(
      `SELECT duracion_maxima
       FROM competencias
       WHERE id_competencia = ?`,
      [idCompetencia],
    );
    return rows[0]?.duracion_maxima ?? null;
  }

  async contarRapsDeCompetencia(connection, idCompetencia) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM raps
       WHERE id_competencia = ?`,
      [idCompetencia],
    );
    return Number(rows[0].total);
  }

  async contarTrimestresDeRap(connection, idRap, idFicha = undefined) {
    let sql = `SELECT COUNT(*) AS total
               FROM rap_trimestre
               WHERE id_rap = ?`;
    const params = [idRap];

    if (idFicha !== undefined && idFicha !== null) {
      sql += ' AND id_ficha = ?';
      params.push(idFicha);
    }

    const [rows] = await connection.query(sql, params);
    return Number(rows[0].total);
  }

  async upsertAsignacion(connection, {
    idRap,
    idTrimestre,
    idFicha,
    horasTrimestre,
    horasSemana,
  }) {
    await connection.query(
      `INSERT INTO rap_trimestre (
         id_rap,
         id_trimestre,
         id_ficha,
         horas_trimestre,
         horas_semana,
         estado
       )
       VALUES (?, ?, ?, ?, ?, 'Planeado')
       ON DUPLICATE KEY UPDATE
         horas_trimestre = VALUES(horas_trimestre),
         horas_semana = VALUES(horas_semana),
         estado = 'Planeado'`,
      [idRap, idTrimestre, idFicha, horasTrimestre, horasSemana],
    );
  }

  async updateHoras(connection, idRap, idFicha, horasTrimestre, horasSemana) {
    await connection.query(
      `UPDATE rap_trimestre
       SET horas_trimestre = ?,
           horas_semana = ?
       WHERE id_rap = ?
         AND id_ficha = ?`,
      [horasTrimestre, horasSemana, idRap, idFicha],
    );
  }

  async deleteAsignacion(connection, idRap, idTrimestre, idFicha) {
    const [result] = await connection.query(
      `DELETE FROM rap_trimestre
       WHERE id_rap = ?
         AND id_trimestre = ?
         AND id_ficha = ?`,
      [idRap, idTrimestre, idFicha],
    );
    return result.affectedRows;
  }

  async deleteOtherAsignacionesEnFicha(connection, idRap, idFicha, idTrimestreExcluido) {
    await connection.query(
      `DELETE FROM rap_trimestre
       WHERE id_rap = ?
         AND id_ficha = ?
         AND id_trimestre != ?`,
      [idRap, idFicha, idTrimestreExcluido],
    );
  }
}

module.exports = new RapTrimestreRepository();
