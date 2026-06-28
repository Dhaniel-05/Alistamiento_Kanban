/**
 * Utilidades de búsqueda tolerante a tildes, mayúsculas y espacios extra.
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeSearchText(value) {
  if (value == null || value === '') {
    return '';
  }

  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {string} query
 * @returns {string[]}
 */
export function tokenizeSearchQuery(query) {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return [];
  }

  return normalized.split(' ').filter(Boolean);
}

/**
 * Cada palabra del query debe coincidir en al menos uno de los campos (AND entre tokens).
 * @param {string} query
 * @param {unknown[]} haystackValues
 * @returns {boolean}
 */
export function matchesSearchQuery(query, haystackValues) {
  const tokens = tokenizeSearchQuery(query);
  if (tokens.length === 0) {
    return true;
  }

  const haystack = haystackValues
    .filter((value) => value != null && value !== '')
    .map((value) => normalizeSearchText(value))
    .join(' ');

  if (!haystack) {
    return false;
  }

  return tokens.every((token) => haystack.includes(token));
}

/**
 * Campos buscables de un RAP en la sábana / bandeja.
 * @param {object} rap
 * @returns {unknown[]}
 */
export function getRapSearchFields(rap) {
  return [
    rap.descripcion_rap,
    rap.descripcion,
    rap.nombre,
    rap.nombre_rap,
    rap.codigo_rap,
    rap.codigo,
    rap.nombre_competencia,
    rap.competencia_nombre,
    rap.codigo_competencia,
    rap.competencia_codigo,
    rap.codigo_norma,
    rap.norma_codigo,
  ];
}
