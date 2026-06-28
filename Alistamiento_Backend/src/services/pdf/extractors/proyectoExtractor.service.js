const logger = require('../../../config/logger');
const { norm } = require('../../../utils/pdfText');
const { loadPdfFromPath } = require('../pdfLoader');
const { reconstructTablesFromPage } = require('../tableReconstructor');

const TARGET_SECCION = 'INFORMACION BASICA DEL PROYECTO';
const TARGET_CODIGO_PROYECTO = 'CODIGO PROYECTO SOFIA';
const TARGET_CODIGO_PROGRAMA = 'CODIGO DEL PROGRAMA SOFIA';
const TARGET_CENTRO = 'CENTRO DE FORMACION';
const TARGET_REGIONAL = 'REGIONAL';
const TARGET_NOMBRE_PROYECTO = 'NOMBRE DEL PROYECTO';
const TARGET_PROGRAMA_FORMACION = 'PROGRAMA DE FORMACION AL QUE DA RESPUESTA';

const TARGET_PLANEACION = 'PLANEACION DEL PROYECTO';
const TARGET_FASES = 'FASES DEL PROYECTO';
const TARGET_ACTIVIDADES = 'ACTIVIDADES DEL PROYECTO';

const FASES_VALIDAS = ['ANALISIS', 'PLANEACION', 'EJECUCION', 'EVALUACION'];
const ORDEN_FASES = ['ANALISIS', 'PLANEACION', 'EJECUCION', 'EVALUACION'];

const FIN_SECCION_PLANEACION = [
  'RUBROS PRESUPUESTALES',
  'EQUIPO QUE PARTICIPO',
  'VALORACION PRODUCTIVA',
];

const FIN_SECCION_ACTIVIDADES = [
  'RUBROS PRESUPUESTALES',
  'EQUIPO QUE PARTICIPO',
];

const CODIGO_LARGO_RE = /^\d{5,}$/;
const RAP_CODIGO_RE = /\d{6,7}\s*-\s*(\d{1,2})\s+([A-ZÀÁÉÍÓÚÑ].+?)(?=\d{6,7}\s*-|\Z)/gs;

function joinFilaTexto(fila) {
  return fila
    .filter((celda) => celda)
    .map((celda) => String(celda).trim())
    .join(' ')
    .trim();
}

function filaVacia(fila) {
  return !fila || fila.every((celda) => celda === null || String(celda).trim() === '');
}

/**
 * Equivalente a proyecto_extractor.extraer_codigos_raps
 * @param {string} textoRaps
 * @returns {Array<[string, string]>}
 */
function extraerCodigosRaps(textoRaps) {
  const raps = [];
  const matches = [...String(textoRaps).matchAll(RAP_CODIGO_RE)];

  for (const match of matches) {
    const codigoRap = match[1].padStart(2, '0');
    const denominacion = match[2].trim().replace(/\s+/g, ' ').slice(0, 100);
    raps.push([codigoRap, denominacion]);
  }

  return raps;
}

/**
 * @param {string[][][]} tablasPorPagina
 */
function procesarTablasProyecto(tablasPorPagina) {
  const registros = [];
  let registroActual = {};
  let dentroSeccion = false;

  for (const tablas of tablasPorPagina) {
    for (const tabla of tablas) {
      for (const fila of tabla) {
        if (!fila || fila.length < 1) {
          continue;
        }

        const celdaIzq = norm(fila[0] || '');
        const textoCelda = joinFilaTexto(fila);
        const textoNorm = norm(textoCelda);

        if (textoNorm.includes(TARGET_SECCION)) {
          dentroSeccion = true;
          logger.debug('Sección información básica del proyecto detectada');
          continue;
        }

        if (!dentroSeccion) {
          continue;
        }

        if (
          textoNorm.includes(TARGET_CODIGO_PROYECTO)
          && textoNorm.includes(TARGET_CODIGO_PROGRAMA)
        ) {
          let valorProyecto = null;
          let valorPrograma = null;

          for (const celda of fila) {
            const texto = String(celda || '').trim();
            if (CODIGO_LARGO_RE.test(texto)) {
              if (!valorProyecto) {
                valorProyecto = texto;
              } else if (!valorPrograma) {
                valorPrograma = texto;
              }
            }

            if (valorProyecto) {
              registroActual.codigo_proyecto = valorProyecto;
              logger.debug('Código proyecto detectado', { codigo: valorProyecto });
            }

            if (valorPrograma) {
              registroActual.codigo_programa = valorPrograma;
              logger.debug('Código programa detectado', { codigo: valorPrograma });
            }
          }
          continue;
        }

        if (celdaIzq.includes(TARGET_CENTRO)) {
          registroActual.centro_formacion = fila.length > 1 ? (fila[1] || '').trim() : '';
          continue;
        }

        if (textoNorm.includes(TARGET_REGIONAL)) {
          registroActual.regional = fila.length > 3 ? (fila[3] || '').trim() : '';
          continue;
        }

        if (celdaIzq.includes(TARGET_NOMBRE_PROYECTO)) {
          registroActual.nombre_proyecto = fila.length > 1 ? (fila[1] || '').trim() : '';
          continue;
        }

        if (celdaIzq.includes(TARGET_PROGRAMA_FORMACION)) {
          registroActual.programa_formacion = fila.length > 1 ? (fila[1] || '').trim() : '';
        }
      }
    }
  }

  if (Object.keys(registroActual).length > 0) {
    registros.push(registroActual);
    logger.debug('Último registro de proyecto guardado', {
      nombre_proyecto: registroActual.nombre_proyecto || 'sin nombre',
    });
  }

  if (registros.length === 0) {
    logger.debug('Advertencia: no se extrajo ningún proyecto del PDF');
  } else {
    logger.debug('Total proyectos extraídos', { total: registros.length });
  }

  return registros;
}

/**
 * @param {string[][][]} tablasPorPagina
 */
function procesarTablasFases(tablasPorPagina) {
  const fasesEncontradas = new Set();
  let enSeccionPlaneacion = false;

  tablasPorPagina.forEach((tablas, pageIndex) => {
    for (const tabla of tablas) {
      for (const fila of tabla) {
        if (filaVacia(fila)) {
          continue;
        }

        const textoNorm = norm(joinFilaTexto(fila));

        if (textoNorm.includes(TARGET_PLANEACION) || textoNorm.includes(TARGET_FASES)) {
          enSeccionPlaneacion = true;
          logger.debug('Sección planeación del proyecto detectada', { pageNumber: pageIndex + 1 });
          continue;
        }

        if (!enSeccionPlaneacion) {
          continue;
        }

        if (FIN_SECCION_PLANEACION.some((marker) => textoNorm.includes(marker))) {
          enSeccionPlaneacion = false;
          logger.debug('Fin de sección planeación del proyecto', { pageNumber: pageIndex + 1 });
          break;
        }

        const primeraCelda = norm(fila[0] || '');
        for (const fase of FASES_VALIDAS) {
          if (primeraCelda.includes(fase)) {
            fasesEncontradas.add(fase);
            logger.debug('Fase encontrada', { fase });
            break;
          }
        }
      }
    }
  });

  const fasesResultado = ORDEN_FASES
    .filter((fase) => fasesEncontradas.has(fase))
    .map((fase) => ({ nombre: fase }));

  logger.debug('Total fases únicas extraídas', { total: fasesResultado.length });

  return fasesResultado;
}

/**
 * @param {string[][][]} tablasPorPagina
 */
function procesarTablasActividades(tablasPorPagina) {
  const actividades = [];
  let enSeccionPlaneacion = false;
  let faseActual = null;

  tablasPorPagina.forEach((tablas, pageIndex) => {
    for (const tabla of tablas) {
      for (const fila of tabla) {
        if (filaVacia(fila)) {
          continue;
        }

        const textoNorm = norm(joinFilaTexto(fila));

        if (textoNorm.includes(TARGET_PLANEACION) || textoNorm.includes(TARGET_ACTIVIDADES)) {
          enSeccionPlaneacion = true;
          logger.debug('Sección actividades del proyecto detectada', { pageNumber: pageIndex + 1 });
          continue;
        }

        if (!enSeccionPlaneacion) {
          continue;
        }

        if (FIN_SECCION_ACTIVIDADES.some((marker) => textoNorm.includes(marker))) {
          enSeccionPlaneacion = false;
          logger.debug('Fin de sección actividades', { pageNumber: pageIndex + 1 });
          break;
        }

        if (fila.length < 3) {
          continue;
        }

        const faseCelda = norm(fila[0] || '');
        const actividadCelda = (fila[1] || '').trim();
        const rapsCelda = (fila[2] || '').trim();

        if (FASES_VALIDAS.includes(faseCelda)) {
          faseActual = faseCelda;
          logger.debug('Fase detectada en actividades', { fase: faseActual });
        }

        if (actividadCelda && rapsCelda && faseActual) {
          const rapsInfo = extraerCodigosRaps(rapsCelda);
          if (rapsInfo.length > 0) {
            actividades.push({
              fase: faseActual,
              nombre_actividad: actividadCelda,
              raps: rapsInfo,
            });
            logger.debug('Actividad de proyecto detectada', {
              raps: rapsInfo.length,
            });
          }
        }
      }
    }
  });

  logger.debug('Total actividades extraídas', { total: actividades.length });

  return actividades;
}

async function loadTablasPorPagina(pdfPath) {
  const { pages } = await loadPdfFromPath(pdfPath);
  return pages.map((page) => reconstructTablesFromPage(page));
}

async function extraerProyecto(pdfPath) {
  const tablasPorPagina = await loadTablasPorPagina(pdfPath);
  return procesarTablasProyecto(tablasPorPagina);
}

async function extraerFasesProyecto(pdfPath) {
  const tablasPorPagina = await loadTablasPorPagina(pdfPath);
  return procesarTablasFases(tablasPorPagina);
}

async function extraerActividadesProyecto(pdfPath) {
  const tablasPorPagina = await loadTablasPorPagina(pdfPath);
  return procesarTablasActividades(tablasPorPagina);
}

module.exports = {
  extraerProyecto,
  extraerFasesProyecto,
  extraerActividadesProyecto,
  procesarTablasProyecto,
  procesarTablasFases,
  procesarTablasActividades,
  extraerCodigosRaps,
};
