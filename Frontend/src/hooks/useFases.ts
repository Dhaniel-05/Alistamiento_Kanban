import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { Fase } from '../types';

export function useFases(fichaId: number | null) {
  const [fases, setFases] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fichaId) {
      loadFases();
    }
  }, [fichaId]);

  const loadFases = async () => {
    if (!fichaId) return;

    setLoading(true);
    setError(null);

    // Pedir las fases (columnas del kanban) específicas para la ficha
    const response = await apiService.getKanbanFasesByFicha(fichaId);

    if (response.success && response.data) {
      const fasesOrdenadas = response.data.sort((a: any, b: any) => (a.id || 0) - (b.id || 0));
      // Asegurar que exista columna Sin Asignar y colocarla al inicio (izquierda)
      const sinAsignarIndex = fasesOrdenadas.findIndex((f: any) => f.nombre === 'Sin Asignar' || f.id === 999);
      if (sinAsignarIndex === -1) {
        // Insertar al inicio
        fasesOrdenadas.unshift({ id: 999, nombre: 'Sin Asignar', fase_base: 'Sin Asignar', fase_vista: null });
      } else if (sinAsignarIndex > 0) {
        // Mover existente al inicio
        const [sin] = fasesOrdenadas.splice(sinAsignarIndex, 1);
        fasesOrdenadas.unshift(sin);
      }
      setFases(fasesOrdenadas);
    } else {
      setError(response.error || 'Error al cargar las fases');
      // Fallback: crear fase "Sin Asignar" si hay error
      setFases([{ id: 999, nombre: 'Sin Asignar', fase_base: 'Sin Asignar', fase_vista: null }]);
      // No usar datos mock - solo datos reales del backend
    }

    setLoading(false);
  };

  return { fases, loading, error, refetch: loadFases };
}

// Datos mock eliminados - ahora solo se usan datos reales del backend
