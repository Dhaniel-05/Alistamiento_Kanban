/**
 * Utilidades de texto para extracción PDF.
 * Semántica portada de Python/utils/pdf_helpers.py
 */

function stripAccents(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function norm(value) {
  let text = stripAccents(value || '').toUpperCase();
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

function extraerHoras(texto) {
  if (!texto) {
    return '';
  }
  const match = texto.match(/(\d+)\s*horas?/i);
  if (match) {
    return `${match[1]} horas`;
  }
  return '';
}

/**
 * Extrae el entero de horas desde strings como "3120 horas"
 * @param {string|null|undefined} textoHoras
 * @returns {number|null}
 */
function extraerNumeroHoras(textoHoras) {
  if (!textoHoras) {
    return null;
  }
  const match = String(textoHoras).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function limpiarItem(texto) {
  let cleaned = (texto || '').trim();
  cleaned = cleaned.replace(/^[*•\-\d.\s]+/, '');
  return cleaned.trim();
}

function esRuido(texto) {
  const textoNorm = norm(texto);

  const ruidoPatterns = [
    /LINEA TECNOLOGICA/,
    /RED TECNOLOGICA/,
    /RED DE CONOCIMIENTO/,
    /GESTION DE LA INFORMACION/,
    /TECNOLOGIAS DE LA INFORMACION/,
    /DISENO Y DESARROLLO/,
    /^\d+\/\d+\/\d+\s+\d+:\d+/,
    /^PAGINA\s+\d+/,
    /INFORMACION Y LAS COMUNICACIONES/,
    /^SOFTWARE$/,
    /^DENOMINACION$/,
  ];

  for (const pattern of ruidoPatterns) {
    if (pattern.test(textoNorm)) {
      return true;
    }
  }

  if (texto.trim().length < 10 && !/[a-zA-Z]{5,}/.test(texto)) {
    return true;
  }

  return false;
}

function esContenidoValido(texto) {
  if (!texto || texto.trim().length < 15) {
    return false;
  }

  if (esRuido(texto)) {
    return false;
  }

  if (!/[a-zA-ZÁÉÍÓÚáéíóúÑñ]{4,}/.test(texto)) {
    return false;
  }

  return true;
}

module.exports = {
  stripAccents,
  norm,
  extraerHoras,
  extraerNumeroHoras,
  limpiarItem,
  esRuido,
  esContenidoValido,
};
