/**
 * Deriva 2 iniciales a partir del nombre completo del instructor.
 * Regla: 1ª letra del primer token + 1ª del segundo; si solo hay un token, sus 2 primeras letras.
 */
export function obtenerSiglas(nombre) {
  if (!nombre || typeof nombre !== 'string') {
    return '';
  }

  const partes = nombre.trim().split(/\s+/).filter(Boolean);

  if (partes.length === 0) {
    return '';
  }

  if (partes.length === 1) {
    return partes[0].substring(0, 2).toUpperCase();
  }

  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}
