const config = require('../config/env');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const programaRepository = require('../repositories/programa.repository');

function throwProgramaError(statusCode, responseBody, message = 'Programa error') {
  throw new AppError(message, statusCode, true, undefined, responseBody);
}

function mapDbError(error, defaultMessage) {
  if (error.code === 'ER_DUP_ENTRY') {
    throwProgramaError(400, { mensaje: 'El código del programa ya existe' });
  }
  throwProgramaError(500, { mensaje: defaultMessage });
}

class ProgramaService {
  async getAll({ page, limit } = {}) {
    try {
      return await programaRepository.findAll({ page, limit });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener programas', { stack: error.stack });
      throwProgramaError(500, { mensaje: 'Error al obtener programas' });
    }
  }

  async getById(id) {
    try {
      const programa = await programaRepository.findById(id);
      if (!programa) {
        throwProgramaError(404, { mensaje: 'Programa no encontrado' });
      }
      return programa;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener programa', { stack: error.stack });
      throwProgramaError(500, { mensaje: 'Error al obtener programa' });
    }
  }

  async create({ codigo_programa, nombre_programa }) {
    try {
      const id_programa = await programaRepository.create({ codigo_programa, nombre_programa });
      return {
        statusCode: 201,
        body: {
          mensaje: 'Programa creado exitosamente',
          id_programa,
          codigo_programa,
          nombre_programa,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al crear programa', { stack: error.stack, code: error.code });
      mapDbError(error, 'Error al crear programa');
    }
  }

  async update(id, { codigo_programa, nombre_programa }) {
    try {
      const exists = await programaRepository.existsById(id);
      if (!exists) {
        throwProgramaError(404, { mensaje: 'Programa no encontrado' });
      }

      await programaRepository.update(id, { codigo_programa, nombre_programa });

      return {
        mensaje: 'Programa actualizado correctamente',
        id_programa: id,
        codigo_programa,
        nombre_programa,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al actualizar programa', { stack: error.stack, code: error.code });
      mapDbError(error, 'Error al actualizar programa');
    }
  }

  async remove(id) {
    try {
      logger.debug('Iniciando eliminación del programa', { id_programa: id });

      const result = await programaRepository.deleteCascade(id);

      if (result.notFound) {
        throwProgramaError(404, {
          success: false,
          mensaje: 'Programa no encontrado',
        });
      }

      const { programa, fichas, competenciasIds } = result;

      logger.debug('Programa eliminado correctamente', {
        id_programa: id,
        fichas_eliminadas: fichas.length,
        competencias_eliminadas: competenciasIds.length,
      });

      return {
        success: true,
        mensaje: '✅ Programa y todos sus datos relacionados eliminados correctamente',
        programa: programa.nombre_programa,
        fichasEliminadas: fichas.length,
        competenciasEliminadas: competenciasIds.length,
        rapsEliminados: competenciasIds.length > 0 ? 'Todos los RAPs de las competencias' : 0,
        detallesFichas: fichas.map((f) => f.codigo_ficha),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error('Error al eliminar programa', {
        code: error.code,
        message: error.message,
        sqlMessage: error.sqlMessage,
        stack: error.stack,
      });

      let mensajeError = 'Error al eliminar programa';

      if (error.code === 'ER_BAD_FIELD_ERROR') {
        mensajeError = 'Error en la estructura de la base de datos';
      } else if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
        mensajeError = 'No se puede eliminar el programa porque tiene datos relacionados que deben eliminarse primero';
      }

      throwProgramaError(500, {
        success: false,
        mensaje: mensajeError,
        error: config.nodeEnv === 'development' ? error.message : undefined,
      });
    }
  }
}

module.exports = new ProgramaService();
