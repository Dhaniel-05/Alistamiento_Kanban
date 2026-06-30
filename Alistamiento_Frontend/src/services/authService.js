import httpClient from './httpClient';
import { logger } from '../utils/logger';

export const loginRequest = async (credentials) => {
  try {
    const response = await httpClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.error || 'Error en las credenciales';
    logger.error('Error en loginRequest', message);
    throw new Error(message);
  }
};

export const fetchSessionMe = async () => {
  const response = await httpClient.get('/auth/me');
  return response.data;
};
