import { useState, useEffect } from "react";
import { logger } from "../utils/logger";
import { ModalUsuario } from "../components/ui/ModalUsuario";
import { ModalPrograma } from "../components/ui/ModalPrograma";
import { ModalFicha } from "../components/ui/ModalFicha";
import { ModalExito } from "../components/ui/ModalExito";
import { ModalError } from "../components/ui/ModalError";
import { ModalConfirmacion } from "../components/ui/ModalConfirmacion";
import { Layout } from "../components/layout/Layout";
import { useAuthContext } from "../context/AuthContext";
import { tienePermiso } from "../utils/permisos";
import { useUsuarios } from "../hooks/useUsuarios";
import { useProgramas } from "../hooks/useProgramas";
import { useFichas } from "../hooks/useFichas";
import { leerRolesAsignables } from "../services/rolService";
import "./Pagina.css";

export const UsuariosPagina = () => {
  const { user } = useAuthContext();
  const puedeGestionarInstructores = tienePermiso(user, 'instructor.crear');
  const [seccionActiva, setSeccionActiva] = useState("instructores");
  const { usuarios, debugInfo, guardarUsuario, eliminarUsuarioPorId } = useUsuarios();
  const { programas, cargarProgramas, eliminarPrograma } = useProgramas();
  const {
    fichas,
    cargarFichas,
    guardarFichaEnApi,
    eliminarFichaEnApi,
  } = useFichas({ autoLoad: false });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [rolesAsignables, setRolesAsignables] = useState([]);
  const [mostrarModalPrograma, setMostrarModalPrograma] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);

  // Estados para modales de éxito y error
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');
  const [elementoAEliminar, setElementoAEliminar] = useState(null);
  const [tipoAccion, setTipoAccion] = useState('');

  // Función para mostrar modal de éxito
  const mostrarExito = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarModalExito(true);
  };

  // Función para mostrar modal de error
  const mostrarError = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarModalError(true);
  };

  // Función para mostrar modal de confirmación
  const mostrarConfirmacion = (mensaje, tipo, elementoId = null) => {
    setMensajeModal(mensaje);
    setTipoAccion(tipo);
    setElementoAEliminar(elementoId);
    setMostrarModalConfirmacion(true);
  };

  // Cerrar modales
  const cerrarModalExito = () => setMostrarModalExito(false);
  const cerrarModalError = () => setMostrarModalError(false);
  const cerrarModalConfirmacion = () => setMostrarModalConfirmacion(false);

  // Ejecutar acción confirmada
  const ejecutarAccionConfirmada = async () => {
    try {
      if (tipoAccion === 'eliminarInstructor') {
        await eliminarUsuarioPorId(elementoAEliminar);
        mostrarExito("Instructor eliminado exitosamente");
      } else if (tipoAccion === 'eliminarPrograma') {
        await handleEliminarPrograma(elementoAEliminar);
      } else if (tipoAccion === 'eliminarFicha') {
        await handleEliminarFicha(elementoAEliminar);
      }
    } catch (error) {
      logger.error("Error ejecutando acción:", error);
      mostrarError("Error al realizar la operación");
    }
    cerrarModalConfirmacion();
  };

  // Edición de Fichas
  const abrirModalFicha = (ficha) => {
    setFichaSeleccionada(ficha);
    setModalAbierto(true);
  };

  const cerrarModalFicha = () => {
    setFichaSeleccionada(null);
    setModalAbierto(false);
  };

  // Cargar roles asignables según el actor autenticado
  useEffect(() => {
    if (!puedeGestionarInstructores) return undefined;

    leerRolesAsignables()
      .then((roles) => setRolesAsignables(Array.isArray(roles) ? roles : []))
      .catch((error) => {
        logger.error('Error cargando roles asignables:', error);
        mostrarError(error.response?.data?.error || error.message || 'No se pudieron cargar los roles asignables');
      });

    return undefined;
  }, [puedeGestionarInstructores]);

  // Cargar FICHAS desde el backend
  useEffect(() => {
    if (seccionActiva === "fichas") {
      cargarFichas().catch((error) => {
        logger.error("Error cargando fichas:", error);
        mostrarError("Error al cargar las fichas");
      });
    }
  }, [seccionActiva, cargarFichas]);

  const abrirModal = (usuario = null) => {
    setUsuarioSeleccionado(usuario);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setUsuarioSeleccionado(null);
  };

  const handleGuardarUsuario = async (usuarioNormalizado, modoEdicion) => {
    const correo = usuarioNormalizado.email.trim().toLowerCase();
    const cedula = String(usuarioNormalizado.cedula).trim();

    const correoExistente = usuarios.some((u) => {
      if (!u.email) return false;
      if (modoEdicion && u.id_instructor === usuarioNormalizado.id_instructor) return false;
      return u.email.toLowerCase().trim() === correo;
    });

    if (correoExistente) {
      mostrarError('Este correo electrónico ya está registrado en el sistema.');
      return;
    }

    const cedulaExistente = usuarios.some((u) => {
      if (!u.cedula) return false;
      if (modoEdicion && u.id_instructor === usuarioNormalizado.id_instructor) return false;
      return String(u.cedula).trim() === cedula;
    });

    if (cedulaExistente) {
      mostrarError('Esta cédula ya está registrada en el sistema. Por favor, verifica el número.');
      return;
    }

    try {
      await guardarUsuario(usuarioNormalizado, modoEdicion);
      mostrarExito(modoEdicion ? 'Instructor actualizado exitosamente' : 'Instructor creado exitosamente');
      cerrarModal();
    } catch (error) {
      logger.error('Error guardando instructor:', error);
      mostrarError(error.message || 'Error al guardar usuario');
    }
  };

  const handleEliminarPrograma = async (id) => {
    try {
      const result = await eliminarPrograma(id);
      mostrarExito(result.mensaje || "Programa eliminado exitosamente");
    } catch (error) {
      logger.error('Error al eliminar programa:', error);
      mostrarError(`Error al eliminar programa: ${error.message}`);
    }
  };

  const handleGuardarPrograma = async () => {
    try {
      setMostrarModalPrograma(false);
      await cargarProgramas();
      mostrarExito("Programa creado exitosamente");
    } catch (error) {
      logger.error("Error recargando programas:", error);
      mostrarError("El programa se creó pero hubo un error al recargar la lista");
    }
  };

  const guardarFicha = async (ficha) => {
    try {
      const esEdicion = !!ficha.id_ficha;

      const fichaData = {
        id_programa: ficha.id_programa,
        codigo_ficha: ficha.codigo_ficha,
        modalidad: ficha.modalidad,
        jornada: ficha.jornada,
        ambiente: ficha.ambiente,
        fecha_inicio: ficha.fecha_inicio,
        fecha_final: ficha.fecha_final,
        cantidad_trimestre: ficha.cantidad_trimestre ?? 3,
        gestor: ficha.gestor ?? ficha.id_instructor ?? null,
        instructores: ficha.instructores || [],
      };

      if (fichaSeleccionada) {
        fichaData.id_ficha = fichaSeleccionada.id_ficha;
      }

      const { resultado } = await guardarFichaEnApi(fichaData);
      mostrarExito(esEdicion ? "Ficha actualizada exitosamente" : "Ficha creada exitosamente");
      return resultado;
    } catch (error) {
      logger.error("❌ Error guardando ficha:", error);
      mostrarError(`Error al guardar ficha: ${error.message}`);
      throw error;
    }
  };

  const handleEliminarFicha = async (idFicha) => {
    try {
      await eliminarFichaEnApi(idFicha);
      mostrarExito("Ficha eliminada correctamente");
    } catch (error) {
      logger.error("Error eliminando ficha:", error);
      mostrarError(`Error al eliminar ficha: ${error.message}`);
    }
  };

  // Obtener nombre del programa por ID
  const obtenerNombrePrograma = (idPrograma) => {
    const programa = programas.find(p => p.id_programa == idPrograma);
    return programa ? programa.nombre_programa : "Programa no encontrado";
  };

  return (
    <Layout>
      <div className="usuarios-container">
        {/* Para depuración (puedes eliminar esto después) */}
        <div style={{ display: 'none' }}>
          <h4>Depuración - Usuarios existentes:</h4>
          <pre style={{ fontSize: '10px', background: '#f5f5f5', padding: '10px' }}>
            {debugInfo || 'No hay usuarios cargados'}
          </pre>
        </div>

        {/* MENU DE SECCIONES CON ANIMACIÓN */}
        <div className="menu-secciones-animadas">
          <div
            className={`tab ${seccionActiva === "instructores" ? "activo" : ""}`}
            onClick={() => setSeccionActiva("instructores")}
          >
            <i className="fas fa-user"></i>
            <span>Instructores</span>
          </div>
          <div
            className={`tab ${seccionActiva === "programas" ? "activo" : ""}`}
            onClick={() => setSeccionActiva("programas")}
          >
            <i className="fas fa-graduation-cap"></i>
            <span>Programas</span>
          </div>
          <div
            className={`tab ${seccionActiva === "fichas" ? "activo" : ""}`}
            onClick={() => setSeccionActiva("fichas")}
          >
            <i className="fas fa-file-alt"></i>
            <span>Fichas</span>
          </div>
        </div>

        {/* SECCIÓN INSTRUCTORES */}
        {seccionActiva === "instructores" && (
          <>
            <div className="usuarios-header">
              <div>
                <h2 className="titulo-seccion">Gestión de Instructores</h2>
                <p className="subtitulo">
                  Administra instructores, gestores y administradores del sistema.
                </p>
              </div>

              <button className="btn-crear" onClick={() => abrirModal()} disabled={!puedeGestionarInstructores}>
                <i className="fas fa-user-plus"></i> Crear Instructor
              </button>
            </div>

            <div className="usuarios-lista">
              {usuarios.filter(u => u.rol !== "Administrador").length === 0 ? (
                <p>No hay instructores registrados en el sistema.</p>
              ) : (
                usuarios
                  .filter(u => u.rol !== "Administrador")
                  .map((u) => (
                    <div key={u.id_instructor} className="usuario-card">
                      <div className="usuario-info">
                        <h4>{u.nombre}</h4>
                        <p><strong>Correo:</strong> {u.email}</p>
                      </div>
                      <div className="acciones-card">
                        <button
                          className="btn-editar"
                          onClick={() => abrirModal(u)}
                          title="Editar instructor"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        <button
                          className="btn-eliminar"
                          onClick={() => mostrarConfirmacion(
                            "¿Estás seguro de que deseas eliminar este instructor? Esta acción no se puede deshacer.",
                            'eliminarInstructor',
                            u.id_instructor
                          )}
                          title="Eliminar instructor"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {mostrarModal && puedeGestionarInstructores && (
              <ModalUsuario
                onClose={cerrarModal}
                onSave={handleGuardarUsuario}
                usuarioSeleccionado={usuarioSeleccionado}
                rolesAsignables={rolesAsignables}
              />
            )}
          </>
        )}

        {/* SECCIÓN PROGRAMAS */}
        {seccionActiva === "programas" && (
          <>
            <div className="usuarios-header">
              <div>
                <h2 className="titulo-seccion">Gestión de Programas</h2>
                <p className="subtitulo">
                  Administra los programas de formación del sistema.
                </p>
              </div>

              <button
                className="btn-crear"
                onClick={() => setMostrarModalPrograma(true)}
              >
                <i className="fas fa-book-open"></i> Crear Programa
              </button>
            </div>

            <div className="usuarios-lista">
              {programas.length === 0 ? (
                <p>No hay programas registrados.</p>
              ) : (
                programas.map((p) => (
                  <div key={p.id_programa} className="usuario-card">
                    <div className="usuario-info">
                      <h4>{p.nombre_programa}</h4>
                      <p><strong>Código:</strong> {p.codigo_programa}</p>
                      <p><strong>Fichas Asociadas:</strong> {p.total_fichas}</p>
                    </div>
                    <div className="acciones-card">
                      <button
                        className="btn-eliminar"
                        onClick={() => mostrarConfirmacion(
                          "¿Estás seguro de que deseas eliminar este programa? Esta acción eliminará todas las fichas asociadas.",
                          'eliminarPrograma',
                          p.id_programa
                        )}
                        title="Eliminar programa"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {mostrarModalPrograma && (
              <ModalPrograma
                onClose={() => setMostrarModalPrograma(false)}
                onSave={handleGuardarPrograma}
              />
            )}
          </>
        )}

        {/* SECCIÓN FICHAS */}
        {seccionActiva === "fichas" && (
          <div className="fichas-seccion">
            <div className="usuarios-header">
              <div>
                <h2 className="titulo-seccion">Gestión de Fichas</h2>
                <p className="subtitulo">
                  Administra las fichas activas de los programas de formación.
                </p>
              </div>

              <button className="btn-crear" onClick={() => { abrirModalFicha(null) }}>
                <i className="fas fa-folder-plus"></i> Crear Ficha
              </button>
            </div>

            <div className="usuarios-lista">
              {fichas.length === 0 ? (
                <p>No hay fichas registradas.</p>
              ) : (
                fichas.map((ficha) => (
                  <div key={ficha.id_ficha} className="usuario-card">
                    <div className="usuario-info">
                      <h4>Ficha #{ficha.codigo_ficha}</h4>
                      <p><strong>Programa:</strong> {ficha.nombre_programa || obtenerNombrePrograma(ficha.id_programa)}</p>
                      <p><strong>Modalidad:</strong> {ficha.modalidad}</p>
                      <p><strong>Jornada:</strong> {ficha.jornada}</p>
                      <p><strong>Ambiente:</strong> {ficha.ubicacion}</p>
                      <p><strong>Fecha Inicio:</strong> {new Date(ficha.fecha_inicio).toLocaleDateString()}</p>
                      <p><strong>Fecha Fin:</strong> {new Date(ficha.fecha_fin).toLocaleDateString()}</p>
                    </div>

                    <div className="acciones-card">
                      <button
                        className="btn-editar"
                        onClick={() => { abrirModalFicha(ficha) }}
                        title="Editar ficha"
                      >
                        <i className="fas fa-pen"></i>
                      </button>

                      <button
                        className="btn-eliminar"
                        onClick={() => mostrarConfirmacion(
                          "¿Estás seguro de que deseas eliminar esta ficha? Esta acción no se puede deshacer.",
                          'eliminarFicha',
                          ficha.id_ficha
                        )}
                        title="Eliminar ficha"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {modalAbierto && (
              <ModalFicha
                fichaSeleccionada={fichaSeleccionada}
                fichasExistentes={fichas} // Pasar las fichas existentes
                onClose={() => { cerrarModalFicha(); }}
                onSave={async (nuevaFicha) => {
                  await guardarFicha(nuevaFicha);
                  setModalAbierto(false);
                }}
              />
            )}
          </div>
        )}

        {/* MODALES DE ÉXITO Y ERROR */}
        {mostrarModalExito && (
          <ModalExito
            onClose={cerrarModalExito}
            titulo="¡Operación Exitosa!"
            mensaje={mensajeModal}
            textoBoton="Continuar"
          />
        )}

        {mostrarModalError && (
          <ModalError
            onClose={cerrarModalError}
            titulo="Error"
            mensaje={mensajeModal}
            textoBoton="Entendido"
          />
        )}

        {/* MODAL DE CONFIRMACIÓN */}
        {mostrarModalConfirmacion && (
          <ModalConfirmacion
            onClose={cerrarModalConfirmacion}
            onConfirm={ejecutarAccionConfirmada}
            titulo="Confirmar Eliminación"
            mensaje={mensajeModal}
            textoConfirmar="Eliminar"
            textoCancelar="Cancelar"
          />
        )}
      </div>
    </Layout>
  );
};