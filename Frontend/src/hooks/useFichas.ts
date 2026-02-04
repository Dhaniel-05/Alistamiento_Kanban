import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { Ficha } from '../types';

export function useFichas() {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFichas();
  }, []);

  const loadFichas = async () => {
    setLoading(true);
    setError(null);

    const response = await apiService.getFichas();

    if (response.success && response.data) {
      setFichas(response.data);
    } else {
      setError(response.error || 'Error al cargar las fichas');
      setFichas([]);
      // No usar datos mock - solo datos reales del backend
    }

    setLoading(false);
  };

  return { fichas, loading, error, refetch: loadFichas };
}

// Datos mock eliminados - ahora solo se usan datos reales del backend
