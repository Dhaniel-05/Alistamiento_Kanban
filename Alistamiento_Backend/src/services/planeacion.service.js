const db = require('../config/conexion_db');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const rapTrimestreRepository = require('../repositories/rapTrimestre.repository');

const SEMANAS_LECTIVAS_TRIMESTRE = 11;

function calcularHorasSena(duracionCompetencia, rapsCompetencia, trimestresAsignados) {
  const trimestres = trimestresAsignados === 0 ? 1 : trimestresAsignados;
  const horasTrimestre = duracionCompetencia / rapsCompetencia / trimestres;
  const horasSemana = horasTrimestre / SEMANAS_LECTIVAS_TRIMESTRE;
  return { horasTrimestre, horasSemana };
}

async function withTransaction(operation) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

class PlaneacionService {
  async _assertRapTieneCompetencia(connection, idRap) {
    const idCompetencia = await rapTrimestreRepository.getCompetenciaDeRap(connection, idRap);

    if (idCompetencia === null || idCompetencia === undefined) {
      throw new AppError('El RAP no tiene competencia asociada', 422, true, 'RAP_SIN_COMPETENCIA');
    }

    return idCompetencia;
  }

  async _recalcularHorasRapEnTransaccion(connection, idRap, idFicha) {
    const idCompetencia = await this._assertRapTieneCompetencia(connection, idRap);
    const duracionCompetencia = await rapTrimestreRepository.getDuracionCompetencia(connection, idCompetencia);
    const rapsCompetencia = await rapTrimestreRepository.contarRapsDeCompetencia(connection, idCompetencia);
    const trimestresEnFicha = await rapTrimestreRepository.contarTrimestresDeRap(connection, idRap, idFicha);

    const { horasTrimestre, horasSemana } = calcularHorasSena(
      duracionCompetencia,
      rapsCompetencia,
      trimestresEnFicha,
    );

    await rapTrimestreRepository.updateHoras(
      connection,
      idRap,
      idFicha,
      horasTrimestre,
      horasSemana,
    );
  }

  async asignarRapTrimestre(idRap, idTrimestre, idFicha, move = false) {
    try {
      return await withTransaction(async (connection) => {
        if (move === true) {
          await rapTrimestreRepository.deleteOtherAsignacionesEnFicha(
            connection,
            idRap,
            idFicha,
            idTrimestre,
          );
        }

        const idCompetencia = await this._assertRapTieneCompetencia(connection, idRap);
        const duracionCompetencia = await rapTrimestreRepository.getDuracionCompetencia(
          connection,
          idCompetencia,
        );
        const rapsCompetencia = await rapTrimestreRepository.contarRapsDeCompetencia(
          connection,
          idCompetencia,
        );

        // Misma lógica que asignar_rap_trimestre: cuenta global de trimestres del RAP (antes del upsert)
        const trimestresGlobales = await rapTrimestreRepository.contarTrimestresDeRap(connection, idRap);
        const { horasTrimestre, horasSemana } = calcularHorasSena(
          duracionCompetencia,
          rapsCompetencia,
          trimestresGlobales,
        );

        await rapTrimestreRepository.upsertAsignacion(connection, {
          idRap,
          idTrimestre,
          idFicha,
          horasTrimestre,
          horasSemana,
        });

        // Equivalente a la segunda CALL recalcular_horas_rap del flujo anterior
        await this._recalcularHorasRapEnTransaccion(connection, idRap, idFicha);

        return true;
      });
    } catch (error) {
      logger.error('Error en asignarRapTrimestre', { stack: error.stack });
      throw error;
    }
  }

  async recalcularHorasRap(idRap, idFicha) {
    try {
      return await withTransaction(async (connection) => {
        await this._recalcularHorasRapEnTransaccion(connection, idRap, idFicha);
        return true;
      });
    } catch (error) {
      logger.error('Error en recalcularHorasRap', { stack: error.stack });
      throw error;
    }
  }

  async quitarRapTrimestre(idRap, idTrimestre, idFicha) {
    try {
      return await withTransaction(async (connection) => {
        await rapTrimestreRepository.deleteAsignacion(connection, idRap, idTrimestre, idFicha);
        await this._recalcularHorasRapEnTransaccion(connection, idRap, idFicha);
        return true;
      });
    } catch (error) {
      logger.error('Error en quitarRapTrimestre', { stack: error.stack });
      throw error;
    }
  }
}

module.exports = new PlaneacionService();
