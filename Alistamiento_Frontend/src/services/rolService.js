import httpClient from './httpClient';

const ROLES_PATH = '/roles';

export const leerRoles = async () => {
  const res = await httpClient.get(ROLES_PATH, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error('Error al obtener roles');
  return res.data;
};

export const crearRol = async (rol) => {
  const res = await httpClient.post(ROLES_PATH, rol, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error('Error al crear rol');
  return res.data;
};

export const actualizarRol = async (id, data) => {
  const res = await httpClient.put(`${ROLES_PATH}/${id}`, data, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error('Error al actualizar rol');
  return res.data;
};

export const eliminarRol = async (id) => {
  const res = await httpClient.delete(`${ROLES_PATH}/${id}`, { validateStatus: () => true });
  if (res.status < 200 || res.status >= 300) throw new Error('Error al eliminar rol');
  return res.data;
};
