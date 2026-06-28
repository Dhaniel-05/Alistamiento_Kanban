import httpClient from './httpClient';
import { logger } from '../utils/logger';

export const programaService = {
  async obtenerProgramas() {
    try {
      const response = await httpClient.get('/programas');
      return response.data;
    } catch (error) {
      logger.error('Error al obtener programas:', error);
      throw error;
    }
  },

  async eliminarPrograma(id) {
    try {
      logger.debug(`🗑️ Enviando solicitud para eliminar programa ID: ${id}`);

      const response = await httpClient.delete(`/programas/${id}`);
      logger.debug('✅ Respuesta del servidor:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Error al eliminar programa:', error);
      const message = error.response?.data?.mensaje || error.message;
      throw new Error(message);
    }
  },

  async obtenerProgramaPorId(id) {
    try {
      const response = await httpClient.get(`/programas/${id}`);
      return response.data;
    } catch (error) {
      logger.error('Error al obtener programa:', error);
      throw error;
    }
  },

  async crearPrograma(datos) {
    try {
      const response = await httpClient.post('/programas', datos);
      return response.data;
    } catch (error) {
      logger.error('Error al crear programa:', error);
      const message = error.response?.data?.mensaje || error.message;
      throw new Error(message);
    }
  },
};
