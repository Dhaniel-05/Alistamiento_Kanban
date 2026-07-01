import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { NuevaPlaneacionForm } from './components/NuevaPlaneacionForm';
import { VistaPlaneacion } from './components/VistaPlaneacion';
import { ModalExito } from '../../components/ui/ModalExito';
import { ModalError } from '../../components/ui/ModalError';
import { ModalConfirmacion } from '../../components/ui/ModalConfirmacion';
import { useAuthContext } from '../../context/AuthContext';
import { usePlaneacionPedagogica } from '../../hooks/usePlaneacionPedagogica';
import { planeacionService } from '../../services/planeacionService';
import { puedeEditarFicha } from '../../utils/permisos';
import './PlaneacionPedagogica.css';

const extraerTrimestreDeObservaciones = (observaciones) => {
  if (!observaciones) return '1';

  const match = observaciones.match(/Trimestre\s+(\d+)/i);
  if (match && match[1]) {
    return match[1];
  }

  return '1';
};

export const PlaneacionPedagogica = () => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [planeacionEnEdicion, setPlaneacionEnEdicion] = useState(null);
  const [avisoReconciliacionEdicion, setAvisoReconciliacionEdicion] = useState(null);
  const [cargandoEdicion, setCargandoEdicion] = useState(false);
  const [exportando, setExportando] = useState(null);
  const [mostrarVista, setMostrarVista] = useState(false);

  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');
  const [planeacionAEliminar, setPlaneacionAEliminar] = useState(null);

  const { idFicha } = useParams();
  const { user } = useAuthContext();

  const {
    planeaciones,
    loading,
    eliminando,
    fichaInfo,
    cargandoFicha,
    planeacionSeleccionada,
    setPlaneacionSeleccionada,
    reconciliacion,
    cargarPlaneaciones,
    cargarInfoFicha,
    eliminarPlaneacion,
    volverASabana,
  } = usePlaneacionPedagogica(idFicha, { autoLoad: false });

  const mostrarErrorCarga = (error) => {
    let mensajeError = 'Error al cargar las planeaciones';
    if (error.message.includes('500')) {
      mensajeError = 'Error interno del servidor. El servicio de planeaciones no está disponible.';
    } else if (error.message.includes('404')) {
      mensajeError = 'No se encontraron planeaciones para esta ficha.';
    } else if (error.message.includes('Network Error')) {
      mensajeError = 'Error de conexión. Verifica que el servidor esté en ejecución.';
    } else {
      mensajeError = `Error: ${error.message}`;
    }

    setMensajeModal(mensajeError);
    setMostrarModalError(true);
  };

  useEffect(() => {
    logger.debug('🔄 fichaInfo actualizado:', fichaInfo);
  }, [fichaInfo]);

  useEffect(() => {
    logger.debug('🆔 idFicha desde params:', idFicha);
  }, [idFicha]);

  useEffect(() => {
    const load = async () => {
      try {
        await cargarPlaneaciones();
      } catch (error) {
        logger.error('❌ Error cargando planeaciones:', error);

        if (error.message.includes('500') && idFicha) {
          setMensajeModal(
            'Error interno del servidor. El servicio de planeaciones no está disponible temporalmente. Por favor, intente más tarde.',
          );
          setMostrarModalError(true);
          return;
        }

        mostrarErrorCarga(error);
      }
    };

    load();

    if (idFicha) {
      cargarInfoFicha(idFicha);
    }
  }, [idFicha, cargarPlaneaciones, cargarInfoFicha]);

  const handleCerrarVista = () => {
    setMostrarVista(false);
    setPlaneacionSeleccionada(null);
  };

  const handleNuevaPlaneacion = () => {
    setModoEdicion(false);
    setPlaneacionEnEdicion(null);
    setMostrarFormulario(true);
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
    setPlaneacionEnEdicion(null);
    setAvisoReconciliacionEdicion(null);
  };

  const handleEditarPlaneacion = async (planeacion) => {
    const idPlaneacion = planeacion.id_planeacion || planeacion.id;
    setCargandoEdicion(idPlaneacion);

    try {
      const respuesta = await planeacionService.obtenerPlaneacionPorId(idPlaneacion);
      const data = respuesta?.data ?? respuesta;
      const reconciliacionResp = respuesta?.reconciliacion;

      if (reconciliacionResp?.archivados_con_contenido > 0) {
        setAvisoReconciliacionEdicion(
          `Se archivaron ${reconciliacionResp.archivados_con_contenido} planeaciones de RAPs que ya no están en la sábana`,
        );
      } else {
        setAvisoReconciliacionEdicion(null);
      }

      if (!data?.detalles?.length) {
        throw new Error('La planeación no tiene detalles editables (falta id_detalle en el servidor)');
      }

      const sinIdDetalle = data.detalles.some((detalle) => !detalle.id_detalle);
      if (sinIdDetalle) {
        throw new Error('El servidor no devolvió id_detalle en todos los RAPs. No es posible editar.');
      }

      setPlaneacionEnEdicion(data);
      setModoEdicion(true);
      setMostrarFormulario(true);
    } catch (error) {
      logger.error('❌ Error cargando planeación para editar:', error);
      setMensajeModal(error.message || 'No se pudo cargar la planeación para editar');
      setMostrarModalError(true);
    } finally {
      setCargandoEdicion(null);
    }
  };

  const handleSolicitarEliminacion = (idPlaneacion) => {
    setPlaneacionAEliminar(idPlaneacion);
    setMostrarModalConfirmacion(true);
  };

  const handleExportarExcel = async (planeacion) => {
    const idPlaneacion = planeacion.id_planeacion || planeacion.id;
    const idFichaExport = planeacion.id_ficha || idFicha;
    const idTrimestreExport = planeacion.id_trimestre;

    if (!idFichaExport) {
      setMensajeModal('No se pudo determinar la ficha para exportar la planeación.');
      setMostrarModalError(true);
      return;
    }

    setExportando(idPlaneacion);

    try {
      await planeacionService.exportarPlaneacionExcel(idFichaExport, idTrimestreExport);
    } catch (error) {
      logger.error('❌ Error exportando planeación a Excel:', error);
      setMensajeModal(error.message || 'No se pudo exportar la planeación a Excel');
      setMostrarModalError(true);
    } finally {
      setExportando(null);
    }
  };

  const handleConfirmarEliminacion = async () => {
    if (!planeacionAEliminar) return;

    try {
      const resultado = await eliminarPlaneacion(planeacionAEliminar);

      if (resultado.success) {
        setMensajeModal('Planeación eliminada exitosamente');
        setMostrarModalExito(true);
      } else {
        setMensajeModal(`Error al eliminar la planeación: ${resultado.mensaje}`);
        setMostrarModalError(true);
      }
    } catch (error) {
      logger.error('❌ Error eliminando planeación:', error);
      setMensajeModal(`Error al eliminar la planeación: ${error.message}`);
      setMostrarModalError(true);
    } finally {
      setPlaneacionAEliminar(null);
      setMostrarModalConfirmacion(false);
    }
  };

  const handleCancelarEliminacion = () => {
    setPlaneacionAEliminar(null);
    setMostrarModalConfirmacion(false);
  };

  const handlePlaneacionGuardada = () => {
    cargarPlaneaciones().catch(mostrarErrorCarga);
    setMostrarFormulario(false);
    setModoEdicion(false);
    setPlaneacionEnEdicion(null);
  };

  const usuarioPuedeEditar = puedeEditarFicha(user);

  const handleCierreModalExito = () => {
    setMostrarModalExito(false);
  };

  const handleCierreModalError = () => {
    setMostrarModalError(false);
  };

  if (mostrarFormulario) {
    return (
      <Layout showSidebar fichaInfo={fichaInfo}>
        <NuevaPlaneacionForm
          onCancel={handleCancelar}
          onPlaneacionGuardada={handlePlaneacionGuardada}
          idFicha={idFicha}
          fichaInfo={fichaInfo}
          modoEdicion={modoEdicion}
          planeacionInicial={planeacionEnEdicion}
          avisoReconciliacion={avisoReconciliacionEdicion}
        />
      </Layout>
    );
  }

  if (mostrarVista && planeacionSeleccionada) {
    return (
      <Layout showSidebar fichaInfo={fichaInfo}>
        <VistaPlaneacion
          planeacion={planeacionSeleccionada}
          onClose={handleCerrarVista}
          user={user}
        />
      </Layout>
    );
  }

  return (
    <Layout showSidebar fichaInfo={fichaInfo}>
      {mostrarModalExito && (
        <ModalExito
          onClose={handleCierreModalExito}
          titulo="¡Operación Exitosa!"
          mensaje={mensajeModal}
          textoBoton="Continuar"
        />
      )}

      {mostrarModalError && (
        <ModalError
          onClose={handleCierreModalError}
          titulo="Error"
          mensaje={mensajeModal}
          textoBoton="Entendido"
        />
      )}

      {mostrarModalConfirmacion && (
        <ModalConfirmacion
          onClose={handleCancelarEliminacion}
          onConfirm={handleConfirmarEliminacion}
          titulo="Confirmar Eliminación"
          mensaje="¿Estás seguro de que quieres eliminar esta planeación? Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
        />
      )}

      <div className="planeacion-content-centered">
        <div className="planeacion-header-nav">
          <button type="button" className="btn-volver" onClick={volverASabana}>
            <span className="arrow-left">←</span>
            Volver a Sábana
          </button>
          <div className="header-info-nav">
            <h1 className="title-nav">Planeación Pedagógica</h1>
            <div className="subtitle-nav">
              {idFicha ? `Ficha ${idFicha} • ` : ''}
              {loading ? 'Cargando...' : `${planeaciones.length} planeaciones`}
              {cargandoFicha && ' • Cargando información de ficha...'}
            </div>
          </div>
          <button type="button" className="btn-generar" onClick={handleNuevaPlaneacion}>
            <span className="plus-icon">+</span>
            Generar planeación pedagógica
          </button>
        </div>

        {reconciliacion?.archivados_con_contenido > 0 && (
          <div className="aviso-reconciliacion" role="status">
            Se archivaron {reconciliacion.archivados_con_contenido} planeaciones de RAPs que ya no
            están en la sábana
          </div>
        )}

        <div className="planeaciones-list">
          {loading ? (
            <div className="loading-state">
              <p>Cargando planeaciones...</p>
            </div>
          ) : planeaciones.length === 0 ? (
            <div className="empty-state">
              <p>No hay planeaciones guardadas aún.</p>
              {idFicha && fichaInfo && (
                <p className="ficha-info-hint" />
              )}
            </div>
          ) : (
            Array.isArray(planeaciones) && planeaciones.map((planeacion) => {
              const trimestre = extraerTrimestreDeObservaciones(planeacion.observaciones);

              return (
                <div key={planeacion.id_planeacion || planeacion.id} className="planeacion-card">
                  <div className="planeacion-main-content">
                    <div className="planeacion-left">
                      <div className="planeacion-title-row">
                        <h3>Trimestre {trimestre}</h3>
                        <span className={`estado-badge ${planeacion.estado || 'publicada'}`}>
                          {planeacion.estado || 'Publicada'}
                        </span>
                      </div>

                      <p className="planeacion-description">
                        Planeación pedagógica para el trimestre {trimestre} con {planeacion.total_raps || planeacion.raps_count || 0} RAPs
                      </p>

                      <div className="planeacion-meta">
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {user?.nombre || user?.username || 'Instructor'}
                        </span>
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          Creado: {new Date(planeacion.fecha_creacion).toLocaleDateString()}
                        </span>
                        <span className="meta-item">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Modificado: {new Date(planeacion.fecha_actualizacion || planeacion.fecha_creacion).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="planeacion-actions">
                      <button
                        type="button"
                        className="btn-icon btn-exportar"
                        title="Exportar Excel"
                        onClick={() => handleExportarExcel(planeacion)}
                        disabled={exportando === (planeacion.id_planeacion || planeacion.id)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="12" y1="18" x2="12" y2="12" />
                          <polyline points="9 15 12 18 15 15" />
                        </svg>
                        {exportando === (planeacion.id_planeacion || planeacion.id)
                          ? 'Exportando...'
                          : 'Exportar Excel'}
                      </button>
                      {usuarioPuedeEditar && (
                        <button
                          type="button"
                          className="btn-icon btn-editar"
                          title="Editar"
                          onClick={() => handleEditarPlaneacion(planeacion)}
                          disabled={cargandoEdicion === (planeacion.id_planeacion || planeacion.id)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          {cargandoEdicion === (planeacion.id_planeacion || planeacion.id)
                            ? 'Cargando...'
                            : 'Editar'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-icon btn-eliminar"
                        title="Eliminar"
                        onClick={() => handleSolicitarEliminacion(planeacion.id_planeacion || planeacion.id)}
                        disabled={eliminando === (planeacion.id_planeacion || planeacion.id)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        {eliminando === (planeacion.id_planeacion || planeacion.id) ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};
