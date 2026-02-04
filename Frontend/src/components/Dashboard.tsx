
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CompetenciasView } from './CompetenciasView';
import { ResultadosView } from './ResultadosView';
import { ActasView } from './ActasView';
import { PlaneacionView } from './PlaneacionView';
import { GestionInstructoresModal } from './GestionInstructoresModal';
import { useFichas } from '../hooks/useFichas';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../../services/api';
import type { AsignacionFicha } from '../types';

type ViewMode = 'competencias' | 'resultados' | 'actas' | 'planeacion';

export function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);
  const [fichaSeleccionada, setFichaSeleccionada] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set initial view mode - recuperar de localStorage o default a competencias
  const getInitialViewMode = (): ViewMode => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard_viewMode');
      if (saved && ['competencias', 'resultados', 'actas', 'planeacion'].includes(saved)) {
        return saved as ViewMode;
      }
    }
    return 'competencias';
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode());

  // Persistir viewMode en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_viewMode', viewMode);
    }
  }, [viewMode]);
  const [openGestionInstructores, setOpenGestionInstructores] = useState(false);
  const { fichas, loading: fichasLoading } = useFichas();
  const [fichasDisponibles, setFichasDisponibles] = useState<typeof fichas>([]);
  const [loadingAsignaciones, setLoadingAsignaciones] = useState(true);
  const [asignacionesPorFicha, setAsignacionesPorFicha] = useState<Record<number, AsignacionFicha>>({});

  useEffect(() => {
    const syncFichasDisponibles = async () => {
      if (!user) {
        setFichasDisponibles([]);
        setLoadingAsignaciones(false);
        setFichaSeleccionada(null);
        return;
      }

      const userId = user.id || user.id_usuario;
      if (!userId) {
        setFichasDisponibles([]);
        setLoadingAsignaciones(false);
        return;
      }

      try {
        setLoadingAsignaciones(true);
        if (user.rol === 'SuperUsuario') {
          setFichasDisponibles(fichas);
          setAsignacionesPorFicha({});
        } else {
          const resp = await apiService.getFichasAsignadasAUsuario(userId);
          if (resp.success && resp.data) {
            const assignmentMap: Record<number, AsignacionFicha> = {};
            resp.data.forEach((item) => {
              const fichaId = Number(item.id_ficha);
              if (fichaId) {
                assignmentMap[fichaId] = item;
              }
            });
            const idsPermitidos = new Set(Object.keys(assignmentMap).map(Number));
            const filtradas = fichas.filter((ficha) => {
              const idFicha = Number((ficha as any).id_ficha || (ficha as any).id);
              return idsPermitidos.has(idFicha);
            });
            setFichasDisponibles(filtradas);
            setAsignacionesPorFicha(assignmentMap);
          } else {
            setFichasDisponibles([]);
            setAsignacionesPorFicha({});
          }
        }
      } catch (error) {
        console.error('Error cargando fichas asignadas al usuario:', error);
        setFichasDisponibles([]);
        setAsignacionesPorFicha({});
      } finally {
        setLoadingAsignaciones(false);
      }
    };

    syncFichasDisponibles();
  }, [user, fichas]);

  const getFichaId = (ficha: any) => Number((ficha as any)?.id_ficha || (ficha as any)?.id);

  // Buscar ficha por id_ficha o id (para compatibilidad)
  const fichaActual = fichasDisponibles.find(f => {
    const fichaId = getFichaId(f);
    return fichaId === fichaSeleccionada;
  }) || null;

  // Auto-seleccionar primera ficha si hay fichas y ninguna está seleccionada
  useEffect(() => {
    if (!fichasLoading && !loadingAsignaciones && fichasDisponibles.length > 0 && !fichaSeleccionada) {
      const primeraFicha = fichasDisponibles[0];
      const fichaId = (primeraFicha as any).id_ficha || (primeraFicha as any).id;
      if (fichaId) {
        console.log('🔍 Auto-seleccionando primera ficha:', fichaId);
        setFichaSeleccionada(fichaId);
      }
    } else if (!fichasLoading && !loadingAsignaciones && fichasDisponibles.length === 0) {
      setFichaSeleccionada(null);
    }
  }, [fichasDisponibles, fichasLoading, loadingAsignaciones, fichaSeleccionada]);

  const currentFichaId = fichaActual ? getFichaId(fichaActual) : null;
  const asignacionActual = currentFichaId ? asignacionesPorFicha[currentFichaId] : null;
  const rolFichaAsignado = user?.rol === 'SuperUsuario'
    ? 'Equipo Ejecutor'
    : asignacionActual?.rol_ficha || 'Instructor';
  const esEquipoEjecutorFicha = (rolFichaAsignado || '').toLowerCase() === 'equipo ejecutor';
  const canGestionarFicha = !!user && (user.rol === 'SuperUsuario' || esEquipoEjecutorFicha || user.rol === 'Equipo Ejecutor');

  useEffect(() => {
    if (!canGestionarFicha && openGestionInstructores) {
      setOpenGestionInstructores(false);
    }
  }, [canGestionarFicha, openGestionInstructores]);

  return (
    <div className="flex h-screen bg-[#F9F9F9]">
      <Sidebar
        user={user}
        fichas={fichasDisponibles}
        fichaSeleccionada={fichaSeleccionada}
        onSelectFicha={setFichaSeleccionada}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          user={user}
          onLogout={logout}
          canManageInstructores={canGestionarFicha}
          onOpenGestionInstructores={() => canGestionarFicha && setOpenGestionInstructores(true)}
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />

        <GestionInstructoresModal
          open={openGestionInstructores && canGestionarFicha}
          onOpenChange={setOpenGestionInstructores}
          ficha={fichaActual}
        />

        {fichasLoading || loadingAsignaciones ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E7D32]"></div>
          </div>
        ) : fichasDisponibles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center bg-[#F9F9F9]">
            <div className="text-center">
              <div className="w-24 h-24 bg-[#2E7D32]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-[#2E7D32] text-4xl">SENA</span>
              </div>
              <h2 className="text-gray-900 mb-2">
                Bienvenido al Sistema de Alistamiento
              </h2>
              <p className="text-gray-600 mb-4">
                No tienes fichas asignadas actualmente
              </p>
              {user?.rol === 'SuperUsuario' && (
                <p className="text-sm text-gray-500">
                  Puedes crear fichas desde el Panel de Administración
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'competencias' && (
              <CompetenciasView
                ficha={fichaActual}
                canAssignResults={canGestionarFicha}
              />
            )}
            {viewMode === 'resultados' && (
              <ResultadosView
                ficha={fichaActual}
                canAssignInstructor={canGestionarFicha}
                canMoveResultados={canGestionarFicha}
                rolFicha={rolFichaAsignado}
              />
            )}
            {viewMode === 'actas' && <ActasView ficha={fichaActual} />}
            {viewMode === 'planeacion' && <PlaneacionView ficha={fichaActual} />}
          </>
        )}
      </div>
    </div>
  );
}
