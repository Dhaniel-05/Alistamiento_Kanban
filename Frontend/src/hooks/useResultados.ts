import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { ResultadoAprendizaje } from '../types';

export function useResultados(fichaId: number | null) {
  const [resultados, setResultados] = useState<ResultadoAprendizaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (fichaId) {
      loadResultados();
    }
  }, [fichaId]);

  const loadResultados = async () => {
    if (!fichaId) {
      setResultados([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getResultadosByFicha(fichaId);

      if (response.success && response.data) {
        console.log('✅ Resultados cargados:', response.data.length, 'para ficha:', fichaId);
        console.log('📊 Estructura de resultados cargados:');
        response.data.slice(0, 3).forEach((r: any) => {
          console.log(`  - Resultado ${r.id}: fase_id=${r.fase_id}, fase_nombre='${r.fase_nombre}', fase_vista='${r.fase_vista}'`);
        });
        setResultados(response.data);
      } else {
        console.error('❌ Error al cargar resultados:', response.error);
        setError(response.error || 'Error al cargar los resultados');
        setResultados([]);
        // No usar datos mock - solo datos reales del backend
      }
    } catch (err) {
      console.error('❌ Excepción al cargar resultados:', err);
      setError('Error de conexión al cargar los resultados');
      setResultados([]);
    }

    setLoading(false);
  };

  const searchResultados = async (query: string) => {
    if (!fichaId) return;

    setSearchQuery(query);

    if (!query.trim()) {
      loadResultados();
      return;
    }

    setLoading(true);
    const response = await apiService.searchResultados(fichaId, query);

    if (response.success && response.data) {
      setResultados(response.data);
    }

    setLoading(false);
  };

  const moveResultado = async (resultadoId: number, nuevaFaseId: number | null) => {
    // Esperar confirmación del backend antes de actualizar el estado local
    try {
      console.log(`🎯 [moveResultado] Moviendo resultado ${resultadoId} a fase ${nuevaFaseId}, fichaId=${fichaId}`);
      const response = await apiService.updateResultadoFase(resultadoId, nuevaFaseId, fichaId || undefined);

      if (response.success) {
        console.log(`✅ [moveResultado] Respuesta del backend:`, response.data);
        // Refrescar resultados desde el backend para evitar discrepancias/cachés locales
        console.log(`🔄 [moveResultado] Recargando resultados desde servidor...`);
        await loadResultados();
        console.log(`✅ [moveResultado] Resultados recargados completamente`);
        return true;
      } else {
        console.error('❌ Error del backend:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error al conectar con backend:', error);
      return false;
    }
  };

  const getResultadosByFase = useCallback((faseId: number | null) => {
    if (faseId === null || faseId === 999) {
      // Fase "Sin Asignar" - resultados sin fase_id o con fase_id null/undefined
      const sinAsignar = resultados.filter(res =>
        res.fase_id === null ||
        res.fase_id === undefined ||
        res.fase_id === 0 ||
        !res.fase_id
      );
      console.log(`🔍 [getResultadosByFase] Fase NULL/999: ${sinAsignar.length} resultados sin asignar`);
      return sinAsignar;
    }
    const porFase = resultados.filter(res => res.fase_id === faseId);
    console.log(`🔍 [getResultadosByFase] Fase ${faseId}: ${porFase.length} resultados. Total resultados cargados: ${resultados.length}`);
    return porFase;
  }, [resultados]);

  return {
    resultados,
    loading,
    error,
    searchQuery,
    searchResultados,
    moveResultado,
    getResultadosByFase,
    refetch: loadResultados
  };
}

// Datos mock eliminados - ahora solo se usan datos reales del backend
