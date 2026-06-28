import { useState, useEffect } from "react";
import { logger } from "../../utils/logger";
import "./ModalFicha.css";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import httpClient from "../../services/httpClient";
import { ModalExito } from "./ModalExito";
import { ModalError } from "./ModalError";

export const ModalFicha = ({ onClose, onSave, fichaSeleccionada, fichasExistentes }) => {
  // CAMPOS DEL FORMULARIO 
  const [cantidadTrimestre, setCantidadTrimestre] = useState(0);
  const [codigoFicha, setCodigoFicha] = useState("");
  const [codigoPrograma, setCodigoPrograma] = useState("");
  const [modalidad, setModalidad] = useState("");
  const [jornada, setJornada] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [gestor, setGestor] = useState("");

  // Estados para modales
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  // DINÁMICOS 
  const [programas, setProgramas] = useState([]);
  const [correosInstructoresDB, setCorreosInstructoresDB] = useState([]);

  // VINCULAR INSTRUCTORES 
  const [instructorEmail, setInstructorEmail] = useState("");
  const [instructorEncontrado, setInstructorEncontrado] = useState(null);
  const [instructoresVinculados, setInstructoresVinculados] = useState([]);

  // util: suma meses conservando día cuando sea posible 
  const addMonthsSafe = (dateStr, months) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    // Si al cambiar de mes se pasó (ej. 31 -> mes con 30 días), ajustar al último día válido 
    if (d.getDate() !== day) {
      d.setDate(0); // último día del mes anterior 
    }
    return d;
  };

  // estado para el min dinámico de fecha fin (string ISO yyyy-mm-dd) 
  const [minFechaFin, setMinFechaFin] = useState("");

  // Función para mostrar modal de éxito
  const mostrarExito = (mensaje) => {
    setMensajeExito(mensaje);
    setMostrarModalExito(true);
  };

  // Función para mostrar modal de error
  const mostrarError = (mensaje) => {
    setMensajeError(mensaje);
    setMostrarModalError(true);
  };

  // Cerrar modales
  const cerrarModalExito = () => setMostrarModalExito(false);
  const cerrarModalError = () => setMostrarModalError(false);

  // Función para comparar fechas sin problemas de zona horaria
  const compararFechas = (fecha1, fecha2) => {
    // Convertir ambas fechas a strings YYYY-MM-DD y comparar
    const fecha1Str = new Date(fecha1).toISOString().split('T')[0];
    const fecha2Str = new Date(fecha2).toISOString().split('T')[0];
    return fecha1Str === fecha2Str;
  };

  // Cargar instructores y programas desde la BD 
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resInstructores = await httpClient.get('/instructores');
        const resProgramas = await httpClient.get('/programas');

        // Filtrar solo instructores (excluir administradores) 
        const soloInstructores = resInstructores.data.filter(
          inst => inst.rol !== "Administrador"
        );
        setCorreosInstructoresDB(soloInstructores);
        setProgramas(resProgramas.data);

        // Si estamos editando, cargar los datos de la ficha seleccionada
        if (fichaSeleccionada) {
          cargarDatosFicha();
        }
      } catch (error) {
        logger.error("Error cargando datos:", error);
        mostrarError("Error al cargar los datos necesarios");
      }
    };
    cargarDatos();
  }, [fichaSeleccionada]);

  // Cargar datos de la ficha cuando estamos en modo edición
  const cargarDatosFicha = () => {
    setCodigoFicha(fichaSeleccionada.codigo_ficha);
    setCodigoPrograma(fichaSeleccionada.id_programa);
    setModalidad(fichaSeleccionada.modalidad);
    setJornada(fichaSeleccionada.jornada);
    setCantidadTrimestre(fichaSeleccionada.jornada === "Diurna" ? 7 : 9);
    setUbicacion(fichaSeleccionada.ubicacion);
    setFechaInicio(new Date(fichaSeleccionada.fecha_inicio).toISOString().split('T')[0]);
    setFechaFin(new Date(fichaSeleccionada.fecha_fin).toISOString().split('T')[0]);
    setGestor(fichaSeleccionada.id_instructor);

    // Calcular minFechaFin para edición
    const minFinDate = addMonthsSafe(fichaSeleccionada.fecha_inicio, 12);
    setMinFechaFin(minFinDate.toISOString().split("T")[0]);

    // Aquí deberías cargar los instructores vinculados si tienes esa información
    // setInstructoresVinculados(fichaSeleccionada.instructores || []);
  };

  // Buscar instructor por correo 
  const buscarInstructor = (correo) => {
    setInstructorEmail(correo);
    const encontrado = correosInstructoresDB.find(
      (inst) => inst.email?.toLowerCase() === correo.toLowerCase()
    );
    setInstructorEncontrado(encontrado || null);
  };

  // Agregar instructor a la ficha 
  const agregarInstructor = () => {
    if (!instructorEncontrado) return;
    if (!instructoresVinculados.some(i => i.id_instructor === instructorEncontrado.id_instructor)) {
      setInstructoresVinculados([...instructoresVinculados, instructorEncontrado]);
    }
    setInstructorEmail("");
    setInstructorEncontrado(null);
  };

  const handleJornadaChange = (e) => {
    const value = e.target.value;
    setJornada(value);
    if (value === "Diurna") setCantidadTrimestre(7);
    if (value === "Nocturna") setCantidadTrimestre(9);
  };

  // Validar si el código de ficha ya existe
  const validarCodigoUnico = (codigo) => {
    if (!fichasExistentes || !Array.isArray(fichasExistentes)) return true;

    // Si estamos editando, excluimos la ficha actual de la validación
    const fichasParaValidar = fichaSeleccionada
      ? fichasExistentes.filter(f => f.id_ficha !== fichaSeleccionada.id_ficha)
      : fichasExistentes;

    return !fichasParaValidar.some(ficha => ficha.codigo_ficha === codigo);
  };

  // Guardar ficha 
  const handleSubmit = (e) => {
    e.preventDefault();

    // VALIDACIÓN 1: Código de ficha único (solo aplica para creación)
    if (!fichaSeleccionada) {
      const codigoExiste = fichasExistentes.some(ficha =>
        ficha.codigo_ficha === codigoFicha
      );

      if (codigoExiste) {
        mostrarError(`Ya existe una ficha con el código #${codigoFicha}. No pueden existir dos fichas con el mismo número.`);
        return;
      }
    }

    // VALIDACIÓN 2: Para edición, verificar que los campos ineditables no hayan cambiado
    if (fichaSeleccionada) {
      if (codigoFicha !== fichaSeleccionada.codigo_ficha) {
        mostrarError("El código de ficha no puede ser modificado.");
        return;
      }
      if (codigoPrograma !== fichaSeleccionada.id_programa) {
        mostrarError("El programa no puede ser modificado.");
        return;
      }
      if (modalidad !== fichaSeleccionada.modalidad) {
        mostrarError("La modalidad no puede ser modificada.");
        return;
      }
      if (jornada !== fichaSeleccionada.jornada) {
        mostrarError("La jornada no puede ser modificada.");
        return;
      }

      // Validar fechas sin problemas de zona horaria
      const fechaInicioOriginal = new Date(fichaSeleccionada.fecha_inicio).toISOString().split('T')[0];
      const fechaFinOriginal = new Date(fichaSeleccionada.fecha_fin).toISOString().split('T')[0];

      if (fechaInicio !== fechaInicioOriginal) {
        mostrarError("La fecha de inicio no puede ser modificada.");
        return;
      }
      if (fechaFin !== fechaFinOriginal) {
        mostrarError("La fecha de finalización no puede ser modificada.");
        return;
      }
    }

    // Validaciones de fechas para creación
    if (!fichaSeleccionada) {
      const hoy = new Date();
      const hoyStr = hoy.toISOString().split('T')[0];
      const inicioStr = fechaInicio;

      // Convertir a timestamps para comparación
      const hoyTimestamp = new Date(hoyStr).getTime();
      const inicioTimestamp = new Date(inicioStr).getTime();

      if (inicioTimestamp < hoyTimestamp) {
        mostrarError("La fecha de inicio debe ser hoy o futura.");
        return;
      }
    }

    // mínimo 12 meses desde inicio (solo para creación)
    if (!fichaSeleccionada) {
      const minFin = addMonthsSafe(fechaInicio, 12);
      const minFinTimestamp = minFin.getTime();
      const finTimestamp = new Date(fechaFin).getTime();

      if (finTimestamp < minFinTimestamp) {
        mostrarError("La fecha de finalización debe ser al menos 12 meses después de la fecha de inicio.");
        return;
      }
    }

    const dataFicha = {
      id_programa: codigoPrograma,
      codigo_ficha: codigoFicha,
      modalidad,
      jornada,
      ambiente: ubicacion,
      fecha_inicio: fechaInicio,
      fecha_final: fechaFin,
      cantidad_trimestre: cantidadTrimestre,
      id_instructor: gestor,
      instructores: instructoresVinculados.map(i => i.id_instructor)
    };

    if (fichaSeleccionada) {
      dataFicha.id_ficha = fichaSeleccionada.id_ficha;
    }

    onSave(dataFicha);
    mostrarExito(fichaSeleccionada ? "Ficha actualizada exitosamente" : "Ficha creada exitosamente");
  };

  return (
    <>
      {/* Modal de éxito y error */}
      {mostrarModalExito && (
        <ModalExito
          onClose={() => {
            cerrarModalExito();
            onClose();
          }}
          mensaje={mensajeExito}
        />
      )}

      {mostrarModalError && (
        <ModalError
          onClose={cerrarModalError}
          mensaje={mensajeError}
        />
      )}

      {/* Modal principal */}
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <h3 className="modal-title">
            {fichaSeleccionada ? "Editar Ficha" : "Crear Nueva Ficha"}
          </h3>
          <p className="modal-subtitle">
            {fichaSeleccionada ? "Modifica la información editable de la ficha." : "Completa la información de la ficha de formación."}
          </p>
          <form onSubmit={handleSubmit}>
            {/* Código ficha / programa */}
            <div className="grid-2">
              <div className="form-group">
                <label>Código de la Ficha*</label>
                <input
                  type="text"
                  placeholder="Ej: 2669742"
                  value={codigoFicha}
                  maxLength={7}
                  required
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) setCodigoFicha(value);
                  }}
                  disabled={fichaSeleccionada} // Deshabilitado en edición
                  className={fichaSeleccionada ? "disabled-input" : ""}
                />
                {fichaSeleccionada && <small className="disabled-note">No editable</small>}
              </div>
              <div className="form-group">
                <label>Programa*</label>
                <div className="select-box">
                  <select
                    value={codigoPrograma}
                    onChange={(e) => setCodigoPrograma(e.target.value)}
                    required
                    disabled={fichaSeleccionada}
                    className={fichaSeleccionada ? "disabled-input" : ""}
                  >
                    <option value="">Seleccionar programa</option>
                    {programas.map((p) => (
                      <option key={p.id_programa} value={p.id_programa}>
                        {p.nombre_programa}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="icon" size={18} />
                </div>
                {fichaSeleccionada && <small className="disabled-note">No editable</small>}
              </div>
            </div>

            {/* Modalidad / jornada */}
            <div className="grid-2">
              <div className="form-group">
                <label>Modalidad*</label>
                <div className="select-box">
                  <select
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value)}
                    required
                    disabled={fichaSeleccionada}
                    className={fichaSeleccionada ? "disabled-input" : ""}
                  >
                    <option value="">Seleccionar modalidad</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                  </select>
                  <ChevronDown className="icon" size={18} />
                </div>
                {fichaSeleccionada && <small className="disabled-note">No editable</small>}
              </div>
              <div className="form-group">
                <label>Jornada*</label>
                <div className="select-box">
                  <select
                    value={jornada}
                    onChange={handleJornadaChange}
                    required
                    disabled={fichaSeleccionada}
                    className={fichaSeleccionada ? "disabled-input" : ""}
                  >
                    <option value="">Seleccionar jornada</option>
                    <option value="Diurna">Diurna</option>
                    <option value="Nocturna">Nocturna</option>
                  </select>
                  <ChevronDown className="icon" size={18} />
                </div>
                {fichaSeleccionada && <small className="disabled-note">No editable</small>}
              </div>
            </div>

            {/* Ubicación / Fecha */}
            <div className="grid-2">
              <div className="form-group">
                <label>Ambiente*</label>
                <input
                  type="text"
                  placeholder="Ej: 301"
                  value={ubicacion}
                  maxLength={3}
                  required
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) setUbicacion(value);
                  }}
                />
              </div>
              <div className="form-group">
                <label>Fecha de Inicio*</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => {
                    if (!fichaSeleccionada) {
                      const valor = e.target.value;
                      setFechaInicio(valor);
                      // calcular min para fechaFin: fechaInicio + 12 meses 
                      if (valor) {
                        const minFinDate = addMonthsSafe(valor, 12);
                        const minFinStr = minFinDate.toISOString().split("T")[0];
                        setMinFechaFin(minFinStr);
                        // si ya hay fechaFin y es menor al mínimo, actualizarla al mínimo 
                        if (fechaFin) {
                          const finActual = new Date(fechaFin);
                          finActual.setHours(0, 0, 0, 0);
                          const minFinCheck = new Date(minFinStr);
                          minFinCheck.setHours(0, 0, 0, 0);
                          if (finActual < minFinCheck) {
                            setFechaFin(minFinStr);
                          }
                        }
                      } else {
                        // si se quita fechaInicio, recalcular minFechaFin con hoy + 12 meses (opcional) 
                        const hoy = new Date();
                        hoy.setHours(0, 0, 0, 0);
                        const minDesdeHoy = addMonthsSafe(hoy.toISOString().split("T")[0], 12);
                        setMinFechaFin(minDesdeHoy.toISOString().split("T")[0]);
                      }
                    }
                  }}
                  required
                  min={!fichaSeleccionada ? new Date().toISOString().split("T")[0] : undefined}
                  disabled={fichaSeleccionada}
                  className={fichaSeleccionada ? "disabled-input" : ""}
                />
                {fichaSeleccionada && <small className="disabled-note">No editable</small>}
              </div>
            </div>

            <div className="form-group">
              <label>Fecha de Finalización*</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => !fichaSeleccionada && setFechaFin(e.target.value)}
                required
                min={!fichaSeleccionada ? (minFechaFin || new Date().toISOString().split("T")[0]) : undefined}
                disabled={fichaSeleccionada}
                className={fichaSeleccionada ? "disabled-input" : ""}
              />
              {fichaSeleccionada && <small className="disabled-note">No editable</small>}
            </div>

            {/* Resto del código permanece igual... */}
            {/* Asignar Gestor */}
            <h4 className="section-title">Añadir Gestor</h4>
            <p className="section-text">
              Selecciona un instructor que será asignado como Gestor de la ficha.
            </p>
            <div className="form-group">
              <label>Seleccionar instructor para gestor</label>
              <div className="select-box">
                <select value={gestor} onChange={(e) => setGestor(e.target.value)} required >
                  <option value="">Seleccionar instructor para gestor</option>
                  {correosInstructoresDB.map((inst) => (
                    <option key={inst.id_instructor} value={inst.id_instructor}>
                      {inst.nombre} ({inst.email})
                    </option>
                  ))}
                </select>
                <ChevronDown className="icon" size={18} />
              </div>
            </div>

            {/* Vincular Instructores */}
            <h4 className="section-title">Vincular Instructores</h4>
            <p className="section-text">
              Escribe el correo del instructor registrado.
            </p>
            <div className="add-instructor-box">
              <input type="email" placeholder="instructor@sena.edu.co" value={instructorEmail} onChange={(e) => buscarInstructor(e.target.value)} />
              <button type="button" className="add-btn" disabled={!instructorEncontrado} onClick={agregarInstructor} >
                <Plus size={18} />
                Añadir
              </button>
            </div>

            {instructorEncontrado && (
              <p style={{ fontSize: "13px", color: "#007bff" }}>
                Instructor encontrado: <strong>{instructorEncontrado.nombre}</strong>
              </p>
            )}

            {instructoresVinculados.length > 0 && (
              <div>
                <p className="section-text">
                  <strong>Instructores vinculados ({instructoresVinculados.length}):</strong>
                </p>
                <ul className="instructor-list">
                  {instructoresVinculados.map((inst) => (
                    <li key={inst.id_instructor}>
                      {inst.nombre} – {inst.email}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Botones */}
            <div className="modal-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="create-btn">
                {fichaSeleccionada ? "Guardar Cambios" : "Crear Ficha"}
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Modal de Error */}
      {mostrarModalError && (
        <div className="modal-error-overlay" onClick={cerrarModalError}>
          <div className="modal-error-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-error-title">Error</h3>
            <p style={{ marginBottom: '20px', color: '#555' }}>{mensajeError}</p>
            <div className="modal-error-buttons">
              <button
                className="btn-cerrar-error"
                onClick={cerrarModalError}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {mostrarModalExito && (
        <div className="modal-exito-overlay" onClick={() => {
          cerrarModalExito();
          onClose();
        }}>
          <div className="modal-exito-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-exito-title">¡Éxito!</h3>
            <p style={{ marginBottom: '20px', color: '#555' }}>{mensajeExito}</p>
            <div className="modal-exito-buttons">
              <button
                className="btn-cerrar-exito"
                onClick={() => {
                  cerrarModalExito();
                  onClose();
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};