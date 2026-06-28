import httpClient from './httpClient';
import { logger } from '../utils/logger';

export const obtenerSabanaPorFicha = async (idFicha) => {
  try {
    const response = await httpClient.get(`/sabana/matriz/${idFicha}`);

    const respuesta = response.data;
    if (respuesta.success && respuesta.data) {
      return respuesta.data;
    }
    throw new Error(respuesta.mensaje || 'Error al obtener sábana');
  } catch (error) {
    logger.error('Error en obtenerSabanaPorFicha:', error);
    throw error;
  }
};

export const obtenerTrimestres = async (idFicha) => {
  try {
    const response = await httpClient.get(`/sabana/trimestres/${idFicha}`);
    const respuesta = response.data;
    if (respuesta.success && respuesta.data) return respuesta.data;
    throw new Error(respuesta.mensaje || 'Error al obtener trimestres');
  } catch (error) {
    logger.error('Error en obtenerTrimestres:', error);
    throw error;
  }
};

export const obtenerInstructorPorRAP = async (idFicha, idRap, idTrimestre) => {
  logger.debug(`🔍 Buscando instructor para RAP ${idRap}, ficha ${idFicha}, trimestre ${idTrimestre}`);

  try {
    const sabana = await obtenerSabanaPorFicha(idFicha);

    if (!sabana || !Array.isArray(sabana)) {
      logger.warn(`⚠️ Sábana no válida para ficha ${idFicha}`);
      return null;
    }

    const rapEnSabana = sabana.find((item) => item.id_rap === idRap
      || item.id === idRap
      || item.rap_id === idRap);

    if (!rapEnSabana) {
      logger.debug(`📭 RAP ${idRap} no encontrado en sábana de ficha ${idFicha}`);
      return null;
    }

    const trimestreKey = `t${idTrimestre}`;
    const instructorId = rapEnSabana[`${trimestreKey}_id_instructor`];
    const instructorNombre = rapEnSabana[`${trimestreKey}_instructor`];

    if (instructorId) {
      logger.debug(`✅ Instructor encontrado para RAP ${idRap}: ${instructorNombre || 'Instructor asignado'}`);
      return {
        id_instructor: instructorId,
        nombre: instructorNombre || 'Instructor asignado',
        apellido: '',
        asignado_en_sabana: true,
      };
    }

    logger.debug(`📝 RAP ${idRap} no tiene instructor asignado en trimestre ${idTrimestre}`);
    return null;
  } catch (error) {
    logger.warn(`🌐 Error obteniendo instructor para RAP ${idRap} desde sábana:`, error.message);
    return null;
  }
};

export const asignarRAP = async (idRap, idTrimestre, idFicha, move = false) => {
  try {
    const response = await httpClient.post('/sabana/assign', {
      id_rap: idRap,
      id_trimestre: idTrimestre,
      id_ficha: idFicha,
      move,
    });

    const respuesta = response.data;
    if (respuesta.success) {
      return respuesta.sabana || respuesta.data || respuesta;
    }
    throw new Error(respuesta.mensaje || 'Error al asignar RAP');
  } catch (error) {
    logger.error('Error en asignarRAP:', error);
    throw error;
  }
};

export const desasignarRAP = async (idRap, idTrimestre, idFicha) => {
  try {
    const response = await httpClient.delete('/sabana/unassign', {
      data: {
        id_rap: idRap,
        id_trimestre: idTrimestre,
        id_ficha: idFicha,
      },
    });

    const respuesta = response.data;
    if (respuesta.success) {
      return respuesta.sabana || respuesta.data || respuesta;
    }
    throw new Error(respuesta.mensaje || 'Error al desasignar RAP');
  } catch (error) {
    logger.error('Error en desasignarRAP:', error);
    throw error;
  }
};

export const obtenerInstructoresPorFicha = async (idFicha) => {
  const response = await httpClient.get(`/sabana/instructores/${idFicha}`);
  const respuesta = response.data;
  return respuesta.data || [];
};

export const asignarInstructor = async (idRapTrimestre, idInstructor) => {
  try {
    const response = await httpClient.patch('/sabana/assign-instructor', {
      id_rap_trimestre: idRapTrimestre,
      id_instructor: idInstructor,
    });

    const respuesta = response.data;
    if (respuesta.success) {
      return respuesta.data || respuesta;
    }
    throw new Error(respuesta.mensaje || 'Error al asignar instructor');
  } catch (error) {
    logger.error('Error en asignarInstructor:', error);
    throw error;
  }
};

export const desasignarInstructor = async (idRapTrimestre) => {
  const response = await httpClient.delete('/sabana/unassign-instructor', {
    data: { id_rap_trimestre: idRapTrimestre },
  });

  return response.data;
};
