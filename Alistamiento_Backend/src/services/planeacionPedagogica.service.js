const db = require('../config/conexion_db');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const planeacionRepository = require('../repositories/planeacion.repository');
const { buildGfpi134Workbook } = require('./planeacionExcel.service');

function throwPlaneacionError(statusCode, message, code = undefined) {
  const error = new AppError(message, statusCode, true, code);
  error.responseBody = { success: false, mensaje: message };
  if (code) {
    error.responseBody.code = code;
  }
  throw error;
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

class PlaneacionPedagogicaService {
  async _assertAccesoFicha(user, idFicha, connection = db) {
    const tieneAcceso = await planeacionRepository.usuarioTieneAccesoFicha(
      connection,
      user.id,
      user.rol,
      idFicha,
    );

    if (!tieneAcceso) {
      throwPlaneacionError(403, 'No tiene acceso a esta ficha', 'FICHA_FORBIDDEN');
    }
  }

  async _resolverIdTrimestre(connection, idFicha, { id_trimestre: idTrimestre, trimestre }) {
    if (idTrimestre !== undefined) {
      const row = await planeacionRepository.findTrimestreByIdAndFicha(
        connection,
        idTrimestre,
        idFicha,
      );
      if (!row) {
        throwPlaneacionError(
          400,
          'id_trimestre no pertenece a la ficha indicada',
          'TRIMESTRE_INVALIDO',
        );
      }
      return row.id_trimestre;
    }

    const row = await planeacionRepository.findTrimestreByFichaAndNumero(
      connection,
      idFicha,
      trimestre,
    );

    if (!row) {
      throwPlaneacionError(
        400,
        `No existe trimestre ${trimestre} para la ficha ${idFicha}`,
        'TRIMESTRE_NO_ENCONTRADO',
      );
    }

    return row.id_trimestre;
  }

  async crearPlaneacion(body, user) {
    try {
      return await withTransaction(async (connection) => {
        const { id_ficha: idFicha, raps, fecha_creacion: fechaCreacion } = body;

        await this._assertAccesoFicha(user, idFicha, connection);

        const idTrimestre = await this._resolverIdTrimestre(connection, idFicha, body);
        const trimestreRow = await planeacionRepository.findTrimestreByIdAndFicha(
          connection,
          idTrimestre,
          idFicha,
        );

        const observaciones = `Planeación Trimestre ${trimestreRow.no_trimestre} - Ficha ${idFicha}`;
        const fecha = fechaCreacion ? new Date(fechaCreacion) : new Date();

        const idPlaneacion = await planeacionRepository.insertPlaneacion(connection, {
          idFicha,
          idTrimestre,
          observaciones,
          fechaCreacion: fecha,
        });

        logger.info('Planeación creada', {
          id_planeacion: idPlaneacion,
          id_trimestre: idTrimestre,
          editor: user.id,
        });

        let rapsGuardados = 0;
        for (const rap of raps) {
          await planeacionRepository.insertDetalle(connection, idPlaneacion, rap);
          rapsGuardados += 1;
        }

        return {
          success: true,
          mensaje: `Planeación pedagógica guardada exitosamente con ${rapsGuardados} RAPs`,
          data: {
            id_planeacion: idPlaneacion,
            id_trimestre: idTrimestre,
            total_raps: rapsGuardados,
            trimestre: trimestreRow.no_trimestre,
            ficha: idFicha,
          },
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error guardando planeación', { stack: error.stack });
      throwPlaneacionError(500, 'Error interno del servidor al guardar planeación');
    }
  }

  async obtenerPorFicha(idFicha, user) {
    try {
      await this._assertAccesoFicha(user, idFicha);
      const planeaciones = await planeacionRepository.findPlaneacionesByFicha(idFicha);

      return {
        success: true,
        data: planeaciones,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error obteniendo planeaciones', { stack: error.stack });
      throwPlaneacionError(500, 'Error obteniendo planeaciones');
    }
  }

  async obtenerPorId(idPlaneacion, user) {
    try {
      const planeacion = await planeacionRepository.findPlaneacionById(idPlaneacion);

      if (!planeacion) {
        throwPlaneacionError(404, 'Planeación no encontrada', 'PLANEACION_NOT_FOUND');
      }

      await this._assertAccesoFicha(user, planeacion.id_ficha);

      const detalles = await planeacionRepository.findDetallesByPlaneacion(idPlaneacion);

      return {
        success: true,
        data: {
          id_planeacion: planeacion.id_planeacion,
          id_ficha: planeacion.id_ficha,
          id_trimestre: planeacion.id_trimestre,
          no_trimestre: planeacion.no_trimestre,
          observaciones: planeacion.observaciones,
          fecha_creacion: planeacion.fecha_creacion,
          detalles,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error obteniendo planeación por id', { stack: error.stack });
      throwPlaneacionError(500, 'Error obteniendo planeación');
    }
  }

  async eliminar(idPlaneacion, user) {
    try {
      return await withTransaction(async (connection) => {
        const planeacion = await planeacionRepository.findPlaneacionById(idPlaneacion, connection);

        if (!planeacion) {
          throwPlaneacionError(404, 'Planeación no encontrada', 'PLANEACION_NOT_FOUND');
        }

        await this._assertAccesoFicha(user, planeacion.id_ficha, connection);

        const detallesEliminados = await planeacionRepository.deleteDetallesByPlaneacion(
          connection,
          idPlaneacion,
        );
        const eliminada = await planeacionRepository.deletePlaneacion(connection, idPlaneacion);

        if (eliminada === 0) {
          throwPlaneacionError(404, 'Planeación no encontrada', 'PLANEACION_NOT_FOUND');
        }

        logger.info('Planeación eliminada', { id_planeacion: idPlaneacion, editor: user.id });

        return {
          success: true,
          mensaje: 'Planeación eliminada exitosamente',
          data: {
            id_planeacion: idPlaneacion,
            detalles_eliminados: detallesEliminados,
          },
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error eliminando planeación', { stack: error.stack });
      throwPlaneacionError(500, 'Error interno del servidor al eliminar planeación');
    }
  }

  async actualizar(idPlaneacion, body, user) {
    try {
      return await withTransaction(async (connection) => {
        const planeacion = await planeacionRepository.findPlaneacionById(idPlaneacion, connection);

        if (!planeacion) {
          throwPlaneacionError(404, 'Planeación no encontrada', 'PLANEACION_NOT_FOUND');
        }

        await this._assertAccesoFicha(user, planeacion.id_ficha, connection);

        let actualizados = 0;

        for (const item of body.detalles) {
          const detalle = await planeacionRepository.findDetalleById(item.id_detalle, connection);

          if (!detalle || detalle.id_planeacion !== idPlaneacion) {
            throwPlaneacionError(
              400,
              `El detalle ${item.id_detalle} no pertenece a la planeación ${idPlaneacion}`,
              'DETALLE_INVALIDO',
            );
          }

          const { id_detalle: _id, ...fields } = item;
          const affected = await planeacionRepository.updateDetalle(
            connection,
            item.id_detalle,
            fields,
          );

          if (affected > 0) {
            actualizados += 1;
          }
        }

        logger.info('Planeación actualizada', {
          id_planeacion: idPlaneacion,
          detalles_actualizados: actualizados,
          editor: user.id,
        });

        return {
          success: true,
          mensaje: 'Planeación actualizada correctamente',
          data: {
            id_planeacion: idPlaneacion,
            detalles_actualizados: actualizados,
          },
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error actualizando planeación', { stack: error.stack });
      throwPlaneacionError(500, 'Error interno del servidor al actualizar planeación');
    }
  }

  async exportarExcel(idFicha, idTrimestre, user) {
    try {
      await this._assertAccesoFicha(user, idFicha);

      const [rows, metadata, integrantes] = await Promise.all([
        planeacionRepository.findExportRows(idFicha, idTrimestre ?? null),
        planeacionRepository.findExportMetadata(idFicha),
        planeacionRepository.findIntegrantesFicha(idFicha),
      ]);

      if (rows.length === 0) {
        throwPlaneacionError(
          404,
          'No hay datos de planeación para exportar con los filtros indicados',
          'EXPORT_SIN_DATOS',
        );
      }

      const buffer = await buildGfpi134Workbook({
        rows,
        metadata,
        integrantes,
        idFicha,
      });

      return {
        buffer,
        filename: `Planeacion_Ficha_${idFicha}.xlsx`,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error exportando planeación Excel', { stack: error.stack });
      throwPlaneacionError(500, 'Error generando exportación Excel');
    }
  }
}

module.exports = new PlaneacionPedagogicaService();
