/**
 * Límites de tamaño para parsers de body (express.json / urlencoded).
 *
 * PLANEACIONES_LIMIT — Planeaciones pedagógicas incluyen muchos RAPs, textos largos
 *   y metadatos de sábana en un solo JSON; requieren un techo mayor que el resto.
 *
 * DEFAULT_LIMIT — Resto de endpoints: superficie de ataque reducida frente a payloads
 *   enormes (DoS por memoria). Cualquier ruta que no sea /api/planeaciones usa este tope.
 */
const PLANEACIONES_LIMIT = '20mb';
const DEFAULT_LIMIT = '1mb';

const PLANEACIONES_PATH_PREFIX = '/api/planeaciones';

/**
 * @param {import('express').Request} req
 * @returns {boolean}
 */
function isPlaneacionesApiPath(req) {
  const pathname = (req.originalUrl || req.url || '').split('?')[0];
  return pathname === PLANEACIONES_PATH_PREFIX
    || pathname.startsWith(`${PLANEACIONES_PATH_PREFIX}/`);
}

module.exports = {
  PLANEACIONES_LIMIT,
  DEFAULT_LIMIT,
  PLANEACIONES_PATH_PREFIX,
  isPlaneacionesApiPath,
};
