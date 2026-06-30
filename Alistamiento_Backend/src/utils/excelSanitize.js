/**
 * Evita inyección de fórmulas en celdas Excel (= + - @).
 * @param {unknown} value
 * @returns {string|number}
 */
function sanitizeExcelCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const text = String(value);
  if (/^[=+\-@]/.test(text)) {
    return `'${text}`;
  }

  return text;
}

module.exports = { sanitizeExcelCell };
