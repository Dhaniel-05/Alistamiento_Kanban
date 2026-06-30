// src/pages/planeacion/components/NuevaPlaneacionForm.jsx
import { useState, useEffect, useRef } from "react";
import { logger } from "../../../utils/logger";
import { planeacionService } from "../../../services/planeacionService";
import { useAuthContext } from "../../../context/AuthContext";
import { ModalExito } from "../../../components/ui/ModalExito";
import { ModalError } from "../../../components/ui/ModalError";
import { ModalConfirmacion } from "../../../components/ui/ModalConfirmacion";
import "./NuevaPlaneacionForm.css";
import { obtenerInstructorPorRAP } from "../../../services/sabanaService";

const mapDetalleARap = (detalle) => ({
  id: detalle.id_rap,
  id_detalle: detalle.id_detalle,
  codigo: detalle.codigo_rap,
  nombre: detalle.nombre_rap,
  competencia: detalle.competencia,
  horas_trimestre: detalle.horas_trimestre,
  saberes_conceptos: detalle.saberes_conceptos,
  saberes_proceso: detalle.saberes_proceso,
  criterios_evaluacion: detalle.criterios_evaluacion,
  instructor: null,
  datos: {
    fechaElaboracion: new Date().toISOString().split("T")[0],
    actividadesAprendizaje: detalle.actividades_aprendizaje || "",
    duracionDirecta: detalle.duracion_directa ?? "",
    duracionIndependiente: detalle.duracion_independiente ?? "",
    descripcionEvidencia: detalle.descripcion_evidencia || "",
    estrategiasDidacticas: detalle.estrategias_didacticas || "",
    ambientesAprendizaje: detalle.ambientes_aprendizaje || "",
    materialesFormacion: detalle.materiales_formacion || "",
    observaciones: detalle.observaciones || "",
  },
  expandido: true,
});

const evaluarCompletitudRap = (rap) => {
  const datos = rap.datos;
  return (
    datos.actividadesAprendizaje.trim() !== "" &&
    datos.descripcionEvidencia.trim() !== "" &&
    datos.estrategiasDidacticas !== "" &&
    datos.ambientesAprendizaje !== "" &&
    datos.materialesFormacion.trim() !== ""
  );
};

export const NuevaPlaneacionForm = ({
  onCancel,
  onPlaneacionGuardada,
  idFicha,
  fichaInfo,
  modoEdicion = false,
  planeacionInicial = null,
}) => {
  const [trimestreSeleccionado, setTrimestreSeleccionado] = useState("");
  const [rapsAgregados, setRapsAgregados] = useState([]);
  const [rapsDisponibles, setRapsDisponibles] = useState([]);
  const [infoFicha, setInfoFicha] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [erroresRap, setErroresRap] = useState({});

  // Estados para modales
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mostrarModalValidacion, setMostrarModalValidacion] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");

  // Nuevos estados para validación
  const [formulariosCompletos, setFormulariosCompletos] = useState({});

  const { user } = useAuthContext();
  const mountedRef = useRef(true);

  // Cargar datos de la ficha al montar el componente - OPTIMIZADO
  useEffect(() => {
    if (!idFicha) return;

    const cargarDatos = async () => {
      setCargando(true);
      try {
        // Si ya tenemos fichaInfo del sidebar, usarla directamente
        if (fichaInfo && fichaInfo.codigo_ficha) {
          logger.debug("✅ Usando fichaInfo del sidebar:", fichaInfo);
          setInfoFicha({
            ficha: fichaInfo,
            programa: {
              nombre_programa: fichaInfo.nombre_programa,
              codigo_programa: fichaInfo.codigo_programa || "228118",
              version_programa: fichaInfo.version_programa || "v1.0",
            },
            proyecto: {
              nombre_proyecto: fichaInfo.nombre_proyecto || "Proyecto Formativo en Desarrollo de Software",
              codigo_proyecto: fichaInfo.codigo_proyecto || "PROY-001",
              fase_proyecto: fichaInfo.fase_proyecto || "Fase de Implementación",
              actividad_proyecto: fichaInfo.actividad_proyecto || "Desarrollo de solución informática integral",
            },
          });
          setCargando(false);
          return;
        }

        // Solo si no tenemos datos del sidebar, buscar del servicio
        logger.debug("🔍 Obteniendo info de ficha del servicio...");
        const info = await planeacionService.obtenerInfoFichaCompleta(idFicha);
        setInfoFicha(info);
      } catch (error) {
        logger.warn("⚠️ Error obteniendo info ficha, usando datos por defecto:", error);
        setInfoFicha({
          ficha: {
            id_ficha: idFicha,
            codigo_ficha: fichaInfo?.codigo_ficha || `Ficha ${idFicha}`,
            nombre_programa: fichaInfo?.nombre_programa || "Programa de Formación",
          },
          programa: {
            nombre_programa: fichaInfo?.nombre_programa || "Tecnólogo en Desarrollo de Software",
            codigo_programa: fichaInfo?.codigo_programa || "228118",
            version_programa: fichaInfo?.version_programa || "v1.0",
          },
          proyecto: {
            nombre_proyecto: fichaInfo?.nombre_proyecto || "Proyecto Formativo",
            codigo_proyecto: fichaInfo?.codigo_proyecto || "PROY-001",
            fase_proyecto: fichaInfo?.fase_proyecto || "Fase de Implementación",
            actividad_proyecto: fichaInfo?.actividad_proyecto || "Desarrollo de solución informática",
          },
        });
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [idFicha, fichaInfo]);

  // Pre-cargar datos en modo edición (conserva id_detalle por fila para el PUT)
  useEffect(() => {
    if (!modoEdicion || !planeacionInicial?.detalles?.length) return;

    const trimestre =
      planeacionInicial.no_trimestre ??
      planeacionInicial.trimestre ??
      (() => {
        const match = planeacionInicial.observaciones?.match(/Trimestre\s+(\d+)/i);
        return match?.[1] ?? "";
      })();

    setTrimestreSeleccionado(String(trimestre));

    const rapsMapeados = planeacionInicial.detalles.map(mapDetalleARap);
    setRapsAgregados(rapsMapeados);
    setRapsDisponibles(rapsMapeados);

    const estadoInicial = {};
    rapsMapeados.forEach((rap) => {
      estadoInicial[rap.id] = evaluarCompletitudRap(rap);
    });
    setFormulariosCompletos(estadoInicial);
    setErroresRap({});
  }, [modoEdicion, planeacionInicial]);

  // Manejar cambio de trimestre
  const handleTrimestreChange = async (nuevoTrimestre) => {
    setTrimestreSeleccionado(nuevoTrimestre);
    setRapsAgregados([]);
    setFormulariosCompletos({});
    setErroresRap({});

    if (!nuevoTrimestre || !idFicha) {
      setRapsDisponibles([]);
      return;
    }

    setCargando(true);
    try {
      const rapsDelTrimestre = await planeacionService.obtenerRAPsPorFichaYTrimestre(idFicha, nuevoTrimestre);
      setRapsDisponibles(rapsDelTrimestre);

      // Obtener instructores para cada RAP
      const rapsAgregadosConInstructor = await Promise.all(
        rapsDelTrimestre.map(async (rap) => {
          // OBTENER INSTRUCTOR DESDE LA SÁBANA
          let instructorRap = null;
          try {
            instructorRap = await obtenerInstructorPorRAP(idFicha, rap.id, nuevoTrimestre);
            logger.debug(`Instructor para RAP ${rap.codigo}:`, instructorRap);

            // Si NO se encontró instructor en la sábana, dejar como null
            if (!instructorRap || !instructorRap.id_instructor) {
              instructorRap = null;
              logger.debug(`RAP ${rap.codigo} NO tiene instructor asignado en sábana`);
            }
          } catch (error) {
            logger.warn(`No se pudo obtener instructor para RAP ${rap.codigo}:`, error);
            instructorRap = null; // Asegurar que sea null si hay error
          }

          // CALCULAR DURACIONES AUTOMÁTICAMENTE (80% directa, 20% independiente)
          const horasTotales = rap.horas_trimestre || 0;
          const duracionDirecta = Math.round(horasTotales * 0.8);
          const duracionIndependiente = Math.round(horasTotales * 0.2);

          return {
            id: rap.id,
            codigo: rap.codigo,
            nombre: rap.nombre,
            competencia: rap.competencia,
            codigo_norma: rap.codigo_norma,
            duracion: rap.duracion,
            horas_trimestre: rap.horas_trimestre,
            saberes_conceptos: rap.saberes_conceptos,
            saberes_proceso: rap.saberes_proceso,
            criterios_evaluacion: rap.criterios_evaluacion,
            // AGREGAR INFORMACIÓN DEL INSTRUCTOR
            instructor: instructorRap
              ? {
                  id: instructorRap.id_instructor,
                  nombre: instructorRap.nombre,
                  apellido: instructorRap.apellido || "",
                  asignado_en_sabana: true,
                }
              : null, // NULL cuando no hay instructor en sábana
            datos: {
              fechaElaboracion: new Date().toISOString().split("T")[0],
              actividadesAprendizaje: "",
              duracionDirecta: duracionDirecta,
              duracionIndependiente: duracionIndependiente,
              descripcionEvidencia: "",
              estrategiasDidacticas: "",
              ambientesAprendizaje: "",
              materialesFormacion: "",
              observaciones: "",
            },
            expandido: rapsDelTrimestre.length <= 3,
          };
        })
      );

      setRapsAgregados(rapsAgregadosConInstructor);

      // Inicializar estado de completitud
      const estadoInicial = {};
      rapsDelTrimestre.forEach((rap) => {
        estadoInicial[rap.id] = false;
      });
      setFormulariosCompletos(estadoInicial);

      // Mostrar mensaje informativo
      if (rapsAgregadosConInstructor.length > 0) {
        logger.debug(`✅ Se agregaron ${rapsAgregadosConInstructor.length} RAP(s) con instructores desde la sábana`);
      } else {
        setMensajeModal(`No hay RAPs asignados al trimestre ${nuevoTrimestre} en la sábana pedagógica.`);
        setMostrarModalError(true);
      }
    } catch (error) {
      setMensajeModal("Error al cargar los RAPs del trimestre seleccionado: " + error.message);
      setMostrarModalError(true);
      setRapsDisponibles([]);
      setFormulariosCompletos({});
    } finally {
      setCargando(false);
    }
  };

  // Validar si todos los formularios de RAP están completos
  const validarFormulariosCompletos = () => {
    if (rapsDisponibles.length === 0) return false;

    // Verificar que todos los RAPs del trimestre estén agregados
    const todosRapsAgregados = rapsDisponibles.every((rap) =>
      rapsAgregados.some((rapAgregado) => rapAgregado.id === rap.id)
    );

    if (!todosRapsAgregados) return false;

    // Verificar que todos los formularios estén completos
    return Object.values(formulariosCompletos).every((completo) => completo === true);
  };

  // Validar si un formulario de RAP específico está completo
  const validarFormularioRapCompleto = (rap) => {
    const datos = rap.datos;
    const errores = {};

    // Validar cada campo obligatorio
    if (datos.actividadesAprendizaje.trim() === "") {
      errores.actividadesAprendizaje = "Este campo es obligatorio";
    }

    if (datos.descripcionEvidencia.trim() === "") {
      errores.descripcionEvidencia = "Este campo es obligatorio";
    }

    if (datos.estrategiasDidacticas === "") {
      errores.estrategiasDidacticas = "Seleccione una estrategia didáctica";
    }

    if (datos.ambientesAprendizaje === "") {
      errores.ambientesAprendizaje = "Seleccione un ambiente de aprendizaje";
    }

    if (datos.materialesFormacion.trim() === "") {
      errores.materialesFormacion = "Este campo es obligatorio";
    }

    // Guardar los errores para este RAP
    setErroresRap((prev) => ({
      ...prev,
      [rap.id]: errores,
    }));

    // Verificar si hay errores
    const tieneErrores = Object.keys(errores).length > 0;

    // Actualizar estado de completitud
    setFormulariosCompletos((prev) => ({
      ...prev,
      [rap.id]: !tieneErrores,
    }));

    return !tieneErrores;
  };

  // Actualizar estado de completitud cuando cambian los datos de un RAP
  const actualizarEstadoCompletitud = (rapId) => {
    const rap = rapsAgregados.find((r) => r.id === rapId);
    if (rap) {
      const completo = validarFormularioRapCompleto(rap);
      setFormulariosCompletos((prev) => ({
        ...prev,
        [rapId]: completo,
      }));
    }
  };

  // Actualizar datos de un RAP específico
  const actualizarDatosRap = (rapId, campo, valor) => {
    setRapsAgregados((prev) =>
      prev.map((rap) => (rap.id === rapId ? { ...rap, datos: { ...rap.datos, [campo]: valor } } : rap))
    );

    // Limpiar el error específico cuando el usuario empieza a llenar el campo
    if (erroresRap[rapId] && erroresRap[rapId][campo]) {
      setErroresRap((prev) => {
        const nuevosErrores = { ...prev };
        if (nuevosErrores[rapId]) {
          delete nuevosErrores[rapId][campo];
          // Si no quedan errores, eliminar el objeto
          if (Object.keys(nuevosErrores[rapId]).length === 0) {
            delete nuevosErrores[rapId];
          }
        }
        return nuevosErrores;
      });
    }

    // Actualizar estado de completitud después de un breve delay
    setTimeout(() => {
      actualizarEstadoCompletitud(rapId);
    }, 100);
  };

  // Expandir/contraer acordeón
  const toggleAcordeon = (rapId) => {
    setRapsAgregados((prev) => prev.map((rap) => (rap.id === rapId ? { ...rap, expandido: !rap.expandido } : rap)));
  };

  // Eliminar RAP
  const eliminarRap = (rapId) => {
    setRapsAgregados((prev) => prev.filter((rap) => rap.id !== rapId));
    setFormulariosCompletos((prev) => {
      const nuevos = { ...prev };
      delete nuevos[rapId];
      return nuevos;
    });

    // Eliminar también los errores de este RAP
    setErroresRap((prev) => {
      const nuevos = { ...prev };
      delete nuevos[rapId];
      return nuevos;
    });
  };

  // Función para validar antes de enviar
  const validarAntesDeEnviar = () => {
    // Validar todos los RAPs
    rapsAgregados.forEach((rap) => {
      validarFormularioRapCompleto(rap);
    });

    // Verificar si hay algún RAP con errores
    const hayErrores = Object.keys(erroresRap).some((rapId) => Object.keys(erroresRap[rapId]).length > 0);

    return hayErrores;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!trimestreSeleccionado) {
      setMensajeModal("Por favor selecciona un trimestre para comenzar");
      setMostrarModalError(true);
      return;
    }

    // Validar que hayamos agregado RAPs automáticamente
    if (rapsAgregados.length === 0) {
      setMensajeModal(`No hay RAPs asignados al trimestre ${trimestreSeleccionado} en la sábana pedagógica.`);
      setMostrarModalError(true);
      return;
    }

    // Validar todos los formularios antes de enviar
    const hayErrores = validarAntesDeEnviar();

    if (hayErrores) {
      // Contar RAPs con errores
      const rapsConErrores = Object.keys(erroresRap).length;

      // Expandir todos los RAPs con errores
      setRapsAgregados((prev) =>
        prev.map((rap) => ({
          ...rap,
          expandido: erroresRap[rap.id] && Object.keys(erroresRap[rap.id]).length > 0 ? true : rap.expandido,
        }))
      );

      setMensajeModal(
        `Hay ${rapsConErrores} RAP(s) con campos obligatorios sin completar. Por favor, revise los campos marcados en rojo.`
      );
      setMostrarModalValidacion(true);
      return;
    }

    // Validar que todos los formularios estén completos
    if (!validarFormulariosCompletos()) {
      const rapsIncompletos = Object.entries(formulariosCompletos).filter(([_, completo]) => !completo).length;

      setMensajeModal(
        `Complete todos los formularios antes de guardar. Faltan ${rapsIncompletos} RAP(s) por completar.`
      );
      setMostrarModalValidacion(true);
      return;
    }

    setCargando(true);

    try {
      if (modoEdicion && planeacionInicial?.id_planeacion) {
        const detalles = rapsAgregados.map((rap) => ({
          id_detalle: rap.id_detalle,
          actividades_aprendizaje: rap.datos.actividadesAprendizaje,
          duracion_directa: parseInt(rap.datos.duracionDirecta, 10) || 0,
          duracion_independiente: parseInt(rap.datos.duracionIndependiente, 10) || 0,
          descripcion_evidencia: rap.datos.descripcionEvidencia,
          estrategias_didacticas: rap.datos.estrategiasDidacticas,
          ambientes_aprendizaje: rap.datos.ambientesAprendizaje,
          materiales_formacion: rap.datos.materialesFormacion,
          observaciones: rap.datos.observaciones,
          saberes_conceptos: rap.saberes_conceptos,
          saberes_proceso: rap.saberes_proceso,
          criterios_evaluacion: rap.criterios_evaluacion,
        }));

        const resultado = await planeacionService.editarPlaneacion(
          planeacionInicial.id_planeacion,
          detalles,
        );

        setMensajeModal(
          resultado.mensaje ||
            `Planeación del trimestre ${trimestreSeleccionado} actualizada con ${rapsAgregados.length} RAP(s)`,
        );
        setMostrarModalExito(true);
        return;
      }

      const datosParaGuardar = {
        id_ficha: parseInt(idFicha),
        trimestre: parseInt(trimestreSeleccionado),
        raps: rapsAgregados.map((rap) => ({
          id_rap: rap.id,
          codigo_rap: rap.codigo,
          nombre_rap: rap.nombre,
          competencia: rap.competencia,
          horas_trimestre: rap.horas_trimestre,
          actividades_aprendizaje: rap.datos.actividadesAprendizaje,
          duracion_directa: parseInt(rap.datos.duracionDirecta) || 0,
          duracion_independiente: parseInt(rap.datos.duracionIndependiente) || 0,
          descripcion_evidencia: rap.datos.descripcionEvidencia,
          estrategias_didacticas: rap.datos.estrategiasDidacticas,
          ambientes_aprendizaje: rap.datos.ambientesAprendizaje,
          materiales_formacion: rap.datos.materialesFormacion,
          observaciones: rap.datos.observaciones,
          saberes_conceptos: rap.saberes_conceptos,
          saberes_proceso: rap.saberes_proceso,
          criterios_evaluacion: rap.criterios_evaluacion,
          // INFORMACIÓN DEL INSTRUCTOR DESDE LA SÁBANA
          instructor_rap: rap.instructor
            ? {
                id: rap.instructor.id,
                nombre: rap.instructor.nombre,
                apellido: rap.instructor.apellido,
                asignado_en_sabana: true,
              }
            : {
                id: null,
                nombre: null,
                apellido: null,
                asignado_en_sabana: false,
                nota: "No asignado en sábana al momento de crear la planeación",
              },
        })),
        info_ficha: infoFicha,
        fecha_creacion: new Date().toISOString(),
        // Mantener también al instructor que crea la planeación
        instructor_creador: {
          id: user?.id,
          nombre: user?.nombre,
          apellido: user?.apellido,
        },
      };

      const resultado = await planeacionService.crearPlaneacionReal(datosParaGuardar);

      if (resultado.success) {
        setMensajeModal(
          ` Planeación del trimestre ${trimestreSeleccionado} guardada exitosamente con ${rapsAgregados.length} RAP(s)`
        );
        setMostrarModalExito(true);
      } else {
        setMensajeModal(resultado.mensaje || "Error al guardar la planeación");
        setMostrarModalError(true);
      }
    } catch (error) {
      setMensajeModal("Error al guardar la planeación: " + error.message);
      setMostrarModalError(true);
    } finally {
      setCargando(false);
    }
  };

  // Funciones para manejar modales
  const handleCierreModalExito = () => {
    setMostrarModalExito(false);
    if (modoEdicion) {
      onPlaneacionGuardada();
      return;
    }
    setMensajeModal("¿Quieres crear otra planeación o volver al listado?");
    setMostrarModalConfirmacion(true);
  };

  const handleCierreModalError = () => {
    setMostrarModalError(false);
  };

  const handleCierreModalValidacion = () => {
    setMostrarModalValidacion(false);
  };

  const handleConfirmarOtraPlaneacion = () => {
    setMostrarModalConfirmacion(false);
    setTrimestreSeleccionado("");
    setRapsAgregados([]);
    setRapsDisponibles([]);
    setFormulariosCompletos({});
    setErroresRap({});
  };

  const handleCancelarOtraPlaneacion = () => {
    setMostrarModalConfirmacion(false);
    onPlaneacionGuardada();
  };

  // Generar trimestres dinámicamente
  const trimestresDisponibles = Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    nombre: `Trimestre ${i + 1}`,
  }));

  if ((cargando && !trimestreSeleccionado && !modoEdicion) || (modoEdicion && !planeacionInicial)) {
    return (
      <div className="cargando-datos">
        <div className="spinner"></div>
        Cargando información de la ficha...
      </div>
    );
  }

  return (
    <div className="nueva-planeacion-form">
      {/* Modales */}
      {mostrarModalExito && (
        <ModalExito
          onClose={handleCierreModalExito}
          titulo="¡Operación Exitosa!"
          mensaje={mensajeModal}
          textoBoton="Continuar"
        />
      )}

      {mostrarModalError && (
        <ModalError onClose={handleCierreModalError} titulo="Error" mensaje={mensajeModal} textoBoton="Entendido" />
      )}

      {mostrarModalValidacion && (
        <ModalError
          onClose={handleCierreModalValidacion}
          titulo="Validación Requerida"
          mensaje={mensajeModal}
          textoBoton="Entendido"
        />
      )}

      {mostrarModalConfirmacion && (
        <ModalConfirmacion
          onClose={handleCancelarOtraPlaneacion}
          onConfirm={handleConfirmarOtraPlaneacion}
          titulo="¿Qué deseas hacer?"
          mensaje={mensajeModal}
          textoConfirmar="Crear otra"
          textoCancelar="Volver al listado"
        />
      )}

      {/* NAVEGACIÓN SEPARADA */}
      <div className="main-header">
        <button className="btn-back" onClick={onCancel}>
          <svg
            className="back-arrow"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Volver a Lista
        </button>
        <div className="header-info">
          <h1 className="header-title">
            {modoEdicion ? "Editar Planeación Pedagógica" : "Nueva Planeación Pedagógica"}
          </h1>
          <div className="header-subtitle">
            Ficha: {infoFicha?.ficha?.codigo_ficha || idFicha} | Programa:{" "}
            {infoFicha?.programa?.nombre_programa || "No asignado"}
          </div>
        </div>
        <button className="btn-guardar" onClick={handleSubmit} disabled={cargando}>
          <svg
            className="save-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {cargando ? "Guardando..." : modoEdicion ? "Guardar cambios" : "Guardar"}
        </button>
      </div>

      {/* CONTENEDOR DEL FORMULARIO */}
      <div className="form-content">
        {/* SECCIÓN 1: CONFIGURACIÓN INICIAL */}
        <section className="configuracion-section">
          <div className="section-header-inline">
            <div>
              <h2 className="section-title-inline">Configuración Inicial</h2>
              <p className="section-description-inline">
                {modoEdicion
                  ? "El trimestre no se puede modificar al editar. Actualiza los campos de cada RAP."
                  : "Selecciona el trimestre para generar la planeación. Los RAPs se cargarán automáticamente."}
              </p>
            </div>
          </div>

          <div className="configuracion-grid">
            <div className="campo-grupo">
              <label className="campo-label-block">Trimestre*</label>
              <select
                value={trimestreSeleccionado}
                onChange={(e) => handleTrimestreChange(e.target.value)}
                className="campo-select-block"
                required
                disabled={cargando || modoEdicion}
              >
                <option value="">Seleccionar trimestre</option>
                {trimestresDisponibles.map((trimestre) => (
                  <option key={trimestre.id} value={trimestre.id}>
                    {trimestre.nombre}
                  </option>
                ))}
              </select>
              <div className="info-simple">
                <small>Selecciona un trimestre para cargar todos sus RAPs automáticamente</small>
              </div>
            </div>

            <div className="campo-grupo">
              <label className="campo-label-block">Estado</label>
              <div className="estado-container">
                {!trimestreSeleccionado ? (
                  <div className="estado-pendiente">
                    <span className="estado-icon">⏳</span>
                    <span className="estado-texto">Esperando selección de trimestre</span>
                  </div>
                ) : cargando ? (
                  <div className="estado-cargando">
                    <span className="estado-icon"></span>
                    <span className="estado-texto">Cargando RAPs del trimestre...</span>
                  </div>
                ) : rapsAgregados.length > 0 ? (
                  <div className="estado-completo">
                    <span className="estado-icon"></span>
                    <span className="estado-texto">
                      {rapsAgregados.length} RAP(s) cargados del trimestre {trimestreSeleccionado}
                    </span>
                  </div>
                ) : (
                  <div className="estado-vacio">
                    <span className="estado-icon"></span>
                    <span className="estado-texto">No hay RAPs en este trimestre</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mostrar información del trimestre seleccionado */}
          {trimestreSeleccionado && !cargando && rapsAgregados.length > 0 && (
            <div className="trimestre-info">
              <div className="trimestre-seleccionado">
                <strong>Trimestre {trimestreSeleccionado} seleccionado:</strong>
                <span className="contador-raps">
                  {rapsAgregados.length} RAP{rapsAgregados.length !== 1 ? "s" : ""} cargados
                </span>
              </div>
              <div className="info-raps-disponibles">
                <strong>Acción requerida:</strong> Complete todos los formularios de los RAPs listados a continuación
                para guardar la planeación.
              </div>
            </div>
          )}

          {/* Mostrar cuando no hay RAPs en el trimestre */}
          {trimestreSeleccionado && !cargando && rapsAgregados.length === 0 && (
            <div className="raps-vacios">
              <div className="icono-vacio">📭</div>
              <h4>No hay RAPs asignados a este trimestre</h4>
              <p>El trimestre {trimestreSeleccionado} no tiene RAPs asignados en la sábana pedagógica.</p>
              <p>
                <small>Verifica la asignación de RAPs en el módulo de sábana o selecciona otro trimestre.</small>
              </p>
            </div>
          )}

          {/* Indicador de carga cuando se cambia de trimestre */}
          {cargando && trimestreSeleccionado && (
            <div className="cargando-raps">
              <div className="spinner-pequeno"></div>
              Cargando RAPs del trimestre...
            </div>
          )}

          {/* Lista de RAPs agregados */}
          {rapsAgregados.length > 0 && (
            <div className="raps-agregados">
              <h3 className="raps-titulo">RAPs en esta planeación ({rapsAgregados.length})</h3>
              <div className="raps-lista">
                {rapsAgregados.map((rap) => {
                  const erroresEsteRap = erroresRap[rap.id] || {};
                  const tieneErrores = Object.keys(erroresEsteRap).length > 0;

                  return (
                    <div key={rap.id} className={`rap-item-header ${tieneErrores ? "con-errores" : ""}`}>
                      <span className="rap-info">
                        {rap.codigo} - {rap.nombre}
                        {rap.horas_trimestre && <span className="rap-horas"> ({rap.horas_trimestre}h)</span>}
                        {rap.instructor ? (
                          <span
                            className="rap-instructor-badge"
                            title={`Instructor asignado: ${rap.instructor.nombre}`}
                          >
                            {rap.instructor.nombre.split(" ")[0]}
                          </span>
                        ) : (
                          <span className="rap-instructor-no-asignado" title="Sin instructor asignado en sábana">
                            Sin asignar
                          </span>
                        )}
                        {tieneErrores && (
                          <span className="error-indicator">{Object.keys(erroresEsteRap).length} error(es)</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="separator"></div>
        </section>

        {/* SECCIÓN 2: INFORMACIÓN DEL PROGRAMA Y PROYECTO */}
        {trimestreSeleccionado && rapsAgregados.length > 0 && (
          <section className="programa-section">
            <h2 className="section-title">Información del Programa y Proyecto</h2>
            <p className="section-description">
              {infoFicha ? "Datos extraídos automáticamente del sistema" : "Datos básicos del sistema"} - Formato
              GFPI-F-134
            </p>

            <div className="datos-lista">
              <div className="dato-item">
                <h3 className="dato-titulo">Fecha de Elaboración</h3>
                <input type="date" className="dato-input" value={new Date().toISOString().split("T")[0]} readOnly />
              </div>

              <div className="dato-item">
                <h3 className="dato-titulo">Denominación del Programa de Formación</h3>
                <div className="dato-valor">
                  {infoFicha?.programa?.nombre_programa || infoFicha?.ficha?.nombre_programa || "Programa no asignado"}
                </div>
              </div>

              <div className="dato-item">
                <h3 className="dato-titulo">Modalidad de Formación</h3>
                <select className="dato-select" defaultValue="presencial">
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>

              <div className="dato-item">
                <h3 className="dato-titulo">Código del Programa</h3>
                <div className="dato-valor">
                  {infoFicha?.programa?.codigo_programa ||
                    infoFicha?.ficha?.codigo_programa ||
                    infoFicha?.programa?.codigo ||
                    "No disponible"}
                </div>
              </div>

              <div className="dato-item">
                <h3 className="dato-titulo">Versión del Programa</h3>
                <div className="dato-valor">
                  {infoFicha?.programa?.version_programa || infoFicha?.programa?.version || "v1.0"}
                </div>
              </div>

              <div className="dato-item">
                <h3 className="dato-titulo">Nombre del Proyecto Formativo</h3>
                <div className="dato-valor">
                  {infoFicha?.proyecto?.nombre_proyecto || infoFicha?.proyecto?.nombre || "Proyecto no asignado"}
                </div>
              </div>

              <div className="dato-item">
                <h3 className="dato-titulo">Código del Proyecto</h3>
                <div className="dato-valor">
                  {infoFicha?.proyecto?.codigo_proyecto || infoFicha?.proyecto?.codigo || "No disponible"}
                </div>
              </div>

              <div className="dato-item">
                <h3 className="dato-titulo">Fase del Proyecto Formativo</h3>
                <div className="dato-valor">
                  {infoFicha?.proyecto?.fase_proyecto || infoFicha?.proyecto?.fase || "Por definir"}
                </div>
              </div>

              <div className="dato-item full-width">
                <h3 className="dato-titulo">Actividad del Proyecto Formativo</h3>
                <div className="dato-valor">
                  {infoFicha?.proyecto?.actividad_proyecto ||
                    infoFicha?.proyecto?.actividad ||
                    "Actividades de formación según RAPs"}
                </div>
              </div>
            </div>

            <div className="separator"></div>
          </section>
        )}

        {/* RESUMEN DE ERRORES */}
        {Object.keys(erroresRap).length > 0 && (
          <div className="errores-resumen">
            <h4>Campos obligatorios pendientes</h4>
            <p>Los siguientes RAPs tienen campos obligatorios sin completar:</p>
            <ul className="errores-lista">
              {rapsAgregados
                .filter((rap) => erroresRap[rap.id] && Object.keys(erroresRap[rap.id]).length > 0)
                .map((rap) => (
                  <li key={rap.id}>
                    <span className="rap-codigo">{rap.codigo}:</span>
                    <span className="campo-error-nombre">
                      {Object.keys(erroresRap[rap.id]).length} campo(s) pendiente(s)
                    </span>
                    <button type="button" className="btn-mostrar-errores" onClick={() => toggleAcordeon(rap.id)}>
                      Ver detalles
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* FORMULARIOS COMPLETOS POR CADA RAP */}
        {rapsAgregados.map((rap) => {
          const erroresEsteRap = erroresRap[rap.id] || {};
          const tieneErrores = Object.keys(erroresEsteRap).length > 0;

          const formatearSaberes = (texto) => {
            if (!texto) return [];

            return texto
              .split("*")
              .map((t) => t.trim())
              .filter(Boolean)
              .map((t) => `* ${t}`);
          };

          return (
            <section
              key={rap.id}
              className={`rap-form-section ${rap.expandido ? "expandido" : "contraido"} ${
                tieneErrores ? "con-errores" : ""
              }`}
            >
              <div className="rap-form-header" onClick={() => toggleAcordeon(rap.id)}>
                <div className="rap-header-content">
                  <h3 className="rap-form-titulo">
                    {rap.codigo} - {rap.nombre}
                    {rap.horas_trimestre && (
                      <span className="rap-horas-header"> ({rap.horas_trimestre} horas totales)</span>
                    )}
                  </h3>
                  {tieneErrores && (
                    <div className="rap-error-badge">
                      <span className="error-icon"></span>
                      <span className="error-text">Faltan {Object.keys(erroresEsteRap).length} campos</span>
                    </div>
                  )}
                </div>
                <div className="rap-form-controls">
                  <button type="button" className="btn-toggle-acordeon">
                    {rap.expandido ? "−" : "+"}
                  </button>
                </div>
              </div>

              {rap.expandido && (
                <div className="rap-form-content">
                  <section className="competencia-section">
                    <h2 className="section-title">Competencia y Resultado de Aprendizaje</h2>
                    <p className="section-description">Información específica del RAP seleccionado</p>

                    <div className="competencia-info">
                      <div className="info-field">
                        <h3 className="info-label">Competencia</h3>
                        <div className="info-content">
                          {rap.competencia ||
                            "Desarrollar el sistema que cumpla con los requisitos de la solución informática"}
                        </div>
                      </div>

                      <div className="info-field">
                        <h3 className="info-label">Resultado de Aprendizaje</h3>
                        <div className="info-content">{rap.nombre}</div>
                      </div>

                      <div className="saberes-grid">
                        <div className="info-field">
                          <h3 className="info-label">Conocimiento de Saber</h3>
                          <div className="info-content">
                            {formatearSaberes(rap.saberes_conceptos).map((item, idx) => (
                              <div key={idx}>{item}</div>
                            ))}
                          </div>
                        </div>

                        <div className="info-field">
                          <h3 className="info-label">Conocimientos de Proceso</h3>
                          <div className="info-content">
                            {formatearSaberes(rap.saberes_proceso).map((item, idx) => (
                              <div key={idx}>{item}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="info-field">
                        <h3 className="info-label">Criterios de Evaluación</h3>
                        <div className="info-content">
                          {formatearSaberes(rap.criterios_evaluacion).map((item, idx) => (
                            <div key={idx}>{item}</div>
                          ))}
                        </div>
                      </div>

                      <div className="info-field">
                        <h3 className="info-label">Instructor Responsable</h3>
                        <div className="info-content instructor-responsable">
                          {rap.instructor ? (
                            // Si hay instructor asignado en la sábana
                            <>
                              <span className="instructor-nombre">
                                {rap.instructor.nombre} {rap.instructor.apellido || ""}
                              </span>
                              <span className="instructor-badge-sabana" title="Asignado en la sábana">
                                Sábana
                              </span>
                            </>
                          ) : (
                            // Si NO hay instructor asignado en la sábana
                            <span className="instructor-no-asignado">
                              <span className="icono-advertencia"></span>
                              Sin asignar en sábana
                              {user?.nombre && <span className="instructor-nota-creador"></span>}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rap-info-adicional">
                        {rap.codigo_norma && (
                          <div className="info-field">
                            <h3 className="info-label">Código Norma</h3>
                            <div className="info-content">{rap.codigo_norma}</div>
                          </div>
                        )}

                        {rap.horas_trimestre && (
                          <div className="info-field">
                            <h3 className="info-label">Horas en este Trimestre</h3>
                            <div className="info-content">{rap.horas_trimestre} horas</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="separator"></div>
                  </section>

                  <section className="planeacion-section">
                    <h2 className="section-title">Planeación Detallada - {rap.codigo}</h2>
                    <p className="section-description">
                      Información que debe ser completada por el instructor para este RAP
                    </p>

                    <div className="planeacion-campos">
                      <div className="campo-editable">
                        <label className="campo-editable-label">
                          Actividades de Aprendizaje a Desarrollar*
                          {erroresEsteRap.actividadesAprendizaje && (
                            <span className="error-mensaje"> - {erroresEsteRap.actividadesAprendizaje}</span>
                          )}
                        </label>
                        <textarea
                          className={`campo-textarea ${erroresEsteRap.actividadesAprendizaje ? "campo-error" : ""}`}
                          placeholder="Describir las actividades específicas que realizarán los aprendices..."
                          rows="4"
                          value={rap.datos.actividadesAprendizaje}
                          onChange={(e) => actualizarDatosRap(rap.id, "actividadesAprendizaje", e.target.value)}
                        />
                      </div>

                      <div className="duraciones-grid">
                        <div className="campo-estatico">
                          <label className="campo-editable-label">Duración Directa (80% - Horas)*</label>
                          <div className="campo-valor-estatico">
                            {rap.datos.duracionDirecta} horas
                            <small className="nota-calculo">(Calculado: {rap.horas_trimestre || 0} horas × 80%)</small>
                          </div>
                        </div>

                        <div className="campo-estatico">
                          <label className="campo-editable-label">Duración Independiente (20% - Horas)*</label>
                          <div className="campo-valor-estatico">
                            {rap.datos.duracionIndependiente} horas
                            <small className="nota-calculo">(Calculado: {rap.horas_trimestre || 0} horas × 20%)</small>
                          </div>
                        </div>
                      </div>

                      <div className="campo-editable">
                        <label className="campo-editable-label">
                          Descripción de Evidencia de Aprendizaje*
                          {erroresEsteRap.descripcionEvidencia && (
                            <span className="error-mensaje"> - {erroresEsteRap.descripcionEvidencia}</span>
                          )}
                        </label>
                        <textarea
                          className={`campo-textarea ${erroresEsteRap.descripcionEvidencia ? "campo-error" : ""}`}
                          placeholder="Describir las evidencias que los aprendices deben presentar..."
                          rows="4"
                          value={rap.datos.descripcionEvidencia}
                          onChange={(e) => actualizarDatosRap(rap.id, "descripcionEvidencia", e.target.value)}
                        />
                      </div>

                      <div className="campo-editable">
                        <label className="campo-editable-label">
                          Estrategias Didácticas Activas*
                          {erroresEsteRap.estrategiasDidacticas && (
                            <span className="error-mensaje"> - {erroresEsteRap.estrategiasDidacticas}</span>
                          )}
                        </label>
                        <select
                          className={`campo-select-full ${erroresEsteRap.estrategiasDidacticas ? "campo-error" : ""}`}
                          value={rap.datos.estrategiasDidacticas}
                          onChange={(e) => actualizarDatosRap(rap.id, "estrategiasDidacticas", e.target.value)}
                        >
                          <option value="">Seleccionar estrategia</option>
                          <option value="aprendizaje-basado-proyectos">Aprendizaje Basado en Proyectos</option>
                          <option value="estudio-casos">Estudio de Casos</option>
                          <option value="aprendizaje-colaborativo">Aprendizaje Colaborativo</option>
                          <option value="aprendizaje-problemas">Aprendizaje Basado en Problemas</option>
                        </select>
                      </div>

                      <div className="campo-editable">
                        <label className="campo-editable-label">
                          Ambientes de Aprendizaje Tipificados*
                          {erroresEsteRap.ambientesAprendizaje && (
                            <span className="error-mensaje"> - {erroresEsteRap.ambientesAprendizaje}</span>
                          )}
                        </label>
                        <select
                          className={`campo-select-full ${erroresEsteRap.ambientesAprendizaje ? "campo-error" : ""}`}
                          value={rap.datos.ambientesAprendizaje}
                          onChange={(e) => actualizarDatosRap(rap.id, "ambientesAprendizaje", e.target.value)}
                        >
                          <option value="">Seleccionar ambiente</option>
                          <option value="aula">Aula de Clase</option>
                          <option value="laboratorio">Laboratorio de Sistemas</option>
                          <option value="biblioteca">Biblioteca</option>
                          <option value="empresa">Empresa</option>
                          <option value="virtual">Ambiente Virtual</option>
                        </select>
                      </div>

                      <div className="campo-editable">
                        <label className="campo-editable-label">
                          Materiales de Formación*
                          {erroresEsteRap.materialesFormacion && (
                            <span className="error-mensaje"> - {erroresEsteRap.materialesFormacion}</span>
                          )}
                        </label>
                        <textarea
                          className={`campo-textarea ${erroresEsteRap.materialesFormacion ? "campo-error" : ""}`}
                          placeholder="Listar los materiales, herramientas y recursos necesarios..."
                          rows="4"
                          value={rap.datos.materialesFormacion}
                          onChange={(e) => actualizarDatosRap(rap.id, "materialesFormacion", e.target.value)}
                        />
                      </div>

                      <div className="campo-editable">
                        <label className="campo-editable-label">Observaciones</label>
                        <textarea
                          className="campo-textarea"
                          placeholder="Notas adicionales, consideraciones especiales..."
                          rows="3"
                          value={rap.datos.observaciones}
                          onChange={(e) => actualizarDatosRap(rap.id, "observaciones", e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="separator"></div>
                  </section>
                </div>
              )}
            </section>
          );
        })}

        {/* BOTONES FINALES */}
        <div className="form-actions">
          <button type="button" className="btn btn-cancel" onClick={onCancel} disabled={cargando}>
            Cancelar
          </button>
          <button className="btn-guardar" onClick={handleSubmit} disabled={cargando || rapsAgregados.length === 0}>
            {cargando ? (
              <>
                <div className="spinner-pequeno"></div>
                Guardando...
              </>
            ) : (
              <>
                <svg
                  className="save-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Guardar Planeación Completa
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
