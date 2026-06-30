const esAdministrador = (user) => user?.rol === 'Administrador';

/**
 * Verifica un permiso puntual. Administrador siempre autorizado (super-usuario).
 */
export function tienePermiso(user, permiso) {
  if (!user || !permiso) return false;
  if (esAdministrador(user)) return true;
  return Array.isArray(user.permisos) && user.permisos.includes(permiso) === true;
}

/**
 * Verifica si el usuario tiene al menos uno de los permisos indicados.
 */
export function tieneAlguno(user, permisos) {
  if (!user || !Array.isArray(permisos) || permisos.length === 0) return false;
  if (esAdministrador(user)) return true;
  return permisos.some((permiso) => tienePermiso(user, permiso));
}

export function puedeEditarFicha(user) {
  return tienePermiso(user, 'ficha.editar');
}
