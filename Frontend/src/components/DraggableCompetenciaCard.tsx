import { useDrag } from 'react-dnd';
import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import type { Competencia, InstructorCompetencia } from '../types';
import { CompetenciaResultadosModal } from './CompetenciaResultadosModal';
import { apiService } from '../../services/api';

// Interfaz que define las props del componente: recibe un objeto competencia
interface DraggableCompetenciaCardProps {
  competencia: Competencia;
  fichaId?: number | null;
  canAssignResults?: boolean;
  enableDrag?: boolean;
}

// Componente principal: Tarjeta arrastrable que representa una competencia
export function DraggableCompetenciaCard({ competencia, fichaId, canAssignResults = false, enableDrag = false }: DraggableCompetenciaCardProps) {
  // Hook useDrag de react-dnd para hacer el componente arrastrable
  // Configura el tipo 'competencia' y pasa datos como id y faseId al arrastrar
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'competencia',
    item: {
      id: competencia.id,
      type: 'competencia',
      faseId: competencia.fase_id,
    },
    canDrag: () => enableDrag,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(), // Estado que indica si se está arrastrando
    }),
  }), [competencia.id, competencia.fase_id, enableDrag]); // Dependencias: se recrea si cambian id o fase_id

  // Estados locales
  const [modalOpen, setModalOpen] = useState(false); // Controla si el modal de resultados está abierto
  const [instructores, setInstructores] = useState<InstructorCompetencia[]>([]); // Lista de instructores asociados

  // useEffect: Obtiene instructores desde la API o del campo instructores de la competencia
  useEffect(() => {
    const fetchInstructores = async () => {
      try {
        // Si la competencia ya tiene instructores en el campo instructores (string separado por ||)
        if ((competencia as any).instructores) {
          const instructoresStr = (competencia as any).instructores;
          if (typeof instructoresStr === 'string' && instructoresStr.trim()) {
            const instructoresArray = instructoresStr.split('||').map((inst: string) => {
              const [id, nombre] = inst.split(':');
              return {
                id_instructor: parseInt(id),
                nombre_instructor: nombre || 'Sin nombre',
                correo: '',
                rol_en_competencia: 'Instructor'
              };
            }).filter((inst: any) => inst.id_instructor);
            
            if (instructoresArray.length > 0) {
              setInstructores(instructoresArray);
              return;
            }
          }
        }

        // Si no hay instructores en el campo, obtener desde la API
        const response = await apiService.getInstructoresByCompetencia(competencia.id);
        if (response.success) {
          const data = response.data || [];
          console.log('Instructores obtenidos desde API:', data);
          setInstructores(data.map((inst: any) => ({
            id_instructor: inst.id_instructor,
            nombre_instructor: inst.nombre_instructor,
            correo: inst.correo || '',
            rol_en_competencia: 'Instructor'
          })));
        } else {
          console.error('Error al obtener instructores:', response.error);
          setInstructores([]);
        }
      } catch (error) {
        console.error('Error al obtener instructores:', error);
        setInstructores([]);
      }
    };

    fetchInstructores();
  }, [competencia.id, (competencia as any).instructores]);

  // Renderizado del componente
  const normaRaw = competencia.norma_competencia?.trim() || '';
  const formattedNorma = normaRaw ? normaRaw.charAt(0).toUpperCase() + normaRaw.slice(1) : '';

  return (
    // Contenedor principal: Div con ref para drag, click para abrir modal, estilos condicionales si está arrastrando
    <div
      ref={enableDrag ? (drag as any) : undefined} // Referencia para react-dnd (solo si está habilitado)
      onClick={() => setModalOpen(true)} // Al hacer clic, abre el modal
      className={`bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all relative ${
        isDragging ? 'opacity-50 rotate-1' : '' // Estilos condicionales: opacidad y rotación si arrastrando
      }`}
      style={{ cursor: enableDrag ? 'grab' : 'pointer', width: '100%' }} // Estilos inline adaptados
    >
      {/* Encabezado: Muestra código (principal), horas, norma_competencia, nombre_competencia */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          {/* Código (principal) */}
          <div className="mb-2">
            <p className="text-sm font-bold text-[#2E7D32]">{competencia.codigo || 'Sin código'}</p>
          </div>
          
          {/* Horas */}
          {competencia.horas && (
            <div className="mb-2">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 border-[#2E7D32] text-[#2E7D32]"
              >
                {competencia.horas}h
              </Badge>
            </div>
          )}

          {/* Norma de competencia */}
          {formattedNorma && (
            <div className="mb-2">
              <p className="text-[11px] text-gray-500 leading-tight italic">
                {formattedNorma}
              </p>
            </div>
          )}

          {/* Nombre de competencia */}
          <div className="mb-2">
            <h4 className="text-xs font-semibold text-[#212121] leading-tight">
              {(() => {
                const nombre = competencia.nombre || 'Sin nombre';
                return nombre.charAt(0).toUpperCase() + nombre.slice(1);
              })()}
            </h4>
          </div>
        </div>
      </div>

      {/* Avatares ocultos por solicitud del usuario */}

      {/* Modal de resultados: Componente modal que se abre al clic, pasa competencia y función para cerrar */}
      <CompetenciaResultadosModal
        competencia={competencia}
        fichaId={fichaId || null}
        canAssignResults={canAssignResults}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
