const logger = require('../../../config/logger');
const { norm, extraerHoras } = require('../../../utils/pdfText');
const { loadPdfFromPath } = require('../pdfLoader');
const { reconstructTablesFromPage } = require('../tableReconstructor');

const TARGET_NOMBRE = 'DENOMINACION DEL PROGRAMA';
const TARGET_CODIGO = 'CODIGO PROGRAMA';
const TARGET_VERSION = 'VERSION PROGRAMA';
const TARGET_VIGENCIA = 'VIGENCIA DEL PROGRAMA';
const TARGET_DURACION = 'DURACION MAXIMA ESTIMADA DEL APRENDIZAJE (HORAS)';
const TARGET_LECTIVA = 'ETAPA LECTIVA';
const TARGET_PRODUCTIVA = 'ETAPA PRODUCTIVA';
const TARGET_TIPO = 'TIPO DE PROGRAMA';
const TARGET_TITULO = 'TITULO O CERTIFICADO QUE OBTENDRA';

/**
 * Procesa filas de tablas con la misma lógica que programa_extractor.py
 * @param {string[][][]} tablasPorPagina - tablas en orden de lectura del PDF
 * @returns {Array<{
 *   nombre_programa?: string,
 *   codigo_programa?: string,
 *   version_programa?: string,
 *   vigencia?: string,
 *   horas_totales?: string,
 *   horas_etapa_lectiva?: string,
 *   horas_etapa_productiva?: string,
 *   tipo?: string,
 *   titulo?: string
 * }>}
 */
function procesarTablasPrograma(tablasPorPagina) {
  const registros = [];
  let registroActual = {};
  let enBloqueDuracion = false;

  const guardarRegistroActual = () => {
    if (Object.keys(registroActual).length > 0) {
      registros.push(registroActual);
      logger.debug('Registro de programa guardado', {
        nombre_programa: registroActual.nombre_programa || 'sin nombre',
      });
      registroActual = {};
    }
  };

  for (const tablas of tablasPorPagina) {
    for (const tabla of tablas) {
      for (const fila of tabla) {
        if (!fila || fila.length < 1) {
          continue;
        }

        const celdaIzq = norm(fila[0] || '');
        const textoCelda = fila
          .filter((celda) => celda)
          .map((celda) => String(celda).trim())
          .join(' ')
          .trim();
        const textoNorm = norm(textoCelda);

        if (celdaIzq.includes(TARGET_NOMBRE)) {
          guardarRegistroActual();
          registroActual.nombre_programa = fila.length > 1 ? (fila[1] || '').trim() : '';
        } else if (celdaIzq.includes(TARGET_CODIGO)) {
          registroActual.codigo_programa = fila.length > 1 ? (fila[1] || '').trim() : '';
        } else if (celdaIzq.includes(TARGET_VERSION)) {
          registroActual.version_programa = fila.length > 1 ? (fila[1] || '').trim() : '';
        } else if (celdaIzq.includes(TARGET_VIGENCIA)) {
          registroActual.vigencia = fila.length > 1 ? (fila[1] || '').trim() : '';
        } else if (celdaIzq.includes(TARGET_DURACION)) {
          enBloqueDuracion = true;

          if (textoNorm.includes(TARGET_LECTIVA) && !registroActual.horas_etapa_lectiva) {
            const horas = extraerHoras(textoCelda);
            if (horas) {
              registroActual.horas_etapa_lectiva = horas;
              logger.debug('Etapa lectiva detectada', { horas });
            }
          }
        } else if (enBloqueDuracion) {
          if (textoNorm.includes(TARGET_PRODUCTIVA) && !registroActual.horas_etapa_productiva) {
            const horas = extraerHoras(textoCelda);
            if (horas) {
              registroActual.horas_etapa_productiva = horas;
              logger.debug('Etapa productiva detectada', { horas });
            }
          } else if (!registroActual.horas_totales) {
            const textoNormSimple = textoNorm.replace(/(.)\1+/g, '$1');
            if (textoNormSimple.includes('TOTAL')) {
              const horas = extraerHoras(textoCelda);
              if (horas) {
                registroActual.horas_totales = horas;
                logger.debug('Total de horas detectado', { horas });
                enBloqueDuracion = false;
              }
            }
          }
        } else if (celdaIzq.includes(TARGET_TIPO)) {
          registroActual.tipo = fila.length > 1 ? (fila[1] || '').trim() : '';
        } else if (celdaIzq.includes(TARGET_TITULO)) {
          registroActual.titulo = fila.length > 1 ? (fila[1] || '').trim() : '';
        }
      }
    }
  }

  if (Object.keys(registroActual).length > 0) {
    registros.push(registroActual);
    logger.debug('Último registro de programa guardado', {
      nombre_programa: registroActual.nombre_programa || 'sin nombre',
    });
  }

  return registros;
}

/**
 * Extrae datos del programa de formación desde un PDF SENA.
 * Equivalente a Python/extractors/programa_extractor.extraer_programa
 * @param {string} pdfPath - Ruta al archivo PDF
 * @returns {Promise<Array<object>>}
 */
async function extraerPrograma(pdfPath) {
  const { pages } = await loadPdfFromPath(pdfPath);

  const tablasPorPagina = pages.map((page) => reconstructTablesFromPage(page));

  return procesarTablasPrograma(tablasPorPagina);
}

module.exports = {
  extraerPrograma,
  procesarTablasPrograma,
  TARGET_NOMBRE,
  TARGET_CODIGO,
  TARGET_VERSION,
  TARGET_VIGENCIA,
  TARGET_DURACION,
  TARGET_LECTIVA,
  TARGET_PRODUCTIVA,
  TARGET_TIPO,
  TARGET_TITULO,
};
