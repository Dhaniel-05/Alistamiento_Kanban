const logger = require('../../../config/logger');
const { norm } = require('../../../utils/pdfText');
const { loadPdfFromPath } = require('../pdfLoader');
const { reconstructTablesFromPage } = require('../tableReconstructor');

const TARGET_COMPETENCIA = 'UNIDAD DE COMPETENCIA';
const TARGET_CODIGO = 'CODIGO NORMA DE COMPETENCIA LABORAL';
const TARGET_NOMBRE = 'NOMBRE DE LA COMPETENCIA';
const TARGET_HORA = 'DURACION MAXIMA ESTIMADA';

const HORA_RE = /\b(\d{1,4})\s*(HORA|HORAS)\b/i;

/**
 * Une celdas sin espacio, igual que competencias_extractor.py
 * @param {Array<string|null|undefined>} fila
 * @returns {string}
 */
function joinFilaTexto(fila) {
  return fila
    .filter((celda) => celda)
    .map((celda) => String(celda))
    .join('')
    .trim();
}

/**
 * Procesa filas de tablas con la misma lógica que competencias_extractor.py
 * @param {string[][][]} tablasPorPagina - tablas en orden de lectura del PDF
 * @returns {Array<{
 *   unidad_competencia?: string,
 *   codigo_norma?: string,
 *   nombre_competencia?: string,
 *   duracion_maxima?: string
 * }>}
 */
function procesarTablasCompetencias(tablasPorPagina) {
  const registros = [];
  let registroActual = {};
  let dentroDeEtapaPractica = false;

  const guardarRegistroActual = () => {
    if (Object.keys(registroActual).length > 0) {
      registros.push(registroActual);
      logger.debug('Competencia guardada', {
        nombre_competencia: registroActual.nombre_competencia || 'sin nombre',
      });
      registroActual = {};
    }
  };

  tablasPorPagina.forEach((tablas, pageIndex) => {
    const pageNumber = pageIndex + 1;

    for (const tabla of tablas) {
      for (const fila of tabla) {
        if (!fila || fila.length < 2) {
          continue;
        }

        const celdaIzq = norm(fila[0] || '');
        const textoFila = joinFilaTexto(fila);
        const textoNorm = norm(textoFila);

        if (textoNorm.includes('ETAPA PRACTICA') || textoFila.includes('999999999')) {
          dentroDeEtapaPractica = true;
          guardarRegistroActual();
          continue;
        }

        if (dentroDeEtapaPractica) {
          if (celdaIzq.includes(TARGET_CODIGO) && !textoFila.includes('999999999')) {
            dentroDeEtapaPractica = false;
          } else {
            continue;
          }
        }

        if (celdaIzq.includes(TARGET_COMPETENCIA)) {
          guardarRegistroActual();
          registroActual.unidad_competencia = norm(fila[1] || '');
        } else if (celdaIzq.includes(TARGET_CODIGO)) {
          registroActual.codigo_norma = (fila[1] || '').trim();
        } else if (celdaIzq.includes(TARGET_NOMBRE)) {
          registroActual.nombre_competencia = norm(fila[1] || '');
        } else if (celdaIzq.includes(TARGET_HORA)) {
          for (const celda of fila) {
            if (celda && HORA_RE.test(String(celda))) {
              if (Object.keys(registroActual).length === 0) {
                logger.debug('Ignorando hora fuera de competencia', {
                  pageNumber,
                  celda: String(celda).trim(),
                });
                continue;
              }
              registroActual.duracion_maxima = String(celda).trim();
              break;
            }
          }
        }
      }
    }
  });

  if (Object.keys(registroActual).length > 0) {
    registros.push(registroActual);
    logger.debug('Última competencia guardada', {
      nombre_competencia: registroActual.nombre_competencia || 'sin nombre',
    });
  }

  return registros;
}

/**
 * Extrae competencias desde un PDF SENA.
 * Equivalente a Python/extractors/competencias_extractor.extraer_competencias
 * @param {string} pdfPath - Ruta al archivo PDF
 * @returns {Promise<Array<object>>}
 */
async function extraerCompetencias(pdfPath) {
  const { pages } = await loadPdfFromPath(pdfPath);

  const tablasPorPagina = pages.map((page) => reconstructTablesFromPage(page));

  return procesarTablasCompetencias(tablasPorPagina);
}

module.exports = {
  extraerCompetencias,
  procesarTablasCompetencias,
  joinFilaTexto,
  TARGET_COMPETENCIA,
  TARGET_CODIGO,
  TARGET_NOMBRE,
  TARGET_HORA,
  HORA_RE,
};
