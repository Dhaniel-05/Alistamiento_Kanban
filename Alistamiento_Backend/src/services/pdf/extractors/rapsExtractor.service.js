const logger = require('../../../config/logger');
const { norm } = require('../../../utils/pdfText');
const { loadPdfFromPath } = require('../pdfLoader');
const { reconstructTablesFromPage } = require('../tableReconstructor');

const TARGET_COMPETENCIA = 'UNIDAD DE COMPETENCIA';
const TARGET_CODIGO = 'CODIGO NORMA DE COMPETENCIA LABORAL';
const TARGET_NOMBRE = 'NOMBRE DE LA COMPETENCIA';
const TARGET_RESULTADOS = 'RESULTADOS DE APRENDIZAJE';
const TARGET_CONOCIMIENTOS_PROCESO = 'CONOCIMIENTOS DE PROCESO';
const TARGET_CRITERIOS_EVALUACION = 'CRITERIOS DE EVALUACION';
const TARGET_CONOCIMIENTOS_SABER = 'CONOCIMIENTOS DEL SABER';

const IGNORE_KEYS = [
  'LINEA TECNOLOGICA',
  'RED TECNOLOGICA',
  'RED DE CONOCIMIENTO',
  'DENOMINACION',
];

const FIN_SECCION_PATTERNS = [
  /PERFIL DEL INSTRUCTOR/,
  /REQUISITOS ACADEMICOS/,
  /4\.8\s+PERFIL/,
  /4\.8\.1/,
  /CONTENIDOS CURRICULARES DE LA COMPETENCIA/,
];

const RAP_NOISE_PATTERN = /^\s*4\.6\s*CONOCIMIENTOS/;

function esFinSeccion(texto) {
  const textoNorm = norm(texto);
  return FIN_SECCION_PATTERNS.some((pattern) => pattern.test(textoNorm));
}

function prepararRegistroParaGuardar(registro) {
  if (!registro || Object.keys(registro).length === 0) {
    return null;
  }

  const prepared = { ...registro };

  if (Array.isArray(prepared.resultados_aprendizaje)) {
    prepared.resultados_aprendizaje = prepared.resultados_aprendizaje.filter(
      (rap) => !RAP_NOISE_PATTERN.test(norm(rap)),
    );
  }

  ['conocimientos_proceso', 'conocimientos_saber', 'criterios_evaluacion'].forEach((field) => {
    if (Array.isArray(prepared[field])) {
      prepared[field] = prepared[field].join('\n');
    }
  });

  return prepared;
}

/**
 * Procesa tablas con la misma lógica que raps_extractor.py
 * @param {string[][][]} tablasPorPagina
 */
function procesarTablasRaps(tablasPorPagina) {
  const resultados = [];
  let registroActual = {};

  let capturandoResultados = false;
  let capturandoConocimientos = false;
  let capturandoCriterios = false;
  let capturandoSaber = false;

  const guardarRegistroActual = () => {
    const prepared = prepararRegistroParaGuardar(registroActual);
    if (prepared) {
      resultados.push(prepared);
      logger.debug('Competencia RAP guardada', {
        codigo_competencia: prepared.codigo_competencia,
      });
    }
    registroActual = {};
    capturandoResultados = false;
    capturandoConocimientos = false;
    capturandoCriterios = false;
    capturandoSaber = false;
  };

  tablasPorPagina.forEach((tablas, pageIndex) => {
    logger.debug('Procesando página para RAPs', { pageNumber: pageIndex + 1 });

    for (const tabla of tablas) {
      for (const fila of tabla) {
        if (!fila || !fila.some((celda) => celda)) {
          continue;
        }

        const filaTexto = fila
          .filter((celda) => celda)
          .map((celda) => String(celda).trim())
          .join(' ')
          .trim();
        const filaNorm = norm(filaTexto);
        const celdaIzq = norm(fila[0] || '');

        if (IGNORE_KEYS.some((key) => filaNorm.includes(key))) {
          continue;
        }

        if (celdaIzq.includes(TARGET_COMPETENCIA)) {
          guardarRegistroActual();
          registroActual = { competencia: (fila[1] || '').trim() };
          continue;
        }

        if (celdaIzq.includes(TARGET_CODIGO)) {
          const codigo = (fila[1] || '').trim();
          if (codigo && codigo !== '999999999') {
            registroActual.codigo_competencia = codigo;
            logger.debug('Código competencia detectado', { codigo });
          }
          continue;
        }

        if (celdaIzq.includes(TARGET_NOMBRE)) {
          registroActual.competencia = (fila[1] || '').trim();
          continue;
        }

        if (esFinSeccion(filaTexto)) {
          capturandoResultados = false;
          capturandoConocimientos = false;
          capturandoCriterios = false;
          capturandoSaber = false;
          continue;
        }

        if (celdaIzq.includes(TARGET_RESULTADOS)) {
          capturandoResultados = true;
          capturandoConocimientos = false;
          capturandoCriterios = false;
          capturandoSaber = false;
          registroActual.resultados_aprendizaje = [];
          logger.debug('Capturando resultados de aprendizaje');
          continue;
        }

        if (celdaIzq.includes(TARGET_CONOCIMIENTOS_PROCESO)) {
          capturandoConocimientos = true;
          capturandoResultados = false;
          capturandoCriterios = false;
          capturandoSaber = false;
          registroActual.conocimientos_proceso = [];
          logger.debug('Capturando conocimientos de proceso');
          continue;
        }

        if (celdaIzq.includes(TARGET_CRITERIOS_EVALUACION)) {
          capturandoCriterios = true;
          capturandoResultados = false;
          capturandoConocimientos = false;
          capturandoSaber = false;
          registroActual.criterios_evaluacion = [];
          logger.debug('Capturando criterios de evaluación');
          continue;
        }

        if (celdaIzq.includes(TARGET_CONOCIMIENTOS_SABER)) {
          capturandoSaber = true;
          capturandoResultados = false;
          capturandoConocimientos = false;
          capturandoCriterios = false;
          registroActual.conocimientos_saber = [];
          logger.debug('Capturando conocimientos del saber');
          continue;
        }

        if (capturandoResultados && filaTexto.trim()) {
          if (!registroActual.resultados_aprendizaje) {
            registroActual.resultados_aprendizaje = [];
          }
          registroActual.resultados_aprendizaje.push(filaTexto);
        } else if (capturandoConocimientos && filaTexto.trim()) {
          if (!registroActual.conocimientos_proceso) {
            registroActual.conocimientos_proceso = [];
          }
          registroActual.conocimientos_proceso.push(filaTexto);
        } else if (capturandoCriterios && filaTexto.trim()) {
          if (!registroActual.criterios_evaluacion) {
            registroActual.criterios_evaluacion = [];
          }
          registroActual.criterios_evaluacion.push(filaTexto);
        } else if (capturandoSaber && filaTexto.trim()) {
          if (!registroActual.conocimientos_saber) {
            registroActual.conocimientos_saber = [];
          }
          registroActual.conocimientos_saber.push(filaTexto);
        }
      }
    }
  });

  const prepared = prepararRegistroParaGuardar(registroActual);
  if (prepared && prepared.codigo_competencia) {
    resultados.push(prepared);
    logger.debug('Última competencia RAP guardada', {
      codigo_competencia: prepared.codigo_competencia,
    });
  }

  logger.debug('Total competencias RAP extraídas', { total: resultados.length });

  return resultados;
}

/**
 * Equivalente a Python/extractors/raps_extractor.extraer_raps
 * @param {string} pdfPath
 * @returns {Promise<Array<object>>}
 */
async function extraerRaps(pdfPath) {
  const { pages } = await loadPdfFromPath(pdfPath);
  const tablasPorPagina = pages.map((page) => reconstructTablesFromPage(page));
  return procesarTablasRaps(tablasPorPagina);
}

module.exports = {
  extraerRaps,
  procesarTablasRaps,
  esFinSeccion,
  TARGET_COMPETENCIA,
  TARGET_CODIGO,
  TARGET_NOMBRE,
  TARGET_RESULTADOS,
  TARGET_CONOCIMIENTOS_PROCESO,
  TARGET_CRITERIOS_EVALUACION,
  TARGET_CONOCIMIENTOS_SABER,
};
