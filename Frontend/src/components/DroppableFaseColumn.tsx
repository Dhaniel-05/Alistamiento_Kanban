import { useDrop } from 'react-dnd';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Lock, Unlock } from 'lucide-react';
import { apiService } from '../../services/api';
import { toast } from 'sonner';
import { useState } from 'react';
import type { Fase, DragItem } from '../types';

interface DroppableFaseColumnProps {
  fase: Fase;
  children: React.ReactNode;
  onDrop: (item: DragItem, faseId: number) => void;
  itemCount: number;
  canDropItems?: boolean;
  fichaId?: number;
  onFaseUpdated?: () => void;
  hideZeroCountBadge?: boolean;
  canToggleHabilitada?: boolean;
}

export function DroppableFaseColumn({
  fase,
  children,
  onDrop,
  itemCount,
  canDropItems = true,
  fichaId,
  onFaseUpdated,
  hideZeroCountBadge = false,
  canToggleHabilitada = true,
}: DroppableFaseColumnProps) {
  // Determinar si la fase está habilitada (activo !== false)
  const isHabilitada = fase.activo !== false && fase.habilitada !== false;
  const [isUpdating, setIsUpdating] = useState(false);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ['competencia', 'resultado'],
    drop: (item: DragItem) => {
      if (canDropItems && isHabilitada) {
        onDrop(item, fase.id);
      }
    },
    canDrop: () => !!canDropItems && isHabilitada,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [fase.id, onDrop, canDropItems, isHabilitada]);

  const isActive = isOver && canDrop;
  const shouldShowCountBadge = !(hideZeroCountBadge && itemCount === 0);

  const handleToggleHabilitada = async () => {
    if (!fichaId || fase.id === 999) return; // No permitir inhabilitar "Sin Asignar"

    setIsUpdating(true);
    try {
      const nuevoEstado = !isHabilitada;
      const response = await apiService.updateFaseFicha(fichaId, fase.id, {
        activo: nuevoEstado
      });

      if (response.success) {
        toast.success(`Fase ${nuevoEstado ? 'habilitada' : 'inhabilitada'} correctamente`);
        onFaseUpdated?.();
      } else {
        toast.error(response.error || 'Error al actualizar la fase');
      }
    } catch (error) {
      console.error('Error al actualizar fase:', error);
      toast.error('Error al actualizar la fase');
    } finally {
      setIsUpdating(false);
    }
  };

  const getBorderColor = (faseId: number) => {
    if (!isHabilitada) return '#9ca3af'; // gray-400

    // Paleta de colores naturales que se acoplan al verde #39A900
    const colors: Record<number, string> = {
      1: '#0891b2', // cyan-600 - Análisis
      2: '#16a34a', // green-600 - Planeación
      3: '#f59e0b', // amber-500 - Ejecución
      4: '#dc2626', // red-600 - Evaluación
      5: '#7c3aed', // violet-600
      6: '#db2777', // pink-600
      7: '#4f46e5', // indigo-600
      8: '#059669', // emerald-600
      9: '#ea580c', // orange-600
      999: '#6b7280', // gray-500 - Sin Asignar
    };

    return colors[faseId] || '#6b7280'; // gray-500
  };

  return (
    <div
      ref={drop as any}
      className={`flex-shrink-0 w-full space-y-3 transition-all ${isActive ? 'ring-2 ring-[#2E7D32] ring-offset-2 rounded-xl' : ''
        } ${!isHabilitada ? 'opacity-50' : ''}`}
    >
      <div
        className={`rounded-lg p-4 border-2 ${!isHabilitada
          ? 'border-gray-300 bg-gray-100'
          : 'border-[#E0E0E0] bg-white'
          } sticky top-0 z-10`}
        style={{
          borderLeft: `8px solid ${getBorderColor(fase.id)}`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <h3 className={`text-sm font-semibold ${!isHabilitada ? 'text-gray-500' : 'text-[#212121]'
              }`}>
              {fase.nombre}
            </h3>
            {!isHabilitada && (
              <span className="text-xs bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                Inhabilitada
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {shouldShowCountBadge && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${!isHabilitada
                ? 'bg-gray-200 text-gray-500'
                : 'bg-gray-100 text-gray-600'
                }`}>
                {itemCount}
              </span>
            )}
            {fichaId && fase.id !== 999 && canToggleHabilitada && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleHabilitada}
                disabled={isUpdating}
                className="h-7 w-7 p-0"
                title={isHabilitada ? 'Inhabilitar columna' : 'Habilitar columna'}
              >
                {isHabilitada ? (
                  <Unlock className="w-4 h-4 text-gray-600" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-500" />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-3 pr-2">
          {children}
        </div>

        {/* Drop zone indicator */}
        {isActive && isHabilitada && (
          <div className="mt-2 p-6 border-2 border-dashed border-[#2E7D32] rounded-lg bg-green-50 flex items-center justify-center">
            <p className="text-xs text-[#2E7D32]">Soltar aquí</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
