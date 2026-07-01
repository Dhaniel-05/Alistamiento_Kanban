import { useState, useEffect, useMemo } from 'react';
import { logger } from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import {
  obtenerSabanaPorFicha,
  obtenerTrimestres,
  asignarRAP,
  desasignarRAP,
  obtenerInstructoresPorFicha,
  asignarInstructor,
  desasignarInstructor,
} from '../services/sabanaService';
import { leerFichasPorInstructor } from '../services/instructorService';
import httpClient from '../services/httpClient';

export function useSabana(idFicha, user) {
  const navigate = useNavigate();
        const [fichaSeleccionada, setFichaSeleccionada] = useState(idFicha ? parseInt(idFicha) : null);
  const [sabana, setSabana] = useState(null);
  const [mapaTrimestres, setMapaTrimestres] = useState({});
  const [mapaFasesTrimestres, setMapaFasesTrimestres] = useState({});
  const [mapaAsignaciones, setMapaAsignaciones] = useState({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(new Set());
  const [infoFicha, setInfoFicha] = useState(null);
  const [infoPrograma, setInfoPrograma] = useState(null);
  const [instructores, setInstructores] = useState([]); // <-- inicializar como array
  const [asignandoInstructor, setAsignandoInstructor] = useState(false);

  // Nuevos estados para el modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rapSeleccionado, setRapSeleccionado] = useState(null);
  const [competenciaSeleccionada, setCompetenciaSeleccionada] = useState(null);
  const [rapsAsociados, setRapsAsociados] = useState([]);

  const [rapCopiado, setRapCopiado] = useState(null);
  const [modoCopiar, setModoCopiar] = useState(false);
  const [fichasDisponibles, setFichasDisponibles] = useState([]);
  const [cargandoFichas, setCargandoFichas] = useState(false);

  useEffect(() => {
    if (fichaSeleccionada) {
      return undefined;
    }

    const cargarFichasDisponibles = async () => {
      setCargandoFichas(true);
      setError(null);

      try {
        let data = [];

        if (user?.rol === 'Instructor' && user?.id) {
          data = await leerFichasPorInstructor(user.id);
        } else {
          const response = await httpClient.get('/fichas/todas');
          data = response.data;
        }

        setFichasDisponibles(Array.isArray(data) ? data : []);
      } catch (err) {
        logger.error('Error cargando fichas para sábana:', err);
        setFichasDisponibles([]);
        setError('No se pudieron cargar las fichas disponibles.');
      } finally {
        setCargandoFichas(false);
      }
    };

    cargarFichasDisponibles();
    return undefined;
  }, [fichaSeleccionada, user]);

  useEffect(() => {
    if (fichaSeleccionada) {
      cargarSabana(fichaSeleccionada);
      cargarInstructores(fichaSeleccionada);
    } else {
      setSabana(null);
      setMapaTrimestres({});
      setMapaFasesTrimestres({});
      setMapaAsignaciones({});
    }
  }, [fichaSeleccionada]);

  useEffect(() => {
    if (idFicha) {
      setFichaSeleccionada(parseInt(idFicha));
    }
  }, [idFicha]);

  const cargarInstructores = async (idFicha) => {
    try {
      const data = await obtenerInstructoresPorFicha(idFicha);
      setInstructores(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error("Error cargando instructores:", err);
      setInstructores([]);
    }
  };

  const handleAsignarInstructor = async (idRapTrimestre, idInstructor) => {
    if (!idRapTrimestre) return;

    setAsignandoInstructor(true);
    try {
      if (idInstructor) {
        await asignarInstructor(idRapTrimestre, idInstructor); // ahora el servicio espera (id_rap_trimestre, id_instructor)
      } else {
        await desasignarInstructor(idRapTrimestre);
      }

      // Recargar la sábana para reflejar cambios
      if (fichaSeleccionada) {
        await cargarSabana(fichaSeleccionada);
      }
    } catch (err) {
      logger.error("Error asignando instructor:", err);
      setError(`Error al asignar instructor: ${err.message}`);
    } finally {
      setAsignandoInstructor(false);
    }
  };
  // ---- Handler que activa el modo copia desde la tarjeta ----
  const copiarRAP = (rap, asignacion = null) => {
    // Guardar el RAP (y su asignación originaria si existe) en estado
    setRapCopiado({ rap, asignacion });
    setModoCopiar(true);
  };

  // Modifica handleClickRAP para ver el objeto completo
  const handleClickRAP = (rap) => {
    if (!rap) return;

    logger.debug("🎯 RAP completo para debug:", rap);
    logger.debug("🔍 Buscando código de competencia en:");
    logger.debug("- rap.codigo_competencia:", rap.codigo_competencia);
    logger.debug("- rap.competencia_codigo:", rap.competencia_codigo);
    logger.debug("- rap.codigo:", rap.codigo);
    logger.debug("- rap.competencia?.codigo:", rap.competencia?.codigo);

    // Buscar el código de competencia con múltiples intentos
    const codigoCompetencia =
      rap.codigo_competencia ||
      rap.competencia_codigo ||
      rap.competencia?.codigo ||
      (rap.codigo && rap.codigo.startsWith("C") ? rap.codigo : null) ||
      "N/A";

    const competencia = {
      id_competencia: rap.id_competencia,
      codigo_competencia: codigoCompetencia,
      nombre_competencia: rap.nombre_competencia || rap.competencia_nombre || "N/A",
      duracion_maxima: rap.duracion_maxima_competencia || rap.duracion_maxima || "N/A",
      codigo_norma: rap.codigo_norma || "N/A"
    };

    logger.debug("🏆 Competencia preparada:", competencia);

    setRapSeleccionado(rap);
    setCompetenciaSeleccionada(competencia);

    // Buscar todos los RAPs asociados a esta competencia
    if (sabana && Array.isArray(sabana)) {
      const rapsDeEstaCompetencia = sabana.filter((r) => r.id_competencia === rap.id_competencia);
      setRapsAsociados(rapsDeEstaCompetencia);
    }

    setModalAbierto(true);
  };

  // Función para cerrar el modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setRapSeleccionado(null);
    setCompetenciaSeleccionada(null);
    setRapsAsociados([]);
  };

  const cargarSabana = async (idFicha) => {
    try {
      setCargando(true);
      setError(null);

      logger.debug("🔄 Cargando sábana para ficha:", idFicha);

      const [datosSabanaMatriz, datosTrimestres, fichasResponse] = await Promise.all([
        obtenerSabanaPorFicha(idFicha),
        obtenerTrimestres(idFicha).catch(() => []),
        httpClient.get('/fichas/todas', { validateStatus: () => true })
          .then((res) => {
            if (res.status < 200 || res.status >= 300) throw new Error("Error obteniendo fichas");
            return res.data;
          })
          .catch(() => []),
      ]);

      const datosFicha = Array.isArray(fichasResponse)
        ? fichasResponse.find((f) => f.id_ficha === parseInt(idFicha))
        : null;

      // Procesar ficha (igual que antes)...
      if (datosFicha) {
        try {
          const nombrePrograma = datosFicha.nombre_programa || datosFicha.programa || "Programa no asignado";

          let nombreInstructor = "No asignado";
          if (datosFicha.id_instructor) {
            try {
              const instructorRes = await httpClient.get(
                `/instructores/${datosFicha.id_instructor}`,
                { validateStatus: () => true },
              );
              if (instructorRes.status >= 200 && instructorRes.status < 300) {
                const instructorData = instructorRes.data;
                nombreInstructor = instructorData.nombre || "Instructor no asignado";
              }
            } catch (err) {
              logger.warn("⚠️ No se pudo cargar información del instructor:", err);
            }
          }

          const fichaInfoParaSidebar = {
            codigo_ficha: datosFicha.codigo_ficha || datosFicha.id_ficha || idFicha,
            nombre_programa: nombrePrograma,
            nombre_instructor: nombreInstructor,
            jornada: datosFicha.jornada,
            modalidad: datosFicha.modalidad,
            fecha_inicio: datosFicha.fecha_inicio,
            fecha_final: datosFicha.fecha_final,
            programa: nombrePrograma,
            instructor: nombreInstructor,
            gestor: user?.nombre,
          };

          setInfoFicha(fichaInfoParaSidebar);
          setInfoPrograma({ nombre_programa: nombrePrograma });
        } catch (err) {
          const fichaInfoBasica = {
            codigo_ficha: datosFicha.codigo_ficha || datosFicha.id_ficha || idFicha,
            nombre_programa: datosFicha.nombre_programa || datosFicha.programa || "Programa no disponible",
            nombre_instructor: datosFicha.nombre_instructor || "No asignado",
            jornada: datosFicha.jornada || "Diurna",
            modalidad: datosFicha.modalidad || "Presencial",
            fecha_inicio: datosFicha.fecha_inicio,
            fecha_final: datosFicha.fecha_final,
          };
          setInfoFicha(fichaInfoBasica);
          setInfoPrograma(null);
        }
      } else {
        const fichaInfoBasica = {
          codigo_ficha: idFicha,
          nombre_programa: "Programa no asignado",
          nombre_instructor: "No asignado",
          jornada: "Diurna",
          modalidad: "Presencial",
          fecha_inicio: null,
          fecha_final: null,
        };
        setInfoFicha(fichaInfoBasica);
        setInfoPrograma(null);
      }

      // Crear mapa de trimestres y fases por número de trimestre
      const mapa = {};
      const mapaFases = {};
      if (datosTrimestres && Array.isArray(datosTrimestres)) {
        datosTrimestres.forEach((trimestre) => {
          if (trimestre.id_trimestre && trimestre.no_trimestre !== undefined) {
            mapa[trimestre.no_trimestre] = trimestre.id_trimestre;
            if (trimestre.fase) {
              mapaFases[trimestre.no_trimestre] = trimestre.fase;
            }
          }
        });
      }

      if (Object.keys(mapa).length === 0) {
        const jornada = datosFicha?.jornada?.toLowerCase() || "";

        const totalTrimestres = jornada.includes("noct") ? 9 : 7;

        for (let i = 1; i <= totalTrimestres; i++) {
          mapa[i] = i;
        }
      }
      // Procesar asignaciones
      const asignaciones = {};
      const rapsUnicos = [];

      if (datosSabanaMatriz && Array.isArray(datosSabanaMatriz)) {
        datosSabanaMatriz.forEach((rapMatriz) => {
          if (!rapMatriz.id_rap) return;

          // logger.debug("📦 RAP Matriz recibido:", {
          //   id_rap: rapMatriz.id_rap,
          //   codigo_rap: rapMatriz.codigo_rap,
          //   id_competencia: rapMatriz.id_competencia,
          //   // Campos de competencia
          //   codigo_competencia: rapMatriz.codigo_competencia,
          //   nombre_competencia: rapMatriz.nombre_competencia,
          //   duracion_maxima_competencia: rapMatriz.duracion_maxima_competencia,
          //   codigo_norma: rapMatriz.codigo_norma,
          //   // Campos adicionales por si acaso
          //   competencia_codigo: rapMatriz.competencia_codigo,
          //   competencia_nombre: rapMatriz.competencia_nombre,
          //   duracion_maxima: rapMatriz.duracion_maxima
          // });

          rapsUnicos.push({
            id_rap: rapMatriz.id_rap,
            codigo_rap: rapMatriz.codigo_rap,
            descripcion_rap: rapMatriz.descripcion_rap,
            duracion_rap: rapMatriz.duracion_rap,
            id_competencia: rapMatriz.id_competencia,

            codigo_competencia:
              rapMatriz.codigo_competencia ||
              rapMatriz.competencia_codigo ||
              rapMatriz.codigo_comp ||
              "N/A",

            nombre_competencia: rapMatriz.nombre_competencia || rapMatriz.competencia_nombre || "N/A",
            duracion_maxima_competencia: rapMatriz.duracion_maxima_competencia || rapMatriz.duracion_maxima || "N/A",
            codigo_norma: rapMatriz.codigo_norma || "N/A",


            // Campos alternativos
            competencia_codigo: rapMatriz.competencia_codigo,
            competencia_nombre: rapMatriz.competencia_nombre,
            duracion_maxima: rapMatriz.duracion_maxima,
            duracion_competencia: rapMatriz.duracion_competencia,
            norma_codigo: rapMatriz.norma_codigo

          });

          const totalTrimestres =
            Object.keys(mapa).length > 0
              ? Math.max(...Object.keys(mapa).map((n) => parseInt(n, 10)))
              : datosFicha?.jornada?.toString().toLowerCase().includes("noct")
                ? 9
                : 7;

          // Buscar asignaciones existentes
          for (let i = 1; i <= totalTrimestres; i++) {
            const horasTrimestre = rapMatriz[`t${i}_htrim`] ?? 0;
            const idRapTrimestreReal = rapMatriz[`t${i}_id_rap_trimestre`];

            // Si no hay id_rap_trimestre no hay asignación para ese trimestre -> seguimos
            if (!idRapTrimestreReal) continue;

            const idTrimestre = mapa[i];
            if (idTrimestre) {
              if (!asignaciones[rapMatriz.id_rap]) {
                asignaciones[rapMatriz.id_rap] = {};
              }

              asignaciones[rapMatriz.id_rap][idTrimestre] = {
                id_rap_trimestre: idRapTrimestreReal,
                horas_trimestre: horasTrimestre,
                horas_semana: rapMatriz[`t${i}_hsem`] ?? horasTrimestre / 11,
                id_trimestre: idTrimestre,
                id_rap: rapMatriz.id_rap,
                no_trimestre: i,
                estado: rapMatriz[`t${i}_estado`] || "Planeado",
                id_instructor: rapMatriz[`t${i}_id_instructor`] || null,
                instructor_asignado: rapMatriz[`t${i}_instructor`] || rapMatriz.nombre_instructor || null,
              };
            }
          }
        });
      }

      setSabana(rapsUnicos);
      setMapaTrimestres(mapa);
      setMapaFasesTrimestres(mapaFases);
      setMapaAsignaciones(asignaciones);
    } catch (err) {
      logger.error("❌ Error cargando sábana:", err);
      setError(`Error al cargar sábana: ${err.message}`);
      setSabana([]);
      setMapaTrimestres({});
      setMapaFasesTrimestres({});
      setMapaAsignaciones({});
    } finally {
      setCargando(false);
    }
  };

  // ---- Pegar el RAP en un idTrimestre concreto (no borra asignaciones previas) ----
  const pegarRAPEnTrimestre = async (idTrimestre) => {
    if (!rapCopiado || !fichaSeleccionada) return;

    const idRap = rapCopiado.rap.id_rap;
    const clave = `copiar-${idRap}-${idTrimestre}`;

    if (procesando.has(clave)) return;

    try {
      setProcesando((prev) => new Set(prev).add(clave));
      // Llamada al servicio: crear/actualizar asignación para el RAP en el trimestre destino
      // No desasigna la asignación origen.
      await asignarRAP(idRap, idTrimestre, fichaSeleccionada);

      // Recargar datos
      await cargarSabana(fichaSeleccionada);
    } catch (err) {
      logger.error("Error al pegar RAP:", err);
      setError(`Error al pegar RAP: ${err.message || err}`);
    } finally {
      procesando.delete(clave);
      setProcesando(new Set(procesando));
    }
  };

  const obtenerIdTrimestre = (noTrimestre) => {
    return mapaTrimestres[noTrimestre] || null;
  };

  const rapsOrganizados = useMemo(() => {
    if (!sabana || !Array.isArray(sabana) || sabana.length === 0) {
      return { noAsignados: [], porTrimestre: {} };
    }

    const noAsignados = [];
    const porTrimestre = {};

    // Inicializar trimestres
    const trimestresDisponibles = (() => {
      const clavesMapa = Object.keys(mapaTrimestres);
      if (clavesMapa.length > 0) {
        return clavesMapa.map((n) => parseInt(n, 10)).sort((a, b) => a - b);
      }

      // Fallback dinámico: inferir por jornada en infoFicha
      const jornada = infoFicha?.jornada?.toString().toLowerCase() || "";
      const fallbackTotal = jornada.includes("noct") ? 9 : 7;
      return Array.from({ length: fallbackTotal }, (_, i) => i + 1);
    })();

    trimestresDisponibles.forEach((noTrimestre) => {
      const idTrimestre = mapaTrimestres[noTrimestre];
      if (idTrimestre) {
        porTrimestre[idTrimestre] = {
          noTrimestre: noTrimestre,
          idTrimestre: idTrimestre,
          raps: [],
        };
      }
    });

    sabana.forEach((rap) => {
      if (!rap || !rap.id_rap) return;

      let asignado = false;

      if (mapaAsignaciones[rap.id_rap]) {
        // Iterar claves de asignaciones tal cual (string keys)
        for (const key in mapaAsignaciones[rap.id_rap]) {
          if (!Object.prototype.hasOwnProperty.call(mapaAsignaciones[rap.id_rap], key)) continue;
          const idTrimestreKey = key;
          const asignacion = mapaAsignaciones[rap.id_rap][idTrimestreKey];

          if (asignacion && (asignacion.id_rap_trimestre || asignacion.horas_trimestre !== undefined)) {
            const idTrimestre = asignacion.id_trimestre;
            if (porTrimestre[idTrimestre]) {
              porTrimestre[idTrimestre].raps.push({ rap, asignacion });
              asignado = true;
            }
          }
        }
      }

      if (!asignado) {
        noAsignados.push(rap);
      }
    });

    return { noAsignados, porTrimestre };
  }, [sabana, mapaAsignaciones, mapaTrimestres]);

  const handleDropRAP = async (idRap, idTrimestre, asignacionAnterior = null) => {
    if (!fichaSeleccionada) {
      setError("Debe seleccionar una ficha primero");
      return;
    }

    const clave = `asignar-${idRap}-${idTrimestre}`;
    if (procesando.has(clave)) return;

    try {
      setProcesando((prev) => new Set(prev).add(clave));
      setError(null);

      logger.debug("Asignando RAP:", { idRap, idTrimestre, fichaSeleccionada });

      // 1. Si el RAP ya estaba asignado a otro trimestre, desasignarlo primero
      if (asignacionAnterior && asignacionAnterior.id_rap_trimestre) {
        try {
          logger.debug("Desasignando asignación anterior...");
          await desasignarRAP(asignacionAnterior.id_rap || idRap, asignacionAnterior.id_trimestre, fichaSeleccionada);
        } catch (err) {
          logger.warn("Error al desasignar RAP anterior:", err);
        }
      }

      // 2. Asignar el RAP al nuevo trimestre
      logger.debug("Asignando nuevo RAP...");
      await asignarRAP(idRap, idTrimestre, fichaSeleccionada);

      // 3. Recargar todos los datos
      logger.debug("🔄 Recargando sábana completa...");
      await cargarSabana(fichaSeleccionada);

      logger.debug("🎉 RAP asignado exitosamente");
    } catch (err) {
      logger.error("Error asignando RAP:", err);
      setError(`Error al asignar RAP: ${err.message}`);
    } finally {
      setProcesando((prev) => {
        const nuevo = new Set(prev);
        nuevo.delete(clave);
        return nuevo;
      });
    }
  };

  const handleDesasignarRAP = async (idRap, idTrimestre) => {
    if (!fichaSeleccionada) {
      setError("Debe seleccionar una ficha primero");
      return;
    }

    const clave = `desasignar-${idRap}-${idTrimestre}`;
    if (procesando.has(clave)) return;

    try {
      setProcesando((prev) => new Set(prev).add(clave));
      setError(null);

      logger.debug("Desasignando RAP:", { idRap, idTrimestre, fichaSeleccionada });

      await desasignarRAP(idRap, idTrimestre, fichaSeleccionada);

      logger.debug("Recargando sábana completa...");
      await cargarSabana(fichaSeleccionada);

      logger.debug("RAP desasignado exitosamente");
    } catch (err) {
      logger.error("Error desasignando RAP:", err);
      setError(`Error al desasignar RAP: ${err.message}`);
    } finally {
      setProcesando((prev) => {
        const nuevo = new Set(prev);
        nuevo.delete(clave);
        return nuevo;
      });
    }
  };

  const obtenerNumeroTrimestres = () => {
    // Si ya tenemos trimestres cargados desde BD -> usar esos
    const cantidad = Object.keys(mapaTrimestres).length;

    if (cantidad > 0) return cantidad;

    // Caso extremo: no llegaron trimestres -> inferir por jornada
    const jornada = infoFicha?.jornada?.toLowerCase() || "";

    if (jornada.includes("noct")) return 9;
    return 7; // Diurna por defecto
  };

  const handleIrAlDashboard = () => {
    if (user?.rol === 'Instructor') {
      navigate('/instructor');
      return;
    }
    if (user?.rol === 'Gestor') {
      navigate('/sabana');
      return;
    }
    navigate('/principal');
  };

  const handleSeleccionarFicha = (id) => {
    navigate(`/sabana/${id}`);
  };

  return {
    user,
    fichaSeleccionada,
    fichasDisponibles,
    cargandoFichas,
    sabana,
    cargando,
    error,
    procesando,
    infoFicha,
    infoPrograma,
    instructores,
    asignandoInstructor,
    modalAbierto,
    rapSeleccionado,
    competenciaSeleccionada,
    rapsAsociados,
    modoCopiar,
    rapsOrganizados,
    handleAsignarInstructor,
    copiarRAP,
    handleClickRAP,
    cerrarModal,
    pegarRAPEnTrimestre,
    obtenerIdTrimestre,
    mapaFasesTrimestres,
    handleDropRAP,
    handleDesasignarRAP,
    obtenerNumeroTrimestres,
    handleIrAlDashboard,
    handleSeleccionarFicha,
  };
}
