import { logger } from '../utils/logger';
import { useState, useEffect, useCallback } from 'react';
import httpClient from '../services/httpClient';

const validateAll = { validateStatus: () => true };

/**
 * @param {{ listEndpoint?: string, autoLoad?: boolean, loadProgramas?: boolean }} options
 */
export function useFichas({
  listEndpoint = '/fichas/todas',
  autoLoad = true,
  loadProgramas = true,
} = {}) {
  const [fichas, setFichas] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarFichas = useCallback(async () => {
    const res = await httpClient.get(listEndpoint, validateAll);
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Error al obtener las fichas');
    }
    setFichas(res.data);
    return res.data;
  }, [listEndpoint]);

  const cargarProgramas = useCallback(async () => {
    const res = await httpClient.get('/programas', validateAll);
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Error al obtener los programas');
    }
    setProgramas(res.data);
    return res.data;
  }, []);

  const guardarFichaEnApi = useCallback(async (fichaData) => {
    const esEdicion = !!fichaData.id_ficha;
    const path = esEdicion ? `/fichas/${fichaData.id_ficha}` : '/fichas';
    const res = esEdicion
      ? await httpClient.put(path, fichaData, validateAll)
      : await httpClient.post(path, fichaData, validateAll);

    if (res.status < 200 || res.status >= 300) {
      throw new Error('Error al guardar la ficha');
    }

    const data = await cargarFichas();
    return { resultado: res.data, fichas: data };
  }, [cargarFichas]);

  const eliminarFichaEnApi = useCallback(async (idFicha) => {
    const res = await httpClient.delete(`/fichas/${idFicha}`, validateAll);
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Error al eliminar la ficha');
    }
    setFichas((prev) => prev.filter((ficha) => ficha.id_ficha !== idFicha));
    return res.data;
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      try {
        await cargarFichas();
        if (loadProgramas) {
          await cargarProgramas();
        }
      } catch (error) {
        logger.error('Error cargando fichas:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
    return undefined;
  }, [autoLoad, loadProgramas, cargarFichas, cargarProgramas]);

  return {
    fichas,
    setFichas,
    programas,
    loading,
    cargarFichas,
    cargarProgramas,
    guardarFichaEnApi,
    eliminarFichaEnApi,
  };
}
