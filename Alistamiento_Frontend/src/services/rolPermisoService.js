import httpClient from './httpClient';

const ROL_PERMISO_PATH = '/rol-permiso';

export const leerRolPermisos = async () => {
  const res = await httpClient.get(ROL_PERMISO_PATH, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error('Error al obtener rol-permisos');
  return res.data;
};

export const leerPermisosDeRol = async (idRol) => {
  const res = await httpClient.get(`${ROL_PERMISO_PATH}/rol/${idRol}`, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error('Error al obtener permisos del rol');
  return res.data;
};

export const leerRolPermisoPorId = async (id) => {
  const res = await httpClient.get(`${ROL_PERMISO_PATH}/${id}`, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error('Error al obtener rol-permiso');
  return res.data;
};

export const crearRolPermiso = async (id_rol, permiso_id) => {
  const res = await httpClient.post(
    ROL_PERMISO_PATH,
    { id_rol, permiso_id },
    { validateStatus: () => true },
  );
  if (res.status < 200 || res.status >= 300) throw new Error('Error al asignar permiso a rol');
  return res.data;
};

export const actualizarRolPermiso = async (id, { id_rol, permiso_id }) => {
  const res = await httpClient.put(
    `${ROL_PERMISO_PATH}/${id}`,
    { id_rol, permiso_id },
    { validateStatus: () => true },
  );
  if (res.status < 200 || res.status >= 300) throw new Error('Error al actualizar rol-permiso');
  return res.data;
};

export const eliminarRolPermiso = async (id) => {
  const res = await httpClient.delete(`${ROL_PERMISO_PATH}/${id}`, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error('Error al eliminar rol-permiso');
  return res.data;
};
