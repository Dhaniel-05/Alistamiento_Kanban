import { useState, useEffect } from 'react';
import { useResultados } from '../hooks/useResultados';
import { useFases } from '../hooks/useFases';
import { DroppableFaseColumn } from './DroppableFaseColumn';
import { DraggableResultadoCard } from './DraggableResultadoCard';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

import { toast } from 'sonner';

interface ResultadoBoardProps {
  fichaId: number;
}

export default function ResultadoBoard({ fichaId }: ResultadoBoardProps) {
  const { resultados, loading: loadingResultados, refetch: refetchResultados, moveResultado } = useResultados(fichaId);
  const { fases, loading: loadingFases, refetch: refetchFases } = useFases(fichaId);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleDrop = async (item: any, nuevaFaseId: number) => {
    // item: DragItem
    try {
      const lane = fases.find(f => f.id === nuevaFaseId) as any;
      if (!lane) {
        console.error('[handleDrop] Lane no encontrada para id:', nuevaFaseId);
        return;
      }

      // Solo manejamos resultados en este kanban
      if (item.type === 'resultado') {
        // Obtener nombres de las fases
        const faseActual = fases.find(f => f.id === item.faseId);
        const faseDestino = fases.find(f => f.id === nuevaFaseId);
        
        const nombreFaseActual = faseActual?.nombre || 'Sin Asignar';
        const nombreFaseDestino = faseDestino?.nombre || 'Sin Asignar';

        // Confirmar movimiento
        const confirmar = window.confirm(
          `¿Estás seguro de mover este resultado?\n\n` +
          `Fase actual: ${nombreFaseActual}\n` +
          `Fase destino: ${nombreFaseDestino}`
        );

        if (!confirmar) return;

        console.log(`[handleDrop] Moviendo resultado ${item.id} a fase ID:`, nuevaFaseId);

        // Usar la función del hook que ya maneja fichaId y estado optimista
        const success = await moveResultado(item.id, nuevaFaseId);

        if (success) {
          toast.success(`Resultado movido a ${nombreFaseDestino}`);
        } else {
          toast.error('Error al mover el resultado');
        }
      } else {
        console.warn('[handleDrop] Item type no es resultado:', item.type);
      }
    } catch (err) {
      console.error('[handleDrop] ❌ Excepción al mover resultado:', err);
      toast.error('Error al mover resultado');
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('resultados-container');
    if (container) {
      const scrollAmount = 350;
      const newPosition = direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;

      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  if (loadingResultados || loadingFases) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Cargando resultados...</div>
      </div>
    );
  }

  // Función de normalización simple
  const normalize = (str: string | null | undefined): string => {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Ordenar fases: "Sin Asignar" primero, luego las demás
  const fasesOrdenadas = [...fases].sort((a: any, b: any) => {
    const aNombre = normalize(a.nombre || '');
    const bNombre = normalize(b.nombre || '');

    // "Sin Asignar" siempre primero
    if (a.id === 999 || aNombre === 'sin asignar') return -1;
    if (b.id === 999 || bNombre === 'sin asignar') return 1;

    // Ordenar por nombre
    return aNombre.localeCompare(bNombre);
  });

  return (
    <div className="h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-1">Gestión de Resultados de Aprendizaje</h2>
          <p className="text-sm text-gray-600">Arrastra los resultados entre las fases del proyecto</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => scroll('left')}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => scroll('right')}><ChevronRight className="w-4 h-4" /></Button>
          <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]"><Plus className="w-4 h-4 mr-2" />Nuevo Resultado</Button>
        </div>
      </div>

      <div id="resultados-container" className="overflow-x-auto h-[calc(100vh-240px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <div className="flex gap-4 pb-4" style={{ minWidth: 'max-content' }}>
          {fasesOrdenadas.map((fase: any) => {
            // Filtrar resultados por fase_id
            // En useResultados.ts ya asignamos fase_id numérico a cada resultado
            const esSinAsignar = fase.id === 999;

            const resultadosLane = (resultados || []).filter((r: any) => {
              if (esSinAsignar) {
                return !r.fase_id || r.fase_id === 999;
              }
              return r.fase_id === fase.id;
            });

            const isFaseHabilitada = fase.activo !== false && fase.habilitada !== false;

            return (
              <DroppableFaseColumn 
                key={fase.id} 
                fase={fase} 
                onDrop={handleDrop} 
                itemCount={resultadosLane.length}
                fichaId={fichaId}
                onFaseUpdated={() => {
                  // Recargar fases cuando se actualiza el estado
                  refetchFases();
                }}
              >
                {resultadosLane.length === 0 ? (
                  <div className="text-center py-8 text-gray-500"><p className="text-sm">No hay resultados en esta fase</p></div>
                ) : (
                  resultadosLane.map((resultado: any) => (
                    <DraggableResultadoCard
                      key={resultado.id}
                      resultado={resultado}
                      faseId={fase.id}
                      fichaId={fichaId} // Pasamos el fichaId para asignación de instructor
                      onInstructorAssigned={refetchResultados}
                      onDuplicated={refetchResultados}
                      faseHabilitada={isFaseHabilitada}
                    />
                  ))
                )}
              </DroppableFaseColumn>
            );
          })}
        </div>
      </div>
    </div>
  );
}
