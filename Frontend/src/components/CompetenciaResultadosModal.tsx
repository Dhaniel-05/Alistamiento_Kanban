import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { apiService } from '../../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Competencia, ResultadoAprendizaje, Usuario } from '../types';

interface CompetenciaResultadosModalProps {
  competencia: Competencia;
  fichaId?: number | null;
  open: boolean;
  onClose: () => void;
  canAssignResults?: boolean;
}

export function CompetenciaResultadosModal({ competencia, fichaId, open, onClose, canAssignResults = false }: CompetenciaResultadosModalProps) {
  const [resultados, setResultados] = useState<ResultadoAprendizaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentInstructorIndex, setCurrentInstructorIndex] = useState<{ [key: number]: number }>({});

  // Agrupar resultados por nombre para evitar duplicados y mostrar sus diferentes fases e instructores
  const groupResultadosByNombre = (results: ResultadoAprendizaje[]) => {
    const grouped = new Map<string, ResultadoAprendizaje[]>();
    
    results.forEach(resultado => {
      const nombre = (resultado.nombre || resultado.descripcion || 'Sin nombre').toLowerCase().trim();
      if (!grouped.has(nombre)) {
        grouped.set(nombre, []);
      }
      grouped.get(nombre)!.push(resultado);
    });
    
    return Array.from(grouped.values()).map(group => {
      // Combinar instructores con sus fases
      const instructoresConFases = new Map<string, { nombre: string; id: number | null; fases: string[] }>();
      
      group.forEach(r => {
        if (r.instructor_nombre) {
          const key = (r.instructor_nombre || '').toLowerCase().trim();
          if (!instructoresConFases.has(key)) {
            instructoresConFases.set(key, {
              nombre: r.instructor_nombre,
              id: r.id_usuario || null,
              fases: []
            });
          }
          // Agregar la fase si no existe ya
          const faseTexto = r.fase_vista || 'Sin fase';
          const inst = instructoresConFases.get(key)!;
          if (!inst.fases.includes(faseTexto)) {
            inst.fases.push(faseTexto);
          }
        }
      });

      return {
        ...group[0],
        fases: group.map(r => ({
          fase: r.fase_vista || 'Sin fase',
          id: r.id
        })),
        instructoresConFases: Array.from(instructoresConFases.values()),
        todasLasFases: group.length > 1
      };
    });
  };

  useEffect(() => {
    // Solo cargar cuando el modal se abre (no cuando se cierra)
    if (!open) return;

    if (!competencia?.id) {
      console.warn('No hay competencia válida para cargar resultados');
      setResultados([]);
      return;
    }

    setLoading(true);

    // Cargar resultados
    apiService.getResultadosByCompetencia(competencia.id, fichaId)
      .then(response => {
        if (response.success) {
          setResultados(response.data || []);
        } else {
          console.error('Error al obtener resultados:', response.error);
          setResultados([]);
        }
      })
      .catch(err => {
        console.error('Error al obtener resultados:', err);
        setResultados([]);
      })
      .finally(() => setLoading(false));
  }, [open, competencia?.id, fichaId]);


  // Función para obtener iniciales del instructor
  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Capitalizar primera letra
  const capitalizeFirst = (text: string) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Calcular horas por resultado único
  // Fórmula: (Total de horas / Cantidad de resultados únicos)
  const calcularHorasPorResultado = () => {
    const totalHoras = Number(competencia?.horas) || 0;
    const resultadosUnicos = groupResultadosByNombre(resultados).length;
    if (resultadosUnicos === 0 || totalHoras === 0) return 0;
    return totalHoras / resultadosUnicos;
  };

  // Calcular horas por fase
  // Fórmula: (Horas por resultado / Cantidad de fases del resultado)
  const calcularHorasPorFase = (cantidadFases: number) => {
    const horasPorResultado = calcularHorasPorResultado();
    if (cantidadFases === 0) return 0;
    return horasPorResultado / cantidadFases;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#2E7D32]">
            {(() => {
              const nombre = /* competencia.nombre_competencia || */ competencia.nombre || 'Sin nombre';
              return capitalizeFirst(nombre);
            })()}
          </DialogTitle>
          <DialogDescription>
            Código: {/* competencia.codigo_competencia || */ competencia.codigo} | Duración total: {Number(competencia.horas).toLocaleString('es-CO')} horas
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 max-h-[600px] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-gray-500">Cargando resultados...</p>
          ) : resultados.length === 0 ? (
            <p className="text-sm text-gray-500">No hay resultados asociados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {groupResultadosByNombre(resultados).map((r: any) => {
                // 'estado' column removed from resultados; no longer disponible
                const instructoresLen = r.instructoresConFases && r.instructoresConFases.length > 0 ? r.instructoresConFases.length : 0;
                const instructorActual = currentInstructorIndex[r.id] || 0;
                const mostrarCarruselInstructores = instructoresLen > 1;
                const instructorActualObj = instructoresLen > 0 ? r.instructoresConFases[instructorActual] : null;

                const handlePrevInstructor = () => {
                  setCurrentInstructorIndex(prev => ({
                    ...prev,
                    [r.id]: prev[r.id] === undefined || prev[r.id] === 0 ? instructoresLen - 1 : prev[r.id] - 1
                  }));
                };

                const handleNextInstructor = () => {
                  setCurrentInstructorIndex(prev => ({
                    ...prev,
                    [r.id]: (prev[r.id] || 0) + 1 >= instructoresLen ? 0 : (prev[r.id] || 0) + 1
                  }));
                };

                return (
                  <div
                    key={r.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Nombre del resultado */}
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-[#212121] leading-tight mb-2">
                        {capitalizeFirst(r.nombre || 'Sin nombre')}
                      </h4>
                      {/* El campo 'estado' fue eliminado de la tabla de resultados */}
                    </div>

                    {/* Fases Vista */}
                    {r.todasLasFases && r.fases && r.fases.length > 0 ? (
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Fases:</div>
                        <div className="flex flex-wrap gap-2">
                          {r.fases.map((f: any, idx: number) => {
                            const horasPorFase = calcularHorasPorFase(r.fases.length);
                            return (
                              <div key={idx} className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-full px-3 py-1">
                                <span className="text-xs font-medium text-blue-700">
                                  {capitalizeFirst(f.fase)}
                                </span>
                                <span className="text-xs text-blue-600">-</span>
                                <span className="text-xs text-blue-600 font-semibold">
                                  {horasPorFase.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : r.fase_vista ? (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 font-semibold">Fase:</span>
                        <div className="mt-1 inline-flex items-center gap-1 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-full px-3 py-1">
                          <span className="text-xs font-medium text-blue-700">
                            {capitalizeFirst(r.fase_vista)}
                          </span>
                          {/* horas_resultado eliminado: las horas se calculan desde la competencia */}
                        </div>
                      </div>
                    ) : null}

                    {/* Horas del resultado (si no es múltiple) */}
                    {!r.todasLasFases && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500">Horas:</span>
                        <span className="ml-2 text-xs font-medium text-[#666]">
                          {calcularHorasPorResultado().toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h
                        </span>
                      </div>
                    )}

                    {/* Carrusel de Instructores */}
                    {instructoresLen > 0 ? (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {mostrarCarruselInstructores && (
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-gray-700">
                              Instructor {instructorActual + 1} de {instructoresLen}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={handlePrevInstructor}
                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                                title="Instructor anterior"
                              >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={handleNextInstructor}
                                className="p-1 rounded hover:bg-gray-100 transition-colors"
                                title="Instructor siguiente"
                              >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {instructorActualObj && (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 min-w-fit">
                              <div className="w-6 h-6 rounded-full bg-[#2E7D32] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {getInitials(instructorActualObj.nombre)}
                              </div>
                              <span className="text-xs font-medium text-[#666]">
                                {instructorActualObj.nombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              <div className="text-xs text-gray-500 font-semibold whitespace-nowrap">Asignado en:</div>
                              <div className="flex flex-wrap gap-2">
                                {instructorActualObj.fases.map((fase: string, idx: number) => (
                                  <div key={idx} className="inline-flex items-center bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-full px-2 py-0.5">
                                    <span className="text-xs font-medium text-blue-700">
                                      {capitalizeFirst(fase)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">Sin instructor asignado</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
