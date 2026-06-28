const AppError = require('../../utils/AppError');
const { runPythonExtraction } = require('../pythonService');

const TIPOS_PROGRAMA = ['programa', 'competencias', 'raps', 'proyecto', 'fases', 'actividades', 'todo'];

/**
 * Fachada de extracción PDF: delega en Python/pdfplumber vía pythonService.
 * Réplica del contrato { success, data } de Python/main.py.
 */
class PdfExtractionService {
  /**
   * @param {string} pdfPath
   * @param {string} [tipo='todo']
   * @returns {Promise<{ success: boolean, data?: object, error?: string, code?: string }>}
   */
  async procesar(pdfPath, tipo = 'todo') {
    try {
      const response = await runPythonExtraction(pdfPath, tipo);
      return { success: true, data: response.data };
    } catch (error) {
      if (error instanceof AppError) {
        return {
          success: false,
          error: error.message,
          code: error.code,
        };
      }

      return {
        success: false,
        error: error.message || 'Error extrayendo PDF',
      };
    }
  }

  /**
   * Devuelve solo data o lanza AppError (flujo de importación y controlador).
   * @param {string} pdfPath
   * @param {string} tipo
   */
  async procesarData(pdfPath, tipo = 'todo') {
    const response = await runPythonExtraction(pdfPath, tipo);
    return response.data;
  }

  static get tiposValidos() {
    return TIPOS_PROGRAMA;
  }
}

module.exports = new PdfExtractionService();
