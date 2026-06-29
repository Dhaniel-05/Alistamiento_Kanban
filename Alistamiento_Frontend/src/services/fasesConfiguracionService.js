import httpClient from './httpClient';

const BASE_PATH = '/fases-configuracion';
const validateAll = { validateStatus: () => true };

const MENSAJE_DUPLICADO = 'Ya existe una fase con ese nombre para la jornada indicada';

function mapApiError(res, fallback) {
  if (res.status === 409) {
    return MENSAJE_DUPLICADO;
  }
  if (typeof res.data?.error === 'string') {
    return res.data.error;
  }
  return fallback;
}

export const listarFasesConfig = async (jornada) => {
  const params = jornada ? { jornada } : undefined;
  const res = await httpClient.get(BASE_PATH, { params, ...validateAll });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(mapApiError(res, 'Error al listar fases de configuración'));
  }

  return res.data;
};

export const crearFaseConfig = async (payload) => {
  const res = await httpClient.post(BASE_PATH, payload, validateAll);

  if (res.status < 200 || res.status >= 300) {
    throw new Error(mapApiError(res, 'Error al crear fase de configuración'));
  }

  return res.data;
};

export const actualizarFaseConfig = async (id, payload) => {
  const res = await httpClient.put(`${BASE_PATH}/${id}`, payload, validateAll);

  if (res.status < 200 || res.status >= 300) {
    throw new Error(mapApiError(res, 'Error al actualizar fase de configuración'));
  }

  return res.data;
};

export const eliminarFaseConfig = async (id) => {
  const res = await httpClient.delete(`${BASE_PATH}/${id}`, validateAll);

  if (res.status < 200 || res.status >= 300) {
    throw new Error(mapApiError(res, 'Error al eliminar fase de configuración'));
  }

  return res.data;
};
