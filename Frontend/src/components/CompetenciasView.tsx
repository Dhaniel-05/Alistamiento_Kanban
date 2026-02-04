import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { DraggableCompetenciaCard } from './DraggableCompetenciaCard';
import { DroppableFaseColumn } from './DroppableFaseColumn';
import { useCompetencias } from '../hooks/useCompetencias';
import { useFases } from '../hooks/useFases';
import type { DragItem, Ficha } from '../types';
import { toast } from 'sonner';
import { GenerateDocumentMenu } from './GenerateDocumentMenu';

interface CompetenciasViewProps {
  ficha: Ficha | null;
  canAssignResults?: boolean;
}

export function CompetenciasView({ ficha, canAssignResults = false }: CompetenciasViewProps) {
  const {
    competencias,
    loading,
    searchQuery,
    searchCompetencias,
    refetch,
    moveCompetenciaEstado
  } = useCompetencias(ficha?.id_ficha || null);
  const { fases, loading: loadingFases } = useFases(ficha?.id_ficha || null);

  const STATES = ['Por Iniciar', 'En Progreso', 'Terminado'];

  const handleDrop = async (item: DragItem, nuevaState: string) => {
    try {
      if (item.type === 'competencia') {
        const success = await moveCompetenciaEstado(item.id, nuevaState);

        if (success) {
          await (typeof refetch === 'function' ? refetch() : Promise.resolve());
          toast.success(`Competencia movida a ${nuevaState}`);
        } else {
          toast.error('Error al mover la competencia');
        }
      }
    } catch (err) {
      console.error('Error al mover item:', err);
      toast.error('Error al mover el elemento');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchCompetencias(e.target.value);
  };

  if (!ficha) {
    return (
      <div className="flex-1 bg-[#F9F9F9] p-6 flex items-center justify-center">
        <p className="text-[#666]">Selecciona una ficha para ver las competencias</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F9F9F9] p-6 overflow-hidden flex flex-col">
      <div className="mb-6">
        <h1 className="text-[#212121] text-xl font-semibold mb-2">
          FICHA {ficha.codigo_ficha} - {(ficha.nombre_ficha || 'Sin Nombre').toUpperCase()} - {ficha.programa_nombre} {(ficha as any).nivel_formacion ? `(${(ficha as any).nivel_formacion})` : ''}
        </h1>
        <p className="text-sm text-[#666] font-medium">GESTIÓN DE COMPETENCIAS Y SEGUIMIENTO</p>
      </div>

      <div className="flex gap-4 mb-6 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="BUSCAR UNA COMPETENCIA EN ESPECÍFICO"
            className="pl-10 bg-white border-[#E0E0E0] rounded-lg h-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <GenerateDocumentMenu ficha={ficha} fases={fases} loadingFases={loadingFases} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-[#666]">Cargando competencias...</p>
        </div>
      ) : (
        <div className="flex gap-4 h-full overflow-hidden">
          {STATES.map((state, idx) => {
            const comps = (competencias || []).filter((comp: any) => {
              // Si hay búsqueda, filtrar por nombre o código
              if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const nombreMatch = (comp.nombre || '').toLowerCase().includes(query);
                const codigoMatch = (comp.codigo || '').toLowerCase().includes(query);
                if (!nombreMatch && !codigoMatch) return false;
              }

              const est = (comp.estado_competencia || comp.estados || '').toString();
              // Si no tiene estado, y estamos en 'Por Iniciar', mostrarlo ahí por defecto si 'Por Asignar' ya no existe
              if (!est) return state === 'Por Iniciar';

              // estados puede ser 'Por Asignar||En Proceso' etc.
              // Mapear 'Por Asignar' a 'Por Iniciar' para que no se pierdan
              const estados = est.split('||').map((s: string) => s.trim());
              if (estados.includes('Por Asignar') && state === 'Por Iniciar') return true;

              return estados.includes(state) || (comp.estado_competencia === state);
            });

            const fakeFaseObj: any = { id: idx + 1, nombre: state };

            return (
              <div key={state} className="flex-1 min-w-[300px] h-full flex flex-col">
                <DroppableFaseColumn
                  fase={fakeFaseObj}
                  onDrop={(item: DragItem) => handleDrop(item, state)}
                  itemCount={comps.length}
                >
                  {comps.map((competencia: any) => (
                    <DraggableCompetenciaCard
                      key={competencia.id}
                      competencia={competencia}
                      fichaId={ficha.id_ficha || (ficha as any).id}
                      canAssignResults={canAssignResults}
                    />
                  ))}
                </DroppableFaseColumn>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
