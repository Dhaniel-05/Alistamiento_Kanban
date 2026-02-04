import { useDrag, useDrop } from 'react-dnd';
import { Clock, GripVertical, User } from 'lucide-react';
import { Badge } from './ui/badge';
import type { ResultadoAprendizaje } from '../types';

interface ResultadoCardProps {
  resultado: ResultadoAprendizaje;
  onDrop: (resultadoId: number, newEstado: string) => void;
  currentEstado: string;
}

const ItemType = 'RESULTADO';

export default function ResultadoCard({ resultado, onDrop, currentEstado }: ResultadoCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { id: resultado.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item: { id: number }) => {
      if (item.id !== resultado.id) {
        onDrop(item.id, currentEstado);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const getProgressPercentage = () => {
    switch (currentEstado) {
      case 'Por Asignar': return 0;
      case 'Por Iniciar': return 25;
      case 'En Proceso': return 50;
      case 'Terminado': return 75;
      case 'Aprobado': return 100;
      default: return 0;
    }
  };

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
          <div className="mb-3">
          <h4 className="text-sm text-gray-900 line-clamp-3 leading-tight">
            {resultado.nombre || resultado.descripcion || 'Resultado sin nombre'}
          </h4>
          </div>

          {resultado.competencia_codigo && (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                {resultado.competencia_codigo}
              </Badge>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {resultado.competencia_nombre}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>0h</span>
            </div>
            {resultado.instructor_nombre && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{resultado.instructor_nombre}</span>
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Progreso</span>
              <span>{getProgressPercentage()}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#2E7D32] transition-all"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
