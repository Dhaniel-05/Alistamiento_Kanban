import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { DraggableResultadoCard } from './DraggableResultadoCard';
import { DroppableFaseColumn } from './DroppableFaseColumn';
import { useResultados } from '../hooks/useResultados';
import { useFases } from '../hooks/useFases';
import type { DragItem, Ficha } from '../types';
import { toast } from 'sonner';
import { GenerateDocumentMenu } from './GenerateDocumentMenu';
import { useAuth } from '../context/AuthContext';

interface ResultadosViewProps {
  ficha: Ficha | null;
  canAssignInstructor?: boolean;
  canMoveResultados?: boolean;
  rolFicha?: string | null;
}

export function ResultadosView({ ficha, canAssignInstructor = false, canMoveResultados = false, rolFicha = null }: ResultadosViewProps) {
  const { user } = useAuth();
  const currentUserId = user?.id || user?.id_usuario || null;
  const isEquipoEjecutorFicha = (rolFicha || '').toLowerCase() === 'equipo ejecutor';
  const isInstructorFicha = (rolFicha || '').toLowerCase() === 'instructor';

  const {
    resultados,
    loading,
    searchQuery,
    searchResultados,
    moveResultado,
    getResultadosByFase,
    refetch
  } = useResultados(ficha?.id_ficha || null);

  const { fases, loading: loadingFases, refetch: refetchFases } = useFases(ficha?.id_ficha || null);

  // Mapas para calcular horas por fase:
  // - nombreCountMap: cuántas veces aparece un mismo resultado (por nombre) en la ficha
  // - competenciaUniqueMap: para cada competencia, conjunto de resultados únicos (por nombre)
  const nombreCountMap = new Map<string, number>();
  const competenciaUniqueMap = new Map<number, Set<string>>();
  (resultados || []).forEach((r: any) => {
    const nombreNorm = (r.nombre || r.descripcion || '').toLowerCase().trim();
    if (!nombreNorm) return;
    nombreCountMap.set(nombreNorm, (nombreCountMap.get(nombreNorm) || 0) + 1);
    const compId = Number(r.competencia_id || r.id_competencia || 0);
    if (!compId) return;
    const set = competenciaUniqueMap.get(compId) || new Set<string>();
    set.add(nombreNorm);
    competenciaUniqueMap.set(compId, set);
  });
  // Función para agrupar resultados duplicados por nombre (contar como 1)
  const groupResultadosByNombre = (results: any[]) => {
    const grouped = new Map<string, any[]>();

    results.forEach(resultado => {
      const nombre = (resultado.nombre || resultado.descripcion || 'Sin nombre').toLowerCase().trim();
      if (!grouped.has(nombre)) {
        grouped.set(nombre, []);
      }
      grouped.get(nombre)!.push(resultado);
    });

    return Array.from(grouped.values()).map(group => group[0]); // Retornar solo el primero de cada grupo
  };

  const handleDrop = async (item: DragItem, nuevaFaseId: number) => {
    if (!canMoveResultados) return;
    if (item.type !== 'resultado') return;
    if (item.faseId === nuevaFaseId) return;

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

    const success = await moveResultado(item.id, nuevaFaseId);

    if (success) {
      toast.success(`Resultado movido a ${nombreFaseDestino}`);
      // Forzar re-render: llamar a refetch nuevamente después del toast
      await refetch();
    } else {
      toast.error('Error al mover el resultado');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchResultados(e.target.value);
  };

  if (!ficha) {
    return (
      <div className="flex-1 bg-[#F9F9F9] p-6 flex items-center justify-center">
        <p className="text-[#666]">Selecciona una ficha para ver los resultados de aprendizaje</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F9F9F9] p-6 overflow-auto">
      <div className="mb-6">
        <h1 className="text-[#212121] text-xl font-semibold mb-2">
          FICHA {ficha.codigo_ficha} - {(ficha.nombre_ficha || 'Sin Nombre').toUpperCase()} - {ficha.programa_nombre} {(ficha as any).nivel_formacion ? `(${(ficha as any).nivel_formacion})` : ''}
        </h1>
        <p className="text-sm text-[#666] font-medium">GESTIÓN DE RESULTADOS DE APRENDIZAJE Y SEGUIMIENTO</p>
      </div>

      <div className="flex gap-4 mb-6 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="BUSCAR RESULTADOS DE APRENDIZAJE EN ESPECÍFICO"
            className="pl-10 bg-white border-[#E0E0E0] rounded-lg h-10"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <GenerateDocumentMenu ficha={ficha} fases={fases} loadingFases={loadingFases} />
      </div>

      {loading || loadingFases ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-[#666]">Cargando resultados de aprendizaje...</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 ">
          {fases.map((fase) => {
            // Filtrar resultados por fase_vista (si fase.nombre es "Sin Asignar" o id es 999, buscar null/undefined)
            let faseResultados: any[] = [];

            if (fase.id === 999 || fase.nombre === 'Sin Asignar') {
              // Buscar resultados sin fase_vista asignada
              faseResultados = resultados.filter((res: any) =>
                !res.fase_vista || res.fase_vista === null || res.fase_vista === ''
              );
            } else {
              // Buscar resultados que coincidan con el nombre normalizado de la fase
              const faseNormalized = fase.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

              faseResultados = resultados.filter((res: any) => {
                if (!res.fase_vista) return false;
                const resNormalized = res.fase_vista.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                // Coincidencia exacta (ej: "analisis 2" == "analisis 2")
                if (resNormalized === faseNormalized) return true;

                // Si fase_vista NO tiene número (ej: "analisis"), 
                // debe coincidir SOLO con la fase que termina en " 1" (ej: "analisis 1")
                if (!resNormalized.match(/\d+$/)) {
                  // fase_vista es base (sin número), buscar coincidencia con base + " 1"
                  return faseNormalized === `${resNormalized} 1` || faseNormalized === `${resNormalized}1`;
                }

                return false;
              });
            }

            // Si hay búsqueda, filtrar resultados por nombre
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase();
              faseResultados = faseResultados.filter((res: any) => {
                const nombre = (res.nombre || res.descripcion || '').toLowerCase();
                return nombre.includes(query);
              });
            }

            // Calcular horas por fase para cada resultado en esta lista
            faseResultados = faseResultados.map((res: any) => {
              try {
                const nombreNorm = (res.nombre || res.descripcion || '').toLowerCase().trim();
                const compId = Number(res.competencia_id || res.id_competencia || 0);
                const totalHorasComp = Number(res.competencia_horas) || 0;
                const resultadosUnicosComp = competenciaUniqueMap.get(compId)?.size || 0;
                const horasPorResultado = resultadosUnicosComp > 0 ? (totalHorasComp / resultadosUnicosComp) : 0;
                const fasesCount = nombreCountMap.get(nombreNorm) || 1;
                const horasPorFase = fasesCount > 0 ? (horasPorResultado / fasesCount) : horasPorResultado;
                // Adjuntar el valor para que el componente hijo lo use
                return { ...res, horas_por_fase: horasPorFase, horas_calculadas: horasPorFase };
              } catch (err) {
                return res;
              }
            });

            // Agrupar resultados para contar solo los únicos
            const faseResultadosUnicos = groupResultadosByNombre(faseResultados);
            const itemCountUnicos = faseResultadosUnicos.length;

            const isFaseHabilitada = fase.activo !== false && fase.habilitada !== false;

            return (
              <div key={fase.id} className="flex-shrink-0 w-[320px] sm:w-[340px] md:w-[360px]">
                <DroppableFaseColumn
                  fase={fase}
                  onDrop={handleDrop}
                  canDropItems={canMoveResultados}
                  itemCount={itemCountUnicos}
                  fichaId={ficha.id_ficha || (ficha as any).id}
                  onFaseUpdated={() => {
                    // Recargar fases cuando se actualiza el estado
                    refetchFases();
                  }}
                  hideZeroCountBadge
                  canToggleHabilitada={isEquipoEjecutorFicha}
                >
                  {faseResultados.map((resultado) => (
                    <DraggableResultadoCard
                      key={resultado.id}
                      resultado={resultado}
                      faseId={fase.id}
                      fichaId={ficha.id_ficha || (ficha as any).id}
                      canAssignInstructor={canAssignInstructor}
                      canDrag={canMoveResultados}
                      onInstructorAssigned={() => refetch()}
                      faseHabilitada={isFaseHabilitada}
                      currentUserId={currentUserId}
                      isEquipoEjecutor={isEquipoEjecutorFicha}
                      canDuplicate={!isInstructorFicha}
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
