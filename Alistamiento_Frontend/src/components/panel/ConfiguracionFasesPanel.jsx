import { useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '../../utils/logger';
import { ModalFaseConfig } from '../ui/ModalFaseConfig';
import { ModalError } from '../ui/ModalError';
import { ModalExito } from '../ui/ModalExito';
import { ModalConfirmacion } from '../ui/ModalConfirmacion';
import {
  listarFasesConfig,
  crearFaseConfig,
  actualizarFaseConfig,
  eliminarFaseConfig,
} from '../../services/fasesConfiguracionService';

const JORNADAS_FILTRO = ['', 'Diurna', 'Nocturna', 'Personalizada'];

export const ConfiguracionFasesPanel = () => {
  const [fases, setFases] = useState([]);
  const [jornadaFiltro, setJornadaFiltro] = useState('Diurna');
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [faseSeleccionada, setFaseSeleccionada] = useState(null);
  const [faseAEliminar, setFaseAEliminar] = useState(null);

  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');

  const mostrarError = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarModalError(true);
  };

  const mostrarExito = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarModalExito(true);
  };

  const cargarFases = useCallback(async () => {
    setCargando(true);
    try {
      const data = await listarFasesConfig(jornadaFiltro || undefined);
      const ordenadas = [...data].sort((a, b) => {
        if (a.jornada !== b.jornada) {
          return a.jornada.localeCompare(b.jornada);
        }
        return a.orden - b.orden;
      });
      setFases(ordenadas);
    } catch (error) {
      logger.error('Error cargando fases de configuración:', error);
      mostrarError(error.message || 'Error al cargar fases de configuración');
    } finally {
      setCargando(false);
    }
  }, [jornadaFiltro]);

  useEffect(() => {
    cargarFases();
  }, [cargarFases]);

  const tituloFiltro = useMemo(() => {
    if (!jornadaFiltro) return 'todas las jornadas';
    return `jornada ${jornadaFiltro}`;
  }, [jornadaFiltro]);

  const abrirCrear = () => {
    setFaseSeleccionada(null);
    setModalAbierto(true);
  };

  const abrirEditar = (fase) => {
    setFaseSeleccionada(fase);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFaseSeleccionada(null);
  };

  const handleGuardar = async (payload) => {
    try {
      if (payload.id_fase_config) {
        const { id_fase_config, ...data } = payload;
        await actualizarFaseConfig(id_fase_config, data);
        mostrarExito('Fase actualizada correctamente');
      } else {
        await crearFaseConfig(payload);
        mostrarExito('Fase creada correctamente');
      }
      cerrarModal();
      await cargarFases();
    } catch (error) {
      logger.error('Error guardando fase:', error);
      mostrarError(error.message || 'Error al guardar la fase');
    }
  };

  const confirmarEliminar = async () => {
    if (!faseAEliminar) return;

    try {
      await eliminarFaseConfig(faseAEliminar.id_fase_config);
      setFaseAEliminar(null);
      mostrarExito('Fase eliminada correctamente');
      await cargarFases();
    } catch (error) {
      logger.error('Error eliminando fase:', error);
      mostrarError(error.message || 'Error al eliminar la fase');
    }
  };

  return (
    <div className="panel-seccion fases-config-panel">
      <div className="usuarios-header">
        <div>
          <h2 className="titulo-seccion">Configuración de Fases</h2>
          <p className="subtitulo">
            Administra la plantilla de fases-lanes por jornada ({tituloFiltro}).
          </p>
        </div>
        <button type="button" className="btn-crear" onClick={abrirCrear}>
          <i className="fas fa-plus" aria-hidden />
          Crear fase
        </button>
      </div>

      <div className="fases-config-filtros">
        <label className="filtro-label" htmlFor="filtro-jornada-fases">
          Filtrar por jornada
        </label>
        <select
          id="filtro-jornada-fases"
          className="filtro-select"
          value={jornadaFiltro}
          onChange={(e) => setJornadaFiltro(e.target.value)}
        >
          {JORNADAS_FILTRO.map((j) => (
            <option key={j || 'todas'} value={j}>
              {j || 'Todas'}
            </option>
          ))}
        </select>
      </div>

      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Jornada</th>
              <th>Orden</th>
              <th>Color</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6}>Cargando fases...</td>
              </tr>
            ) : fases.length === 0 ? (
              <tr>
                <td colSpan={6}>No hay fases para el filtro seleccionado.</td>
              </tr>
            ) : (
              fases.map((fase) => (
                <tr key={fase.id_fase_config}>
                  <td>{fase.nombre_fase}</td>
                  <td>{fase.jornada}</td>
                  <td>{fase.orden}</td>
                  <td>
                    <span
                      className="fase-color-swatch"
                      style={{ backgroundColor: fase.color || '#6b7280' }}
                    />
                    <span className="fase-color-code">{fase.color}</span>
                  </td>
                  <td>{fase.activo === 1 || fase.activo === true ? 'Sí' : 'No'}</td>
                  <td>
                    <div className="tabla-acciones">
                      <button
                        type="button"
                        className="btn-editar"
                        title="Editar fase"
                        onClick={() => abrirEditar(fase)}
                      >
                        <i className="fas fa-pen" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="btn-eliminar"
                        title="Eliminar fase"
                        onClick={() => setFaseAEliminar(fase)}
                      >
                        <i className="fas fa-trash" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ModalFaseConfig
        open={modalAbierto}
        onClose={cerrarModal}
        onSave={handleGuardar}
        faseSeleccionada={faseSeleccionada}
      />

      {faseAEliminar && (
        <ModalConfirmacion
          titulo="Eliminar fase"
          mensaje={`¿Eliminar la fase "${faseAEliminar.nombre_fase}" de la plantilla ${faseAEliminar.jornada}?`}
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
          onClose={() => setFaseAEliminar(null)}
          onConfirm={confirmarEliminar}
        />
      )}

      {mostrarModalError && (
        <ModalError
          onClose={() => setMostrarModalError(false)}
          titulo="Error"
          mensaje={mensajeModal}
          textoBoton="Entendido"
        />
      )}

      {mostrarModalExito && (
        <ModalExito
          onClose={() => setMostrarModalExito(false)}
          titulo="¡Operación exitosa!"
          mensaje={mensajeModal}
          textoBoton="Continuar"
        />
      )}
    </div>
  );
};
