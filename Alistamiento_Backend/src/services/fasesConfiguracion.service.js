const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const fasesConfiguracionRepository = require('../repositories/fasesConfiguracion.repository');

const JORNADAS_VALIDAS = ['Diurna', 'Nocturna', 'Personalizada'];

function throwFasesConfigError(statusCode, message, code = undefined) {
  throw new AppError(message, statusCode, true, code);
}

function mapDuplicateEntry(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    throwFasesConfigError(
      409,
      'Ya existe una fase con ese nombre para la jornada indicada',
      'FASE_CONFIG_DUPLICADA',
    );
  }
}

class FasesConfiguracionService {
  _validateJornada(jornada) {
    if (!JORNADAS_VALIDAS.includes(jornada)) {
      throwFasesConfigError(400, 'Jornada inválida', 'JORNADA_INVALIDA');
    }
  }

  async listar({ jornada } = {}) {
    try {
      if (jornada) {
        this._validateJornada(jornada);
      }
      return await fasesConfiguracionRepository.findAll({ jornada });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al listar fases de configuración', { stack: error.stack });
      throwFasesConfigError(500, 'Error al listar fases de configuración');
    }
  }

  async obtener(id) {
    try {
      const fase = await fasesConfiguracionRepository.findById(id);
      if (!fase) {
        throwFasesConfigError(404, 'Fase de configuración no encontrada', 'FASE_CONFIG_NO_ENCONTRADA');
      }
      return fase;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al obtener fase de configuración', { stack: error.stack });
      throwFasesConfigError(500, 'Error al obtener fase de configuración');
    }
  }

  async crear(data) {
    try {
      this._validateJornada(data.jornada);

      if (!data.nombre_fase?.trim()) {
        throwFasesConfigError(400, 'El nombre de la fase es obligatorio');
      }

      if (!Number.isInteger(data.orden) || data.orden < 1) {
        throwFasesConfigError(400, 'El orden debe ser un entero positivo');
      }

      const id = await fasesConfiguracionRepository.create(data);
      return {
        statusCode: 201,
        body: {
          mensaje: 'Fase de configuración creada correctamente',
          id_fase_config: id,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      mapDuplicateEntry(error);
      logger.error('Error al crear fase de configuración', { stack: error.stack, code: error.code });
      throwFasesConfigError(500, 'Error al crear fase de configuración');
    }
  }

  async actualizar(id, data) {
    try {
      const existe = await fasesConfiguracionRepository.findById(id);
      if (!existe) {
        throwFasesConfigError(404, 'Fase de configuración no encontrada', 'FASE_CONFIG_NO_ENCONTRADA');
      }

      this._validateJornada(data.jornada);

      if (!data.nombre_fase?.trim()) {
        throwFasesConfigError(400, 'El nombre de la fase es obligatorio');
      }

      if (!Number.isInteger(data.orden) || data.orden < 1) {
        throwFasesConfigError(400, 'El orden debe ser un entero positivo');
      }

      await fasesConfiguracionRepository.update(id, data);
      return { mensaje: 'Fase de configuración actualizada correctamente', id_fase_config: id };
    } catch (error) {
      if (error instanceof AppError) throw error;
      mapDuplicateEntry(error);
      logger.error('Error al actualizar fase de configuración', { stack: error.stack, code: error.code });
      throwFasesConfigError(500, 'Error al actualizar fase de configuración');
    }
  }

  async eliminar(id) {
    try {
      const existe = await fasesConfiguracionRepository.findById(id);
      if (!existe) {
        throwFasesConfigError(404, 'Fase de configuración no encontrada', 'FASE_CONFIG_NO_ENCONTRADA');
      }

      await fasesConfiguracionRepository.delete(id);
      return { mensaje: 'Fase de configuración eliminada correctamente' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error al eliminar fase de configuración', { stack: error.stack });
      throwFasesConfigError(500, 'Error al eliminar fase de configuración');
    }
  }
}

module.exports = new FasesConfiguracionService();
