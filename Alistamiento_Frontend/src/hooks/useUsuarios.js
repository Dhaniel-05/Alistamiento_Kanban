import { useState, useEffect, useCallback } from 'react';
import { logger } from '../utils/logger';
import {
  leerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from '../services/usuarioService';

export function useUsuarios({ autoLoad = true } = {}) {
  const [usuarios, setUsuarios] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    const data = await leerUsuarios();
    setUsuarios(data);

    if (data && data.length > 0) {
      const info = data
        .map((u) => `ID: ${u.id_instructor}, Cédula: ${u.cedula}, Email: ${u.email}`)
        .join('\n');
      setDebugInfo(info);
    } else {
      setDebugInfo('');
    }

    return data;
  }, []);

  const guardarUsuario = useCallback(async (usuarioNormalizado, modoEdicion) => {
    if (modoEdicion) {
      await actualizarUsuario(usuarioNormalizado);
    } else {
      await crearUsuario(usuarioNormalizado);
    }
    return cargarUsuarios();
  }, [cargarUsuarios]);

  const eliminarUsuarioPorId = useCallback(async (id) => {
    await eliminarUsuario(id);
    return cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    if (!autoLoad) {
      return undefined;
    }

    const load = async () => {
      setLoading(true);
      try {
        await cargarUsuarios();
      } catch (error) {
        logger.error('Error cargando usuarios:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => {});
    return undefined;
  }, [autoLoad, cargarUsuarios]);

  return {
    usuarios,
    setUsuarios,
    debugInfo,
    loading,
    cargarUsuarios,
    guardarUsuario,
    eliminarUsuarioPorId,
  };
}
