import { useDrag, useDrop } from 'react-dnd';
import { Clock, GripVertical, FileText } from 'lucide-react';
import { Badge } from './ui/badge';
import type { Competencia } from '../types';

type Fase = 'Análisis' | 'Planeación' | 'Ejecución';

interface CompetenciaCardProps {
  competencia: Competencia;
  onDrop: (competenciaId: number, newFase: Fase) => void;
  currentFase: Fase;
}

const ItemType = 'COMPETENCIA';

export default function CompetenciaCard({ competencia, onDrop, currentFase }: CompetenciaCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: competencia.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    drop: (item: { id: number }) => {
      if (item.id !== competencia.id) {
        onDrop(item.id, currentFase);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={(node) => {
        drag(node);
        drop(node);
      }}
      className={`bg-white rounded-lg border border-gray-200 p-4 cursor-move transition-all hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      } ${isOver ? 'ring-2 ring-[#2E7D32]' : ''}`}
    >
      <div className="flex items-start gap-3">
        <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm text-gray-900 line-clamp-2">
              {competencia.nombre}
            </h4>
            <Badge variant="outline" className="flex-shrink-0 text-xs">
              {competencia.codigo}
            </Badge>
          </div>

          {competencia.descripcion && competencia.descripcion.length > 0 && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">
              {competencia.descripcion.join(' ')}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{competencia.horas}h</span>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#2E7D32] transition-all"
              style={{ 
                width: currentFase === 'Análisis' ? '33%' : 
                       currentFase === 'Planeación' ? '66%' : '100%' 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
