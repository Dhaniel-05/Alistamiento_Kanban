import { logger } from '../utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { planeacionService } from '../services/planeacionService';
import httpClient from '../services/httpClient';

const validateAll = { validateStatus: () => true };

export function usePlaneacionPedagogica(idFicha, { autoLoad = true } = {}) {
  const navigate = useNavigate();

  const [planeaciones, setPlaneaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [eliminando, setEliminando] = useState(null);
  const [fichaInfo, setFichaInfo] = useState(null);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [planeacionSeleccionada, setPlaneacionSeleccionada] = useState(null);

  const cargarInfoFicha = useCallback(async (fichaId) => {
    if (!fichaId) {
      setFichaInfo({
        codigo_ficha: 'No disponible',
        nombre_programa: 'Ficha no especificada',
        nombre_instructor: 'No asignado',
        jornada: 'No definida',
        modalidad: 'No definida',
      });
      return;
    }

    try {
      setCargandoFicha(true);

      let fichaEncontrada = null;

      try {
        const response = await httpClient.get('/fichas/todas', validateAll);
        if (response.status >= 200 && response.status < 300) {
          const fichas = response.data;
          fichaEncontrada = fichas.find((f) => f.id_ficha === parseInt(fichaId, 10)
            || f.id === parseInt(fichaId, 10)
            || f.codigo_ficha === fichaId.toString());
        }
      } catch (error) {
        logger.warn('⚠️ Error en la solicitud de fichas:', error);
      }

      if (fichaEncontrada) {
        const fichaInfoParaSidebar = {
          codigo_ficha: fichaEncontrada.codigo_ficha || fichaEncontrada.numero_ficha || fichaId.toString(),
          nombre_programa: fichaEncontrada.nombre_programa || fichaEncontrada.programa || 'Programa no asignado',
          jornada: fichaEncontrada.jornada || 'No definida',
          modalidad: fichaEncontrada.modalidad || 'No definida',
          nombre_instructor: 'Cargando...',
          fecha_inicio: fichaEncontrada.fecha_inicio,
          fecha_final: fichaEncontrada.fecha_final,
          programa: fichaEncontrada.nombre_programa || fichaEncontrada.programa,
          instructor: 'Cargando...',
          ubicacion: fichaEncontrada.ubicacion,
          ambiente: fichaEncontrada.ambiente,
        };

        setFichaInfo(fichaInfoParaSidebar);

        if (fichaEncontrada.id_instructor) {
          httpClient.get(`/instructores/${fichaEncontrada.id_instructor}`, validateAll)
            .then((instructorRes) => {
              if (instructorRes.status >= 200 && instructorRes.status < 300) {
                return instructorRes.data;
              }
              throw new Error(`Error ${instructorRes.status}`);
            })
            .then((instructorData) => {
              const nombreInstructor = instructorData.nombre || 'Instructor no asignado';
              setFichaInfo((prev) => ({
                ...prev,
                nombre_instructor: nombreInstructor,
                instructor: nombreInstructor,
              }));
            })
            .catch(() => {
              setFichaInfo((prev) => ({
                ...prev,
                nombre_instructor: 'No asignado',
                instructor: 'No asignado',
              }));
            });
        } else {
          setFichaInfo((prev) => ({
            ...prev,
            nombre_instructor: 'No asignado',
            instructor: 'No asignado',
          }));
        }
      } else {
        setFichaInfo({
          codigo_ficha: fichaId.toString(),
          nombre_programa: 'Ficha no encontrada en el sistema',
          nombre_instructor: 'No asignado',
          jornada: 'No definida',
          modalidad: 'No definida',
          programa: 'Ficha no encontrada',
          instructor: 'No asignado',
        });
      }
    } catch (error) {
      logger.error('❌ Error crítico cargando información de ficha:', error);
      setFichaInfo({
        codigo_ficha: fichaId?.toString() || 'Error',
        nombre_programa: 'Error al cargar información',
        nombre_instructor: 'No disponible',
        jornada: 'No definida',
        modalidad: 'No definida',
        programa: 'Error al cargar',
        instructor: 'No disponible',
      });
    } finally {
      setCargandoFicha(false);
    }
  }, []);

  const cargarPlaneaciones = useCallback(async () => {
    try {
      setLoading(true);

      let datos;
      if (idFicha) {
        try {
          datos = await planeacionService.obtenerPlaneacionesPorFicha(idFicha);
        } catch (error) {
          if (error.message.includes('500')) {
            setPlaneaciones([]);
            throw new Error('Error interno del servidor. El servicio de planeaciones no está disponible temporalmente. Por favor, intente más tarde.');
          }
          throw error;
        }
      } else {
        datos = await planeacionService.obtenerPlaneaciones();
      }

      if (datos && datos.data) {
        setPlaneaciones(datos.data);
      } else if (Array.isArray(datos)) {
        setPlaneaciones(datos);
      } else if (datos && Array.isArray(datos.planeaciones)) {
        setPlaneaciones(datos.planeaciones);
      } else {
        setPlaneaciones([]);
      }
    } catch (error) {
      logger.error('❌ Error cargando planeaciones:', error);
      setPlaneaciones([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [idFicha]);

  const verPlaneacion = useCallback(async (planeacion) => {
    try {
      setCargandoDetalles(true);
      const planeacionCompleta = await planeacionService.obtenerDetallesPlaneacion(
        planeacion.id_planeacion || planeacion.id,
      );

      if (!planeacionCompleta) {
        throw new Error('No se pudieron cargar los datos completos de la planeación');
      }

      const planeacionFormateada = {
        ...planeacionCompleta,
        trimestre: planeacionCompleta.trimestre || (() => {
          const match = planeacionCompleta.observaciones?.match(/Trimestre\s+(\d+)/i);
          return match && match[1] ? parseInt(match[1], 10) : 1;
        })(),
        info_ficha: planeacionCompleta.info_ficha || {
          ficha: planeacionCompleta.ficha,
          programa: planeacionCompleta.programa,
          proyecto: planeacionCompleta.proyecto,
        },
        raps: planeacionCompleta.raps || [],
      };

      setPlaneacionSeleccionada(planeacionFormateada);
      return planeacionFormateada;
    } finally {
      setCargandoDetalles(false);
    }
  }, []);

  const eliminarPlaneacion = useCallback(async (idPlaneacion) => {
    try {
      setEliminando(idPlaneacion);
      const resultado = await planeacionService.eliminarPlaneacion(idPlaneacion);

      if (resultado.success) {
        setPlaneaciones((prev) => prev.filter((p) => p.id_planeacion !== idPlaneacion && p.id !== idPlaneacion));
        return { success: true };
      }

      return { success: false, mensaje: resultado.mensaje };
    } finally {
      setEliminando(null);
    }
  }, []);

  const volverASabana = useCallback(() => {
    if (idFicha) {
      navigate(`/sabana/${idFicha}`);
    } else {
      navigate('/sabana');
    }
  }, [idFicha, navigate]);

  useEffect(() => {
    if (!autoLoad) {
      return undefined;
    }

    cargarPlaneaciones().catch(() => {});
    if (idFicha) {
      cargarInfoFicha(idFicha);
    }
    return undefined;
  }, [autoLoad, idFicha, cargarPlaneaciones, cargarInfoFicha]);

  return {
    planeaciones,
    loading,
    cargandoDetalles,
    eliminando,
    fichaInfo,
    cargandoFicha,
    planeacionSeleccionada,
    setPlaneacionSeleccionada,
    cargarPlaneaciones,
    cargarInfoFicha,
    verPlaneacion,
    eliminarPlaneacion,
    volverASabana,
  };
}
