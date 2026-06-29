const db = require('../config/conexion_db');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const fichaFasesRepository = require('../repositories/fichaFases.repository');
const fichaRepository = require('../repositories/ficha.repository');

const ESTADOS_VALIDOS = ['Abierta', 'Bloqueada'];

function throwFichaFasesError(statusCode, message, code = undefined) {
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

class FichaFasesService {
  async listarPorFicha(idFicha) {
    try {
      const ficha = await fichaRepository.findById(idFicha);
      if (!ficha) {
        throwFichaFasesError(404, 'Ficha no encontrada', 'FICHA_NO_ENCONTRADA');
      }

      return await fichaFasesRepository.findByFicha(idFicha);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al listar fases de ficha', { stack: error.stack });
      throwFichaFasesError(500, 'Error al listar fases de ficha');
    }
  }

  async copiarPlantillaAFicha(idFicha, jornada, connection) {
    const totalPlantilla = await fichaFasesRepository.countPlantillaActiva(jornada, connection);

    if (totalPlantilla === 0) {
      logger.warn('Plantilla de fases vacía para la jornada; la ficha se crea sin fases-lanes', {
        id_ficha: idFicha,
        jornada,
      });
      return 0;
    }

    return fichaFasesRepository.copiarPlantillaAFicha(idFicha, jornada, connection);
  }

  async cambiarEstado(idFichaFase, estado) {
    try {
      if (!ESTADOS_VALIDOS.includes(estado)) {
        throwFichaFasesError(400, 'Estado inválido. Use Abierta o Bloqueada', 'ESTADO_INVALIDO');
      }

      const fase = await fichaFasesRepository.findById(idFichaFase);
      if (!fase) {
        throwFichaFasesError(404, 'Fase de ficha no encontrada', 'FICHA_FASE_NO_ENCONTRADA');
      }

      await fichaFasesRepository.updateEstado(idFichaFase, estado);

      return {
        mensaje: 'Estado de fase actualizado correctamente',
        id_ficha_fase: idFichaFase,
        estado,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al cambiar estado de fase', { stack: error.stack });
      throwFichaFasesError(500, 'Error al cambiar estado de fase');
    }
  }

  async regenerarFases(idFicha) {
    try {
      return await withTransaction(async (connection) => {
        const ficha = await fichaRepository.findById(idFicha, connection);
        if (!ficha) {
          throwFichaFasesError(404, 'Ficha no encontrada', 'FICHA_NO_ENCONTRADA');
        }

        const copiadas = await this.copiarPlantillaAFicha(idFicha, ficha.jornada, connection);
        const fases = await fichaFasesRepository.findByFicha(idFicha, connection);

        return {
          mensaje: 'Plantilla de fases regenerada correctamente',
          id_ficha: idFicha,
          fases_nuevas: copiadas,
          total_fases: fases.length,
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al regenerar fases de ficha', { stack: error.stack });
      throwFichaFasesError(500, 'Error al regenerar fases de ficha');
    }
  }
}

module.exports = new FichaFasesService();
