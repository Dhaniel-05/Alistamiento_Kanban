import httpClient from './httpClient';
import { logger } from '../utils/logger';

export const leerFichasPorInstructor = async (idInstructor) => {
  try {
    const response = await httpClient.get(`/fichas/instructor/${idInstructor}`);
    return response.data;
  } catch (err) {
    logger.error('leerFichasPorInstructor error:', err);
    throw err;
  }
};
