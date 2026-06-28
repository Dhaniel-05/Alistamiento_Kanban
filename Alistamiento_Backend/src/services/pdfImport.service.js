const logger = require('../config/logger');
const pdfImportRepository = require('../repositories/pdfImport.repository');
const RapParser = require('./pdf/rapParser');

class PdfImportService {
  /**
   * Persiste programa, competencias y RAPs dentro de una transacción existente.
   * @param {import('mysql2/promise').PoolConnection} connection
   * @param {object} extractedData
   */
  async importProgramacion(connection, extractedData) {
    let idPrograma = null;
    const idsCompetencias = [];
    const idsRaps = [];

    if (extractedData.programa?.length > 0) {
      idPrograma = await pdfImportRepository.insertPrograma(
        connection,
        extractedData.programa[0],
      );
      logger.info('Programa guardado', { id_programa: idPrograma });
    }

    if (extractedData.competencias?.length > 0) {
      for (const competencia of extractedData.competencias) {
        const idCompetencia = await pdfImportRepository.insertCompetencia(
          connection,
          competencia,
          idPrograma,
        );
        idsCompetencias.push(idCompetencia);
      }
      logger.info('Competencias guardadas', { total: idsCompetencias.length });
    }

    if (extractedData.unidadRaps?.length > 0) {
      logger.info('Procesando RAPs por competencia', {
        competencias: extractedData.unidadRaps.length,
      });

      for (const infoRap of extractedData.unidadRaps) {
        const codigoCompetencia = infoRap.codigo_competencia;
        const rapsEstructurados = RapParser.procesarCompetencia(infoRap);

        if (rapsEstructurados.length === 0) {
          logger.warn('Competencia sin RAPs, saltando', { codigo_competencia: codigoCompetencia });
          continue;
        }

        const competenciaRow = await pdfImportRepository.findCompetenciaByCodigo(
          connection,
          codigoCompetencia,
        );

        if (!competenciaRow) {
          logger.warn('Competencia no encontrada en BD', { codigo_competencia: codigoCompetencia });
          continue;
        }

        const { id_competencia: idCompetencia, duracion_maxima: duracionMaxima } = competenciaRow;
        const numRaps = rapsEstructurados.length;
        const duracionPorRap = duracionMaxima ? Math.round(duracionMaxima / numRaps) : null;

        logger.debug('Distribuyendo horas por RAP', {
          codigo_competencia: codigoCompetencia,
          num_raps: numRaps,
          duracion_maxima: duracionMaxima,
          duracion_por_rap: duracionPorRap,
        });

        for (const rap of rapsEstructurados) {
          const idRap = await pdfImportRepository.insertRap(connection, {
            idCompetencia,
            codigo: rap.codigo,
            denominacion: rap.denominacion,
            duracion: duracionPorRap,
          });
          idsRaps.push(idRap);

          logger.debug('RAP insertado', {
            codigo_competencia: codigoCompetencia,
            codigo_rap: rap.codigo,
            conocimientos_proceso: rap.conocimientos_proceso.length,
            conocimientos_saber: rap.conocimientos_saber.length,
            criterios: rap.criterios_evaluacion.length,
          });

          if (rap.conocimientos_proceso?.trim()) {
            await pdfImportRepository.insertConocimientoProceso(
              connection,
              idRap,
              rap.conocimientos_proceso,
            );
          }

          if (rap.conocimientos_saber?.trim()) {
            await pdfImportRepository.insertConocimientoSaber(
              connection,
              idRap,
              rap.conocimientos_saber,
            );
          }

          if (rap.criterios_evaluacion?.trim()) {
            await pdfImportRepository.insertCriterioEvaluacion(
              connection,
              idRap,
              rap.criterios_evaluacion,
            );
          }
        }
      }

      logger.info('RAPs guardados con conocimientos y criterios', { total: idsRaps.length });
    }

    return {
      id_programa: idPrograma,
      ids_competencias: idsCompetencias,
      ids_raps: idsRaps,
      resumen: {
        programas: extractedData.programa?.length || 0,
        competencias: extractedData.competencias?.length || 0,
        resultados_aprendizaje: extractedData.unidadRaps?.length || 0,
      },
    };
  }

  /**
   * Persiste proyecto, fases y actividades.
   * @param {import('mysql2/promise').PoolConnection} connection
   * @param {{ proyecto?: object[], fases?: object[], actividades?: object[] }} extractedData
   */
  async importProyecto(connection, extractedData) {
    let idProyecto = null;

    if (extractedData.proyecto?.length > 0) {
      const proy = extractedData.proyecto[0];
      const idPrograma = proy.codigo_programa
        ? await pdfImportRepository.findProgramaIdByCodigo(connection, proy.codigo_programa)
        : null;

      idProyecto = await pdfImportRepository.insertProyecto(connection, proy, idPrograma);
      logger.info('Proyecto guardado', { id_proyecto: idProyecto });

      if (extractedData.fases?.length > 0) {
        for (const fase of extractedData.fases) {
          await pdfImportRepository.insertFase(connection, fase.nombre);
        }
        logger.info('Fases guardadas', { total: extractedData.fases.length });
      }
    }

    let actividadesGuardadas = 0;
    let relacionesGuardadas = 0;

    if (extractedData.actividades?.length > 0) {
      for (const actividad of extractedData.actividades) {
        const idActividad = await pdfImportRepository.insertActividad(
          connection,
          actividad.fase,
          actividad.nombre_actividad,
        );
        actividadesGuardadas += 1;

        for (const [codigoRap, denominacion] of actividad.raps) {
          const rapRow = await pdfImportRepository.findRapByCodigoAndDenominacion(
            connection,
            codigoRap,
            denominacion,
          );

          if (rapRow) {
            await pdfImportRepository.insertActividadRap(
              connection,
              idActividad,
              rapRow.id_rap,
            );
            relacionesGuardadas += 1;
            logger.debug('Relación actividad-RAP guardada', {
              id_actividad: idActividad,
              codigo_rap: codigoRap,
            });
          } else {
            logger.warn('RAP no encontrado para actividad', { codigo_rap: codigoRap });
          }
        }
      }

      logger.info('Actividades y relaciones guardadas', {
        actividades: actividadesGuardadas,
        relaciones: relacionesGuardadas,
      });
    }

    return {
      id_proyecto: idProyecto,
      actividades_guardadas: actividadesGuardadas,
      relaciones_guardadas: relacionesGuardadas,
    };
  }
}

module.exports = new PdfImportService();
