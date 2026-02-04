import { useDrag } from 'react-dnd';
import { Copy } from 'lucide-react';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ResultadoDetalleModal } from './ResultadoDetalleModal';
import { apiService } from '../../services/api';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { useFases } from '../hooks/useFases';
import { toast } from 'sonner';
import type { ResultadoAprendizaje } from '../types';

interface DraggableResultadoCardProps {
  resultado: ResultadoAprendizaje;
  faseId: number;
  fichaId?: number;
  onInstructorAssigned?: () => void;
  onDuplicated?: () => void;
  canAssignInstructor?: boolean;
  canDrag?: boolean;
  faseHabilitada?: boolean;
  currentUserId?: number | null;
  isEquipoEjecutor?: boolean;
  canDuplicate?: boolean;
}

export function DraggableResultadoCard({
  resultado,
  faseId,
  fichaId,
  onInstructorAssigned,
  onDuplicated,
  canAssignInstructor = false,
  canDrag = false,
  faseHabilitada = true,
  currentUserId = null,
  isEquipoEjecutor = false,
  canDuplicate = true,
}: DraggableResultadoCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'resultado',
    item: {
      id: resultado.id,
      type: 'resultado',
      faseId: resultado.fase_id
    },
    canDrag: () => !!canDrag && faseHabilitada,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [resultado.id, resultado.fase_id, canDrag, faseHabilitada]);

  const [modalOpen, setModalOpen] = useState(false);
  const [dupOpen, setDupOpen] = useState(false);
  const [selectedFase, setSelectedFase] = useState<number | null>(faseId || 999);
  const [duplicating, setDuplicating] = useState(false);
  const [instructores, setInstructores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInstructores, setLoadingInstructores] = useState(false);

  const [isEditingInstructor, setIsEditingInstructor] = useState(false);

  useEffect(() => {
    const loadInstructores = async () => {
      if (!fichaId || !canAssignInstructor) {
        setInstructores([]);
        setLoadingInstructores(false);
        return;
      }
      try {
        setLoadingInstructores(true);
        const resp = await apiService.getUsuariosAsignadosAFicha(fichaId);
        if (resp.success && resp.data) {
          // Todos los usuarios asignados a la ficha (Instructor o Equipo Ejecutor)
          setInstructores(resp.data);
        } else {
          setInstructores([]);
        }
      } catch (err) {
        console.error('Error cargando instructores asignados a la ficha:', err);
        setInstructores([]);
      } finally {
        setLoadingInstructores(false);
      }
    };

    loadInstructores();
  }, [fichaId, canAssignInstructor]);

  // Fases para el diálogo de duplicado
  const { fases: opcionesFases, loading: loadingFases } = useFases(fichaId || null);

  const handleInstructorChange = async (value: string) => {
    if (!canAssignInstructor) return;
    setLoading(true);
    try {
      const instructorId = value === 'none' ? null : parseInt(value);
      if (!fichaId) {
        console.warn('No hay ficha asociada para asignar instructor');
        toast.error('No hay ficha asociada');
        return;
      }
      const resp = await apiService.asignInstructorToResultado(resultado.id, instructorId, fichaId);
      if (resp.success) {
        const instructorNombre = instructores.find(i => i.id_usuario === instructorId || i.id === instructorId);
        if (instructorId) {
          toast.success(`Instructor ${instructorNombre?.usuario_nombre || instructorNombre?.nombre_completo || 'asignado'} correctamente`);
        } else {
          toast.success('Instructor removido correctamente');
        }
        onInstructorAssigned?.();
        setIsEditingInstructor(false);
      } else {
        toast.error('Error al asignar instructor');
      }
    } catch (err) {
      console.error('Error asignando instructor:', err);
      toast.error('Error al asignar instructor');
    } finally {
      setLoading(false);
    }
  };

  const faseColors: Record<number, string> = {
    1: 'bg-blue-500 text-white',
    2: 'bg-green-500 text-white',
    3: 'bg-yellow-500 text-black',
    4: 'bg-red-500 text-white',
    5: 'bg-purple-500 text-white',
  };

  const getFaseColor = (faseId: number) => {
    return faseColors[faseId] || 'bg-gray-500 text-white';
  };

  // Obtener iniciales del instructor
  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // No abrir el modal si se está haciendo drag
    if (isDragging) return;
    // No abrir si se está haciendo click en el grip
    if ((e.target as HTMLElement).closest('.drag-handle')) return;
    // No abrir si se hace click en el boton duplicar
    if ((e.target as HTMLElement).closest('.duplicar-btn')) return;
    // No abrir si se hace click en controles de instructor
    if ((e.target as HTMLElement).closest('.instructor-controls')) return;

    setModalOpen(true);
  };

  // Validar si el formulario está completo (todos los 7 campos)
  const isFormularioCompleto = () => {
    const tieneActividadProyecto = !!(resultado.actividad_proyecto && resultado.actividad_proyecto.trim().length > 0);
    const tieneSaberesConceptos = !!(resultado.conocimientos_saber && resultado.conocimientos_saber.trim().length > 0);
    const tieneSaberesProceso = !!(resultado.conocimientos_proceso && resultado.conocimientos_proceso.trim().length > 0);
    const tieneCriteriosEvaluacion = !!(resultado.criterios_evaluacion && resultado.criterios_evaluacion.trim().length > 0);
    const tieneActividadAprendizaje = !!(resultado.actividad_aprendizaje && resultado.actividad_aprendizaje.trim().length > 0);
    const tieneEstrategiasDidacticas = !!(resultado.estrategias_didacticas && resultado.estrategias_didacticas.trim().length > 0);
    const tieneMaterialesFormacion = !!(resultado.materiales_formacion && resultado.materiales_formacion.trim().length > 0);

    return tieneActividadProyecto && tieneSaberesConceptos && tieneSaberesProceso &&
      tieneCriteriosEvaluacion && tieneActividadAprendizaje && tieneEstrategiasDidacticas &&
      tieneMaterialesFormacion;
  };

  const formularioCompleto = isFormularioCompleto();
  const parsedInstructorAsignado = resultado.id_usuario !== null && resultado.id_usuario !== undefined
    ? Number(resultado.id_usuario)
    : null;
  const normalizedAssignedIds = [resultado.id_usuario, resultado.id_instructor, parsedInstructorAsignado]
    .map((id) => {
      if (id === null || id === undefined) return null;
      const numericId = typeof id === 'number' ? id : Number(id);
      return Number.isFinite(numericId) ? numericId : null;
    })
    .filter((id): id is number => id !== null);
  const isInstructorAsignado = currentUserId !== null && normalizedAssignedIds.includes(currentUserId);
  const hasPermissionToEdit = isEquipoEjecutor || isInstructorAsignado;
  const canEditResultadoDetalle = faseHabilitada && hasPermissionToEdit;
  const readOnlyReason = !faseHabilitada
    ? 'Fase inhabilitada'
    : hasPermissionToEdit
      ? undefined
      : 'Sin permisos para editar este resultado';

  return (
    <>
      <div
        ref={drag as any}
        onClick={handleCardClick}
        className={`relative bg-white rounded-lg p-3 shadow-sm border hover:shadow-md transition-all cursor-pointer ${isDragging ? 'opacity-50 rotate-2' : ''} ${getFaseColor(faseId)}`}
        style={{
          borderWidth: '1px',
          borderColor: formularioCompleto
            ? 'rgba(34, 197, 94, 0.34)' // green-500 con opacidad 0.2
            : 'rgba(239, 68, 68, 0.33)' // red-500 con opacidad 0.2
        }}
      >
        {/* Boton para duplicar en la esquina superior derecha (oculto si no permitido) */}
        {canDuplicate && (
          <button
            type="button"
            title="Duplicar resultado"
            className="duplicar-btn absolute right-2 top-2 p-1 rounded hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFase(faseId || 999);
              setDupOpen(true);
            }}
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        )}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-medium text-[#212121] mb-2 leading-tight line-clamp-3 pr-6">
              {(() => {
                const nombre = resultado.nombre || resultado.descripcion || 'Resultado sin nombre';
                return nombre.charAt(0).toUpperCase() + nombre.slice(1);
              })()}
            </h4>

            {resultado.competencia_codigo && (
              <div className="mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    {resultado.competencia_codigo}
                  </Badge>
                  {resultado.competencia_nombre && (
                    <span className="text-xs text-gray-600 line-clamp-1">
                      {resultado.competencia_nombre}
                    </span>
                  )}
                </div>
                {/* Mostrar horas calculadas */}
                {resultado.horas_calculadas !== undefined && Number(resultado.horas_calculadas) > 0 && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs px-2 py-1 bg-green-50 text-green-700 border-green-200">
                      {Number(resultado.horas_calculadas).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}h
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructor Assignment */}
        <div className="mt-2 pt-2 instructor-controls">
          {!isEditingInstructor && resultado.instructor_nombre ? (
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#2E7D32] text-white flex items-center justify-center text-xs font-bold">
                {getInitials(resultado.instructor_nombre)}
              </div>
              <span className="text-xs text-[#666] font-medium flex-1">{resultado.instructor_nombre}</span>
              {canAssignInstructor && faseHabilitada && (
                <button
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingInstructor(true);
                  }}
                  title="Cambiar instructor"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            canAssignInstructor && faseHabilitada && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Select
                  onValueChange={handleInstructorChange}
                  value={resultado.id_usuario?.toString() || 'none'}
                  disabled={loading || loadingInstructores || !fichaId}
                >
                  <SelectTrigger className="w-full h-7 text-xs text-black">
                    <SelectValue placeholder={loadingInstructores ? 'Cargando instructores...' : 'Asignar instructor...'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="none" value="none">Sin asignar</SelectItem>
                    {instructores.map(inst => (
                      <SelectItem
                        key={inst.id_usuario || inst.id}
                        value={String(inst.id_usuario || inst.id)}
                      >
                        {inst.usuario_nombre || inst.nombre_completo || inst.nom_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isEditingInstructor && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingInstructor(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Cancelar edición"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <ResultadoDetalleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        resultado={resultado}
        onSuccess={() => {
          onInstructorAssigned?.();
        }}
        readOnly={!canEditResultadoDetalle}
        readOnlyReason={readOnlyReason}
      />

      {/* Dialog duplicar */}
      <Dialog open={dupOpen} onOpenChange={setDupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar resultado</DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            <DialogDescription className="text-sm text-gray-600 mb-3">
              Seleccione la fase donde desea colocar el duplicado:
            </DialogDescription>
            <Select onValueChange={(v) => setSelectedFase(v ? Number(v) : null)} value={selectedFase ? String(selectedFase) : '999'}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder={loadingFases ? 'Cargando fases...' : 'Seleccionar fase...'} />
              </SelectTrigger>
              <SelectContent>
                {opcionesFases.map((f: any) => (
                  <SelectItem key={f.id} value={String(f.id)}>{f.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDupOpen(false)}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!fichaId) {
                  toast.error('Falta ID de ficha para crear resultado');
                  return;
                }
                try {
                  setDuplicating(true);
                  // Obtener datos actualizados desde backend
                  const resp = await apiService.getResultado(resultado.id);
                  if (!resp.success || !resp.data) {
                    toast.error('No se pudo obtener el resultado original');
                    setDuplicating(false);
                    return;
                  }
                  const src: any = resp.data;
                  console.log('[DUPLICAR] Datos origen:', src); // Log source data

                  // Función para normalizar texto (sin tildes, minúsculas)
                  const normalizeText = (text?: string | null) => {
                    if (!text) return null;
                    return text
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .toLowerCase()
                      .trim();
                  };

                  // Determinar fase_vista a partir de la selección
                  const faseSel = opcionesFases.find((f: any) => f.id === selectedFase);
                  const faseVistaRaw = (!selectedFase || selectedFase === 999) ? null : (faseSel?.nombre || null);

                  // Normalizar faseVista (sin tildes, minúsculas)
                  let faseVista = normalizeText(faseVistaRaw);

                  // Si termina en " 1", removerlo (ej: "analisis 1" -> "analisis")
                  if (faseVista && faseVista.match(/\s+1$/)) {
                    faseVista = faseVista.replace(/\s+1$/, '').trim();
                  }

                  // Copiar fase_base del resultado original, no calcularla
                  const faseBase = src.fase_base || null;

                  console.log('[DUPLICAR] Fase normalizada:', {
                    faseVistaRaw,
                    faseVista,
                    faseBase
                  });

                  // Guardar id_competencia para que se calculen las horas correctamente
                  const payload = {
                    nombre: src.nombre || src.descripcion || 'Resultado duplicado',
                    idCompetencia: src.competencia_id || src.id_competencia, // Mantener la competencia
                    faseBase: faseBase,
                    faseVista: faseVista,
                    conocimientosSaber: src.conocimientos_saber || null,
                    conocimientosProceso: src.conocimientos_proceso || null,
                    actividadAprendizaje: src.actividad_aprendizaje || null,
                    evidenciaAprendizaje: src.evidencia_aprendizaje || src.descripcion_evidencia || null,
                    idFicha: fichaId || null
                  };

                  console.log('[DUPLICAR] Payload a enviar:', payload);

                  const created = await apiService.createResultado(payload);
                  if (created.success) {
                    toast.success('Resultado duplicado correctamente');
                    setDupOpen(false);
                    onDuplicated?.();
                  } else {
                    toast.error(created.error || 'Error al crear el resultado');
                  }
                } catch (err) {
                  console.error('Error duplicando resultado:', err);
                  toast.error('Error al duplicar el resultado');
                } finally {
                  setDuplicating(false);
                }
              }}
              disabled={duplicating}
            >
              {duplicating ? 'Duplicando...' : 'Duplicar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
