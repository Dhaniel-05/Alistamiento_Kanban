const db = require('../config/conexion_db');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const planeacionRepository = require('../repositories/planeacion.repository');
const { buildGfpi134Workbook } = require('./planeacionExcel.service');

const PEDAGOGIC_CONTENT_FIELDS = [
  'actividades_aprendizaje',
  'descripcion_evidencia',
  'materiales_formacion',
  'saberes_conceptos',
  'saberes_proceso',
  'criterios_evaluacion',
  'estrategias_didacticas',
  'ambientes_aprendizaje',
  'observaciones',
];

function pairKey(idRap, idTrimestre) {
  return `${idRap}-${idTrimestre}`;
}

function detalleTieneContenidoPedagogico(detalle) {
  for (const field of PEDAGOGIC_CONTENT_FIELDS) {
    const value = detalle[field];
    if (value != null && String(value).trim() !== '') {
      return true;
    }
  }
  const directa = Number(detalle.duracion_directa) || 0;
  const independiente = Number(detalle.duracion_independiente) || 0;
  return directa > 0 || independiente > 0;
}

function crearReporteVacio() {
  return {
    sincronizados: 0,
    movidos: 0,
    nuevos: 0,
    reactivados: 0,
    archivados: 0,
    archivados_con_contenido: 0,
    ids_nuevos: [],
    ids_reactivados: [],
    reactivados_duplicados: [],
    movidos_split: [],
  };
}

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

  async reconciliarConSabana(idFicha, connection) {
    const reporte = crearReporteVacio();

    const sabanaRows = await planeacionRepository.findSabanaPairsByFicha(idFicha, connection);
    let detallesActivos = await planeacionRepository.findDetallesActivosByFicha(
      idFicha,
      connection,
    );

    const sabanaByKey = new Map();
    const sabanaByRap = new Map();

    for (const row of sabanaRows) {
      sabanaByKey.set(pairKey(row.id_rap, row.id_trimestre), row);
      if (!sabanaByRap.has(row.id_rap)) {
        sabanaByRap.set(row.id_rap, []);
      }
      sabanaByRap.get(row.id_rap).push(row);
    }

    for (const rows of sabanaByRap.values()) {
      rows.sort((a, b) => a.no_trimestre - b.no_trimestre);
    }

    const buildDetalleIndex = () => {
      const byKey = new Map();
      const byRap = new Map();

      for (const detalle of detallesActivos) {
        byKey.set(pairKey(detalle.id_rap, detalle.id_trimestre), detalle);
        if (!byRap.has(detalle.id_rap)) {
          byRap.set(detalle.id_rap, []);
        }
        byRap.get(detalle.id_rap).push(detalle);
      }

      return { byKey, byRap };
    };

    const rapIdsConDetalle = new Set(detallesActivos.map((d) => d.id_rap));

    for (const idRap of rapIdsConDetalle) {
      const { byKey } = buildDetalleIndex();
      const detallesRap = detallesActivos.filter((d) => d.id_rap === idRap);
      const sabanaRap = sabanaByRap.get(idRap) ?? [];

      const misplaced = detallesRap.filter(
        (d) => !sabanaByKey.has(pairKey(idRap, d.id_trimestre)),
      );

      const missingSabanaTrimestres = sabanaRap.filter(
        (s) => !byKey.has(pairKey(idRap, s.id_trimestre)),
      );

      if (misplaced.length === 0 || missingSabanaTrimestres.length === 0) {
        continue;
      }

      const detalleAMover = [...misplaced].sort((a, b) => {
        const aContent = detalleTieneContenidoPedagogico(a) ? 1 : 0;
        const bContent = detalleTieneContenidoPedagogico(b) ? 1 : 0;
        return bContent - aContent;
      })[0];

      const targets = [...missingSabanaTrimestres].sort(
        (a, b) => a.no_trimestre - b.no_trimestre,
      );
      const primaryTarget = targets[0];
      const idPlaneacionDestino = await planeacionRepository.findOrCreatePlaneacion(
        connection,
        idFicha,
        primaryTarget.id_trimestre,
        primaryTarget.no_trimestre,
      );

      await planeacionRepository.moveDetalleToPlaneacion(
        connection,
        detalleAMover.id_detalle,
        idPlaneacionDestino,
      );
      await planeacionRepository.updateDetalleHorasDesdeSabana(
        connection,
        detalleAMover.id_detalle,
        primaryTarget.horas_trimestre,
      );

      reporte.movidos += 1;

      if (targets.length > 1) {
        const splitInfo = {
          id_rap: idRap,
          id_detalle_con_contenido: detalleAMover.id_detalle,
          trimestre_con_contenido: primaryTarget.no_trimestre,
          trimestres_vacios: [],
        };

        for (let i = 1; i < targets.length; i += 1) {
          const target = targets[i];
          const idPlaneacionExtra = await planeacionRepository.findOrCreatePlaneacion(
            connection,
            idFicha,
            target.id_trimestre,
            target.no_trimestre,
          );
          const nuevoId = await planeacionRepository.insertDetalleVacioDesdeSabana(
            connection,
            idPlaneacionExtra,
            target,
          );
          reporte.nuevos += 1;
          reporte.ids_nuevos.push(nuevoId);
          splitInfo.trimestres_vacios.push(target.no_trimestre);
        }

        reporte.movidos_split.push(splitInfo);
      }

      detallesActivos = await planeacionRepository.findDetallesActivosByFicha(
        idFicha,
        connection,
      );
    }

    const { byKey: detalleByKeyFinal } = buildDetalleIndex();

    for (const sabanaRow of sabanaRows) {
      const key = pairKey(sabanaRow.id_rap, sabanaRow.id_trimestre);
      const detalle = detalleByKeyFinal.get(key);

      if (detalle) {
        const horasActuales = Number(detalle.horas_trimestre);
        const horasSabana = Number(sabanaRow.horas_trimestre);
        if (horasActuales !== horasSabana) {
          await planeacionRepository.updateDetalleHorasDesdeSabana(
            connection,
            detalle.id_detalle,
            sabanaRow.horas_trimestre,
          );
          reporte.sincronizados += 1;
        }
      }
    }

    detallesActivos = await planeacionRepository.findDetallesActivosByFicha(
      idFicha,
      connection,
    );
    const { byKey: detalleByKeyPostSync } = buildDetalleIndex();

    for (const sabanaRow of sabanaRows) {
      const key = pairKey(sabanaRow.id_rap, sabanaRow.id_trimestre);
      if (detalleByKeyPostSync.has(key)) {
        continue;
      }

      const idPlaneacion = await planeacionRepository.findOrCreatePlaneacion(
        connection,
        idFicha,
        sabanaRow.id_trimestre,
        sabanaRow.no_trimestre,
      );

      const archivados = await planeacionRepository.findArchivadosByRapAndTrimestre(
        connection,
        idFicha,
        sabanaRow.id_rap,
        sabanaRow.id_trimestre,
      );

      if (archivados.length > 0) {
        const detalleAReactivar = archivados[0];
        const reactivado = await planeacionRepository.reactivateDetalle(
          connection,
          detalleAReactivar.id_detalle,
          idPlaneacion,
          sabanaRow.horas_trimestre,
        );

        if (reactivado > 0) {
          reporte.reactivados += 1;
          reporte.ids_reactivados.push(detalleAReactivar.id_detalle);
          detalleByKeyPostSync.set(key, { id_detalle: detalleAReactivar.id_detalle });

          if (archivados.length > 1) {
            reporte.reactivados_duplicados.push({
              id_rap: sabanaRow.id_rap,
              id_trimestre: sabanaRow.id_trimestre,
              id_detalle_reactivado: detalleAReactivar.id_detalle,
              ids_detalle_omitidos: archivados.slice(1).map((row) => row.id_detalle),
            });
          }

          continue;
        }
      }

      const nuevoId = await planeacionRepository.insertDetalleVacioDesdeSabana(
        connection,
        idPlaneacion,
        sabanaRow,
      );
      reporte.nuevos += 1;
      reporte.ids_nuevos.push(nuevoId);
      detalleByKeyPostSync.set(key, { id_detalle: nuevoId });
    }

    detallesActivos = await planeacionRepository.findDetallesActivosByFicha(
      idFicha,
      connection,
    );
    const rapsEnSabana = new Set(sabanaRows.map((r) => r.id_rap));

    for (const detalle of detallesActivos) {
      const key = pairKey(detalle.id_rap, detalle.id_trimestre);
      const enSabanaEnEsteTrimestre = sabanaByKey.has(key);
      const rapEnAlgunaSabana = rapsEnSabana.has(detalle.id_rap);

      if (enSabanaEnEsteTrimestre) {
        continue;
      }

      if (rapEnAlgunaSabana) {
        const archived = await planeacionRepository.archiveDetalle(
          connection,
          detalle.id_detalle,
        );
        if (archived > 0) {
          reporte.archivados += 1;
          if (detalleTieneContenidoPedagogico(detalle)) {
            reporte.archivados_con_contenido += 1;
          }
        }
        continue;
      }

      const archived = await planeacionRepository.archiveDetalle(
        connection,
        detalle.id_detalle,
      );
      if (archived > 0) {
        reporte.archivados += 1;
        if (detalleTieneContenidoPedagogico(detalle)) {
          reporte.archivados_con_contenido += 1;
        }
      }
    }

    return reporte;
  }

  _marcarDetallesNuevos(detalles, idsNuevos) {
    const idsSet = new Set(idsNuevos);
    return detalles.map((detalle) => ({
      ...detalle,
      nuevo_desde_sabana: idsSet.has(detalle.id_detalle),
    }));
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

      const { planeaciones, reconciliacion } = await withTransaction(async (connection) => {
        await this._assertAccesoFicha(user, idFicha, connection);
        const reporte = await this.reconciliarConSabana(idFicha, connection);
        const rows = await planeacionRepository.findPlaneacionesByFicha(idFicha, connection);
        return { planeaciones: rows, reconciliacion: reporte };
      });

      return {
        success: true,
        data: planeaciones,
        reconciliacion,
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

      const { detalles, reconciliacion } = await withTransaction(async (connection) => {
        await this._assertAccesoFicha(user, planeacion.id_ficha, connection);
        const reporte = await this.reconciliarConSabana(planeacion.id_ficha, connection);
        const rows = await planeacionRepository.findDetallesByPlaneacion(idPlaneacion, connection);
        return {
          detalles: this._marcarDetallesNuevos(rows, reporte.ids_nuevos),
          reconciliacion: reporte,
        };
      });

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
        reconciliacion,
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
