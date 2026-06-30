import httpClient from './httpClient';

const PERMISOS_PATH = '/permisos';

function extractError(res, fallback) {
  return res.data?.error || res.data?.mensaje || fallback;
}

export const leerPermisos = async () => {
  const res = await httpClient.get(PERMISOS_PATH, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error(extractError(res, 'Error al obtener permisos'));
  return res.data;
};

export const crearPermiso = async (permiso) => {
  const res = await httpClient.post(PERMISOS_PATH, permiso, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error(extractError(res, 'Error al crear permiso'));
  return res.data;
};

export const actualizarPermiso = async (id, data) => {
  const res = await httpClient.put(`${PERMISOS_PATH}/${id}`, data, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error(extractError(res, 'Error al actualizar permiso'));
  return res.data;
};

export const eliminarPermiso = async (id) => {
  const res = await httpClient.delete(`${PERMISOS_PATH}/${id}`, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error(extractError(res, 'Error al eliminar permiso'));
  return res.data;
};
