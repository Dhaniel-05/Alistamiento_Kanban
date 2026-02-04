import { LayoutGrid, List } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Usuario, Ficha } from '../types';

type ViewMode = 'competencias' | 'resultados' | 'actas' | 'planeacion';

interface SidebarProps {
  user?: Usuario | null;
  fichas: Ficha[];
  fichaSeleccionada: number | null;
  onSelectFicha: (fichaId: number) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  user,
  fichas,
  fichaSeleccionada,
  onSelectFicha,
  viewMode,
  onViewModeChange,
  isOpen = false,
  onClose
}: SidebarProps) {
  // const isAdmin = user?.rol === 'SuperUsuario' || user?.rol?.toLowerCase() === 'admin';

  // if (isAdmin) {
  //   return null;
  // }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Por Iniciar': return 'bg-gray-500';
      case 'En Progreso': return 'bg-orange-300';
      case 'Finalizada': return 'bg-green-600';
      default: return 'bg-gray-400';
    }
  };

  // Calcula el estado de la ficha a partir de fechas (fecha_inicio, fecha_fin)
  // Reglas según petición del usuario:
  // - Si fecha_fin <= hoy => 'Finalizada'
  // - Si fecha_inicio < hoy => 'Por Iniciar'
  // - Si fecha_inicio >= hoy => 'En Progreso'
  const computeEstadoFromDates = (ficha: any) => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

      const parseDate = (d?: string | null) => {
        if (!d) return null;
        // Ignorar valores nulos o placeholders
        if (d === '0000-00-00' || d === '0000-00-00T00:00:00') return null;

        // ISO y otros formatos reconocidos por Date
        let dt = new Date(d);
        if (!isNaN(dt.getTime())) return normalize(dt);

        // Intentar formato dd/MM/yyyy
        const parts = (d || '').split(/[\/\-\.]/).map(p => p.trim());
        if (parts.length === 3) {
          // detectar si es dd/mm/yyyy o yyyy-mm-dd
          if (parts[0].length === 4) { // yyyy-mm-dd
            const y = Number(parts[0]);
            const m = Number(parts[1]) - 1;
            const day = Number(parts[2]);
            dt = new Date(y, m, day);
            if (!isNaN(dt.getTime())) return normalize(dt);
          } else { // dd/mm/yyyy
            const day = Number(parts[0]);
            const m = Number(parts[1]) - 1;
            const y = Number(parts[2]);
            dt = new Date(y, m, day);
            if (!isNaN(dt.getTime())) return normalize(dt);
          }
        }

        return null;
      };

      const inicio = parseDate(ficha.fecha_inicio || (ficha as any).fechaInicio || ficha.fecha_inicio_programa || ficha.fechaInicio);
      const fin = parseDate(ficha.fecha_fin || (ficha as any).fechaFin || ficha.fecha_fin_programa || ficha.fechaFin);

      // 1) Si hay fecha fin y es igual o anterior a hoy => Finalizada
      if (fin && fin.getTime() <= today.getTime()) return 'Finalizada';

      // Si fecha_inicio y fecha_fin son iguales y hoy coincide con ese día,
      // debe prevalecer fecha_fin (ya cubierto por la condición anterior).

      // 2) Si la fecha actual es menor que la fecha_inicio => Por Iniciar
      if (inicio && today.getTime() < inicio.getTime()) return 'Por Iniciar';

      // 3) Si la fecha actual es mayor o igual a la fecha_inicio => En Progreso
      if (inicio && today.getTime() >= inicio.getTime()) return 'En Progreso';

      // Si no hay fechas, usar estado existente o 'Por Iniciar'
      return ficha.estado || 'Por Iniciar';
    } catch (err) {
      return ficha.estado || 'Por Iniciar';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-full md:w-60 lg:w-80
        bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-white">
                <img src="/src/assets/images/logo_favicon.png" alt="Logo SENA" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Sistema de Alistamiento</p>
                <p className="text-xs text-gray-600">Formación Profesional</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar menú"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Fichas List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
              Fichas Asignadas
            </h3>
          </div>

          <div className="space-y-3">
            {fichas.map((ficha) => {
              const fichaId = ficha.id_ficha || ficha.id || 0;
              const isSelected = fichaSeleccionada === fichaId;

              return (
                <div
                  key={fichaId}
                  className={`rounded-lg border transition-all ${isSelected
                    ? 'border-[#2E7D32] bg-[#2E7D32]/5 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {ficha.codigo_ficha || ficha.codigo}
                          </span>
                          {(() => {
                            const estadoCalc = computeEstadoFromDates(ficha);
                            return (
                              <Badge className={`${getEstadoColor(estadoCalc)} text-white text-xs px-2 py-0.5`}>
                                {estadoCalc}
                              </Badge>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {ficha.nombre_ficha || ficha.nombre || ficha.programa_nombre}
                        </p>
                      </div>
                    </div>

                    {/* Detalles adicionales */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs">
                        <span className="block text-gray-500 mb-0.5">Jornada</span>
                        <span className="font-medium text-gray-700">{ficha.jornada || 'N/A'}</span>
                      </div>
                      <div className="text-xs">
                        <span className="block text-gray-500 mb-0.5">Modalidad</span>
                        <span className="font-medium text-gray-700">{ficha.modalidad || ficha.modalidad_formacion || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Botones para ver competencias y resultados de esta ficha */}
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <Button
                        variant={viewMode === 'competencias' && isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          onSelectFicha(fichaId);
                          onViewModeChange('competencias');
                          onClose?.(); // Close sidebar on mobile after selection
                        }}
                        className={`w-full justify-start gap-2 text-xs ${viewMode === 'competencias' && isSelected
                          ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <LayoutGrid className="w-3 h-3" />
                        <span>Ver Competencias</span>
                      </Button>
                      <Button
                        variant={viewMode === 'resultados' && isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          onSelectFicha(fichaId);
                          onViewModeChange('resultados');
                          onClose?.(); // Close sidebar on mobile after selection
                        }}
                        className={`w-full justify-start gap-2 text-xs ${viewMode === 'resultados' && isSelected
                          ? 'bg-[#2E7D32] hover:bg-[#1B5E20] text-white'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <List className="w-3 h-3" />
                        <span>Ver Resultados</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
