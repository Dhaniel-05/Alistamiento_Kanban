import { useCompetencias } from '../hooks/useCompetencias';
import { DroppableFaseColumn } from './DroppableFaseColumn';
import { DraggableCompetenciaCard } from './DraggableCompetenciaCard';
import { Plus } from 'lucide-react';
import { Button } from './ui/button';

interface CompetenciaBoardProps {
  fichaId: number;
}

const STATES = ['Por Asignar', 'Por Iniciar', 'En Proceso', 'Terminado'] as const;

export default function CompetenciaBoard({ fichaId }: CompetenciaBoardProps) {
  const { competencias, moveCompetenciaEstado, refetch } = useCompetencias(fichaId);

  const handleDrop = async (item: any, newState: string) => {
    if (item.type !== 'competencia') return;
    if (typeof moveCompetenciaEstado === 'function') {
      await moveCompetenciaEstado(item.id, newState);
      if (typeof refetch === 'function') await refetch();
    }
  };

  return (
    <div className="h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-1">Gestión de Competencias</h2>
          <p className="text-sm text-gray-600">Arrastra las competencias entre estados</p>
        </div>
        <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]">
          <Plus className="w-4 h-4 mr-2" />Nueva Competencia
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATES.map((state, idx) => {
          const comps = (competencias || []).filter((c: any) => {
            const est = (c.estado_competencia || c.estado || c.estados || '').toString();
            if (!est) return state === 'Por Asignar';
            return est.split('||').map((s: string) => s.trim()).includes(state) || est === state;
          });

          const fakeFase: any = { id: idx + 1, nombre: state };

          return (
            <DroppableFaseColumn key={state} fase={fakeFase} onDrop={(item) => handleDrop(item, state)} itemCount={comps.length}>
              {comps.length === 0 ? (
                <div className="text-center py-8 text-gray-500"><p className="text-sm">No hay competencias en este estado</p></div>
              ) : (
                comps.map((competencia: any) => (
                  <DraggableCompetenciaCard key={competencia.id} competencia={competencia} enableDrag />
                ))
              )}
            </DroppableFaseColumn>
          );
        })}
      </div>
    </div>
  );
}
