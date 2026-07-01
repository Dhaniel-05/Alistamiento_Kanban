const db = require('../config/conexion_db');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const fichaRepository = require('../repositories/ficha.repository');
const fichaFasesService = require('./fichaFases.service');

function throwFichaError(statusCode, message, code = undefined) {
  throw new AppError(message, statusCode, true, code);
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

class FichaService {
  async crearFicha(data) {
    try {
      return await withTransaction(async (connection) => {
        const idFicha = await fichaRepository.insert(connection, data);

        await fichaFasesService.copiarPlantillaAFicha(idFicha, data.jornada, connection);

        const { totalTrimestres, invalidJornada } = await fichaRepository.insertTrimestres(
          connection,
          idFicha,
          data.jornada,
        );

        if (invalidJornada) {
          throwFichaError(400, 'Jornada inválida', 'JORNADA_INVALIDA');
        }

        const trimestresSincronizados = await fichaRepository.syncTrimestreFasesFromFichaFases(
          connection,
          idFicha,
        );

        if (data.gestor) {
          await fichaRepository.insertInstructorFicha(connection, data.gestor, idFicha, 'Gestor');
        }

        if (Array.isArray(data.instructores)) {
          for (const idInstructor of data.instructores) {
            await fichaRepository.insertInstructorFicha(
              connection,
              idInstructor,
              idFicha,
              'Instructor',
            );
          }
        }

        return {
          mensaje: 'Ficha creada correctamente',
          id_ficha: idFicha,
          trimestres_creados: totalTrimestres,
          trimestres_fases_sincronizados: trimestresSincronizados,
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al crear ficha', { stack: error.stack });
      throwFichaError(500, 'Error al crear ficha');
    }
  }

  async sincronizarFasesTrimestre(idFicha = null) {
    try {
      return await withTransaction(async (connection) => {
        if (idFicha != null) {
          const ficha = await fichaRepository.findById(idFicha, connection);
          if (!ficha) {
            throwFichaError(404, 'Ficha no encontrada', 'FICHA_NO_ENCONTRADA');
          }
        }

        const filasActualizadas = await fichaRepository.syncTrimestreFasesFromFichaFases(
          connection,
          idFicha,
        );

        return {
          mensaje: idFicha
            ? 'Fases de trimestre sincronizadas para la ficha'
            : 'Fases de trimestre sincronizadas para todas las fichas',
          id_ficha: idFicha,
          filas_actualizadas: filasActualizadas,
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al sincronizar fases de trimestre', { stack: error.stack });
      throwFichaError(500, 'Error al sincronizar fases de trimestre');
    }
  }
}

module.exports = new FichaService();
