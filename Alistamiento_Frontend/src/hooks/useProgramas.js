import { logger } from '../utils/logger';
import { useState, useEffect, useCallback } from 'react';
import httpClient from '../services/httpClient';

const validateAll = { validateStatus: () => true };

export function useProgramas({ autoLoad = true } = {}) {
  const [programas, setProgramas] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarProgramas = useCallback(async () => {
    const res = await httpClient.get('/programas', validateAll);
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Error al obtener los programas');
    }
    setProgramas(res.data);
    return res.data;
  }, []);

  const eliminarPrograma = useCallback(async (id) => {
    if (!id) {
      throw new Error('ID del programa no válido');
    }

    const response = await httpClient.delete(`/programas/${id}`, validateAll);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(response.data?.mensaje || 'Error al eliminar programa');
    }

    await cargarProgramas();
    return response.data;
  }, [cargarProgramas]);

  useEffect(() => {
    if (!autoLoad) {
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      try {
        await cargarProgramas();
      } catch (error) {
        logger.error('Error cargando programas:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
    return undefined;
  }, [autoLoad, cargarProgramas]);

  return {
    programas,
    setProgramas,
    loading,
    cargarProgramas,
    eliminarPrograma,
  };
}
