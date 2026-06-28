const path = require('path');
const db = require('../config/conexion_db');
const logger = require('../config/logger');
const pdfExtractionService = require('../services/pdf/pdfExtraction.service');
const pdfImportService = require('../services/pdfImport.service');
const AppError = require('../utils/AppError');
const { removeFileSafe } = require('../utils/fileSystem');

class PdfController {
  async procesarPdf(req, res, next) {
    const connection = await db.getConnection();
    const pdfPath = req.file?.path;

    try {
      if (!req.file) {
        throw new AppError('No se subió ningún archivo PDF', 400, true, 'PDF_MISSING');
      }

      const tipo = req.body.tipo || 'todo';

      logger.info('Procesando PDF de programa', { tipo });

      const extraction = await pdfExtractionService.procesarData(pdfPath, tipo);

      logger.debug('Extracción PDF completada', {
        programas: extraction.programa?.length || 0,
        competencias: extraction.competencias?.length || 0,
        unidadRaps: extraction.unidadRaps?.length || 0,
      });

      await connection.beginTransaction();

      const importResult = await pdfImportService.importProgramacion(
        connection,
        extraction,
      );

      await connection.commit();
      removeFileSafe(pdfPath);

      return res.json({
        mensaje: 'PDF procesado exitosamente',
        data: importResult,
      });
    } catch (error) {
      await connection.rollback();
      removeFileSafe(pdfPath);
      return next(error);
    } finally {
      connection.release();
    }
  }

  async procesarProyecto(req, res, next) {
    const connection = await db.getConnection();
    let pdfPath = null;

    try {
      if (!req.file) {
        throw new AppError('No se envió archivo', 400, true, 'PDF_MISSING');
      }

      pdfPath = path.resolve(req.file.path);
      logger.info('Procesando PDF de proyecto');

      const [resultadoProyecto, resultadoFases, resultadoActividades] = await Promise.all([
        pdfExtractionService.procesarData(pdfPath, 'proyecto'),
        pdfExtractionService.procesarData(pdfPath, 'fases'),
        pdfExtractionService.procesarData(pdfPath, 'actividades'),
      ]);

      removeFileSafe(pdfPath);
      pdfPath = null;

      await pdfImportService.importProyecto(connection, {
        proyecto: resultadoProyecto.proyecto,
        fases: resultadoFases.fases,
        actividades: resultadoActividades.actividades,
      });

      return res.status(200).json(resultadoProyecto);
    } catch (error) {
      removeFileSafe(pdfPath);
      return next(error);
    } finally {
      connection.release();
    }
  }
}

module.exports = PdfController;
