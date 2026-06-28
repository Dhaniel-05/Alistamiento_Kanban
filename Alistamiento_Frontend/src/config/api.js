const DEV_API_FALLBACK = 'http://localhost:3000/api';

export const API_BASE_URL = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? DEV_API_FALLBACK : '');
