import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../services/api';
import type { Competencia } from '../types';

export function useCompetencias(fichaId: number | null) {
  const [competencias, setCompetencias] = useState<Competencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (fichaId) {
      loadCompetencias();
    }
  }, [fichaId]);

  const loadCompetencias = async () => {
    if (!fichaId) {
      setCompetencias([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getCompetenciasByFicha(fichaId);

    if (response.success && response.data) {
      console.log('✅ Competencias cargadas:', response.data.length, 'para ficha:', fichaId);
      console.log('📊 Competencias:', response.data);
      setCompetencias(response.data);
    } else {
      console.error('❌ Error al cargar competencias:', response.error);
      setError(response.error || 'Error al cargar las competencias');
      setCompetencias([]);
      // No usar datos mock - solo datos reales del backend
    }
    } catch (err) {
      console.error('❌ Excepción al cargar competencias:', err);
      setError('Error de conexión al cargar las competencias');
      setCompetencias([]);
    }

    setLoading(false);
  };

  const searchCompetencias = async (query: string) => {
    if (!fichaId) return;
    
    setSearchQuery(query);
    
    if (!query.trim()) {
      loadCompetencias();
      return;
    }

    setLoading(true);
    const response = await apiService.searchCompetencias(fichaId, query);
    
    if (response.success && response.data) {
      setCompetencias(response.data);
    }
    
    setLoading(false);
  };

  const moveCompetencia = async (competenciaId: number, nuevaFaseId: number) => {
    // Actualizar el estado local inmediatamente (optimistic update)
    setCompetencias(prev => 
      prev.map(comp => 
        comp.id === competenciaId 
          ? { ...comp, fase_id: nuevaFaseId }
          : comp
      )
    );

    // Intentar actualizar en el backend
    try {
      const response = await apiService.updateCompetenciaFase(competenciaId, nuevaFaseId);
      
      if (!response.success) {
        // Si falla el backend pero estamos usando datos mock, está bien
        console.warn('Backend no disponible, usando datos locales');
      }
      
      return true;
    } catch (error) {
      // Si hay error pero estamos en modo mock, está bien
      console.warn('Error al conectar con backend, usando datos locales');
      return true;
    }
  };

  const moveCompetenciaEstado = async (competenciaId: number, nuevoEstado: string) => {
    // Actualización optimista local: marcar el estado representativo de la competencia
    setCompetencias(prev => prev.map(comp => comp.id === competenciaId ? { ...comp, estado_competencia: nuevoEstado } : comp));

    try {
      const resp = await apiService.updateCompetenciaEstado(competenciaId, nuevoEstado);
      if (!resp.success) {
        console.warn('No se pudo persistir estado de competencia en backend:', resp.error);
      }
      return true;
    } catch (err) {
      console.error('Error conectando al backend al mover competencia:', err);
      return false;
    }
  };

  const getCompetenciasByFase = useCallback((faseId: number | null) => {
    if (faseId === null || faseId === 999) {
      // Fase "Sin Asignar" - competencias sin fase_id o con fase_id null/undefined
      const sinAsignar = competencias.filter(comp => 
        comp.fase_id === null || 
        comp.fase_id === undefined || 
        comp.fase_id === 0 ||
        !comp.fase_id
      );
      console.log('🔍 Competencias sin asignar:', sinAsignar.length, sinAsignar);
      return sinAsignar;
    }
    const porFase = competencias.filter(comp => comp.fase_id === faseId);
    console.log(`🔍 Competencias en fase ${faseId}:`, porFase.length, porFase);
    return porFase;
  }, [competencias]);

  return { 
    competencias, 
    loading, 
    error, 
    searchQuery,
    searchCompetencias,
    moveCompetencia,
    moveCompetenciaEstado,
    getCompetenciasByFase,
    refetch: loadCompetencias 
  };
}

// Datos mock eliminados - ahora solo se usan datos reales del backend
