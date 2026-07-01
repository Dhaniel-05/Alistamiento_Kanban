import httpClient from './httpClient';
import { logger } from '../utils/logger';

export const loginRequest = async (credentials) => {
  try {
    const response = await httpClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      const headerRetry = parseInt(error.response.headers?.['retry-after'], 10);
      const bodyRetry = Number(error.response.data?.retryAfter);
      const retryAfter = Number.isFinite(bodyRetry) && bodyRetry > 0
        ? bodyRetry
        : (Number.isFinite(headerRetry) && headerRetry > 0 ? headerRetry : 120);

      const rateLimitError = new Error(
        error.response.data?.mensaje || 'Demasiados intentos. Intenta de nuevo en unos minutos.',
      );
      rateLimitError.code = 'RATE_LIMIT';
      rateLimitError.retryAfter = retryAfter;
      throw rateLimitError;
    }

    const message = error.response?.data?.error
      || error.response?.data?.mensaje
      || 'Error en las credenciales';
    logger.error('Error en loginRequest', message);
    throw new Error(message);
  }
};

export const fetchSessionMe = async () => {
  const response = await httpClient.get('/auth/me');
  return response.data;
};
