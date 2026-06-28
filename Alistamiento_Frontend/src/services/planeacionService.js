// src/services/planeacionService.js - VERSIÓN COMPLETA Y CORREGIDA
import { logger } from '../utils/logger';
import { obtenerSabanaPorFicha } from './sabanaService';
import httpClient from './httpClient';

const API_TIMEOUT = 5000; // 5 segundos

const fetchWithTimeout = async (path, options = {}) => {
  try {
    const response = await httpClient.request({
      url: path,
      method: options.method || 'GET',
      data: options.body ? JSON.parse(options.body) : undefined,
      headers: options.headers,
      timeout: API_TIMEOUT,
      validateStatus: () => true,
    });

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      json: async () => response.data,
      text: async () => (
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      ),
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Timeout: La solicitud tardó más de ${API_TIMEOUT}ms`);
    }
    logger.warn(`🌐 Fetch fallido: ${path}`, error.message);
    throw new Error(`No se pudo conectar al servidor: ${error.message}`);
  }
};

// Función de fallback con datos mock
async function obtenerRAPsMock(idFicha, trimestre) {
    logger.debug(`🔄 Usando datos mock para ficha ${idFicha}, trimestre ${trimestre}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
        {
            id: 1,
            codigo: "RAP1",
            nombre: "Analizar los requisitos del sistema",
            duracion: 120,
            competencia: "Desarrollar el sistema que cumpla con los requisitos de la solución informática",
            codigo_norma: "220501032",
            horas_trimestre: 40,
            saberes_conceptos: "Principios de análisis de requisitos, técnicas de especificación, modelos de procesos",
            saberes_proceso: "Elaboración de documentos de requisitos, técnicas de entrevista, análisis de casos de uso",
            criterios_evaluacion: "El documento de requisitos especifica completamente las necesidades del cliente"
        }
    ];
}

// Función auxiliar para buscar planeación en diferentes estructuras de datos
const buscarPlaneacionEnDatos = (datos, idPlaneacion) => {
    if (!datos) return null;
    
    // Si datos es un array directo
    if (Array.isArray(datos)) {
        return datos.find(p => 
            p.id_planeacion == idPlaneacion || 
            p.id == idPlaneacion
        );
    }
    
    // Si datos tiene propiedad data (respuesta del backend)
    if (datos.data && Array.isArray(datos.data)) {
        return datos.data.find(p => 
            p.id_planeacion == idPlaneacion || 
            p.id == idPlaneacion
        );
    }
    
    // Si datos tiene propiedad success y data
    if (datos.success && datos.data && Array.isArray(datos.data)) {
        return datos.data.find(p => 
            p.id_planeacion == idPlaneacion || 
            p.id == idPlaneacion
        );
    }
    
    return null;
};

// Función para generar datos mock completos
const generarDatosMockCompletos = async (idPlaneacion) => {
    logger.debug('🔄 Generando datos mock completos...');
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
        id: idPlaneacion,
        id_planeacion: idPlaneacion,
        id_ficha: '3',
        trimestre: 1,
        fecha_creacion: new Date().toISOString(),
        fecha_actualizacion: new Date().toISOString(),
        estado: 'publicada',
        observaciones: 'Planeación pedagógica para el Trimestre 1 - Ficha 3',
        total_raps: 1,
        raps: [
            {
                id: 4,
                id_rap: 4,
                codigo_rap: "01",
                codigo: "01",
                nombre_rap: "IDENTIFICAR LOS PRINCIPIOS Y LEYES DE LA FÍSICA EN LA SOLUCIÓN DE PROBLEMAS DE ACUERDO AL",
                nombre: "IDENTIFICAR LOS PRINCIPIOS Y LEYES DE LA FÍSICA EN LA SOLUCIÓN DE PROBLEMAS DE ACUERDO AL",
                competencia: "FISICA",
                horas_trimestre: 48,
                saberes_conceptos: "Principios de análisis de requisitos, técnicas de especificación",
                saberes_proceso: "Elaboración de documentos de requisitos, técnicas de entrevista",
                criterios_evaluacion: "El documento de requisitos especifica completamente las necesidades",
                actividades_aprendizaje: "Los aprendices realizarán entrevistas con stakeholders y documentarán los requisitos funcionales y no funcionales del sistema.",
                duracion_directa: 38,
                duracion_independiente: 10,
                descripcion_evidencia: "Documento de especificación de requisitos con casos de uso y diagramas de flujo.",
                estrategias_didacticas: "aprendizaje-basado-proyectos",
                ambientes_aprendizaje: "aula",
                materiales_formacion: "Computadores, software de diagramación, plantillas de documentación, casos de estudio.",
                observaciones: "Enfocarse en la claridad y completitud de los requisitos."
            }
        ],
        info_ficha: {
            ficha: {
                id_ficha: '3',
                codigo_ficha: 'Ficha 3',
                nombre_programa: 'Tecnólogo en Desarrollo de Software'
            },
            programa: {
                nombre_programa: "Tecnólogo en Desarrollo de Software",
                codigo_programa: "228118",
                version_programa: "v1.0"
            },
            proyecto: {
                nombre_proyecto: "Sistema de Gestión Académica",
                codigo_proyecto: "PROY-001",
                fase_proyecto: "Fase de Análisis y Diseño",
                actividad_proyecto: "Diseño de la solución informática"
            }
        },
        instructor: {
            nombre: "Instructor",
            apellido: "Demo"
        }
    };
};

// Función mejorada para obtener información de ficha con manejo de errores específico
const obtenerInfoFichaCompleta = async (idFicha) => {
  // Si ya tenemos datos buenos en cache, usarlos
  if (window.fichaCache && 
      window.fichaCache.id === idFicha && 
      window.fichaCache.data.ficha.codigo_ficha) {
    logger.debug('📦 Usando cache válido de ficha:', idFicha);
    return window.fichaCache.data;
  }

    try {
        logger.debug(`🔄 Obteniendo información completa de ficha ${idFicha}...`);

        let fichaData = {
            id_ficha: idFicha,
            codigo_ficha: `Ficha ${idFicha}`,
            nombre_programa: 'Programa de Formación'
        };

        try {
            logger.debug(`🌐 Intentando conectar al backend para ficha ${idFicha}...`);
            const fichaResponse = await fetchWithTimeout(`/fichas/${idFicha}`);

            if (fichaResponse.ok) {
                const responseData = await fichaResponse.json();
                
                // Manejar el caso específico de error del backend
                if (responseData.error) {
                    logger.warn(`⚠️ Backend reportó error: ${responseData.error}`);
                    if (responseData.error.includes("No se encontraron fichas")) {
                        throw new Error(`No se encontró la ficha ${idFicha} en el sistema`);
                    }
                } else {
                    fichaData = responseData;
                    logger.debug(`✅ Datos de ficha obtenidos del backend:`, fichaData);
                }
            } else if (fichaResponse.status === 404) {
                logger.warn(`⚠️ Ficha ${idFicha} no encontrada en el backend`);
                throw new Error(`Ficha ${idFicha} no existe en el sistema`);
            } else {
                logger.warn(`⚠️ Error ${fichaResponse.status} obteniendo ficha ${idFicha}`);
                throw new Error(`Error del servidor: ${fichaResponse.status}`);
            }
        } catch (fetchError) {
            logger.warn(`🌐 Error obteniendo ficha del backend: ${fetchError.message}`);
            // Continuamos con datos por defecto
        }

        let programaData = {
            nombre_programa: fichaData.nombre_programa || fichaData.programa?.nombre || 'Tecnólogo en Desarrollo de Software',
            codigo_programa: fichaData.codigo_programa || fichaData.programa?.codigo || '228118',
            version_programa: fichaData.version_programa || fichaData.programa?.version || 'v1.0'
        };

        let proyectoData = {
            nombre_proyecto: fichaData.proyecto?.nombre || 'Proyecto Formativo en Desarrollo de Software',
            codigo_proyecto: fichaData.proyecto?.codigo || 'PROY-001',
            fase_proyecto: fichaData.proyecto?.fase || 'Fase de Implementación',
            actividad_proyecto: fichaData.proyecto?.actividad || 'Desarrollo de solución informática integral'
        };

        const infoCompleta = {
            ficha: fichaData,
            programa: programaData,
            proyecto: proyectoData
        };

        window.fichaCache = {
            id: idFicha,
            data: infoCompleta,
            timestamp: Date.now()
        };

        logger.debug(`🎉 Información de ficha preparada:`, infoCompleta);
        return infoCompleta;

    } catch (error) {
        logger.error('💥 Error crítico obteniendo info ficha:', error);
        const datosMinimos = {
            ficha: { 
                id_ficha: idFicha, 
                codigo_ficha: `Ficha ${idFicha}`, 
                nombre_programa: 'Programa de Formación',
                error: error.message 
            },
            programa: { 
                nombre_programa: 'Tecnólogo en Desarrollo de Software', 
                codigo_programa: '228118', 
                version_programa: 'v1.0' 
            },
            proyecto: { 
                nombre_proyecto: 'Proyecto Formativo', 
                codigo_proyecto: 'PROY-001', 
                fase_proyecto: 'Fase de Implementación', 
                actividad_proyecto: 'Desarrollo de solución informática' 
            }
        };

        window.fichaCache = {
            id: idFicha,
            data: datosMinimos,
            timestamp: Date.now()
        };

        return datosMinimos;
    }
};

// Función para obtener RAPs por ficha y trimestre
const obtenerRAPsPorFichaYTrimestre = async (idFicha, trimestre) => {
    try {
        logger.debug(`🔄 Iniciando obtención de RAPs para ficha ${idFicha}, trimestre ${trimestre}`);

        let sabanaData;
        try {
            sabanaData = await obtenerSabanaPorFicha(idFicha);
            logger.debug(`📊 Datos de sábana obtenidos:`, sabanaData?.length || 0, 'RAPs totales');
        } catch (sabanaError) {
            logger.warn('⚠️ Error obteniendo sábana, usando datos mock:', sabanaError.message);
            return await obtenerRAPsMock(idFicha, trimestre);
        }

        if (!sabanaData || sabanaData.length === 0) {
            logger.warn('⚠️ No hay datos de sábana, usando datos mock');
            return await obtenerRAPsMock(idFicha, trimestre);
        }

        // Filtrar solo los RAPs que están asignados al trimestre específico
        const rapsDelTrimestre = sabanaData.filter(rap => {
            const horasTrimestre = rap[`t${trimestre}_htrim`];
            return horasTrimestre && horasTrimestre > 0;
        });

        logger.debug(`🎯 RAPs en trimestre ${trimestre}:`, rapsDelTrimestre.length);

        if (rapsDelTrimestre.length === 0) {
            logger.debug(`ℹ️ No hay RAPs asignados al trimestre ${trimestre}`);
            return [];
        }

        // Obtener información COMPLETA de cada RAP
        const rapsCompletos = await Promise.all(
            rapsDelTrimestre.map(async (rap) => {
                try {
                    logger.debug(`\n🔍 Obteniendo info completa para RAP ${rap.id_rap} - ${rap.codigo_rap}`);

                    let saberesConceptos = 'Principios de programación orientada a objetos, patrones de diseño, metodologías de desarrollo';
                    let saberesProceso = 'Análisis de requisitos, diseño de arquitectura, implementación, pruebas';
                    let criteriosEvaluacion = 'El sistema cumple con los requisitos funcionales y no funcionales especificados';

                    try {
                        const [saberesResponse, procesosResponse, criteriosResponse] = await Promise.allSettled([
                            fetchWithTimeout(`/raps/${rap.id_rap}/saberes`),
                            fetchWithTimeout(`/raps/${rap.id_rap}/procesos`),
                            fetchWithTimeout(`/raps/${rap.id_rap}/criterios`)
                        ]);

                        if (saberesResponse.status === 'fulfilled' && saberesResponse.value.ok) {
                            const result = await saberesResponse.value.json();
                            saberesConceptos = result.data?.map(s => s.nombre).join(', ') || saberesConceptos;
                        }

                        if (procesosResponse.status === 'fulfilled' && procesosResponse.value.ok) {
                            const result = await procesosResponse.value.json();
                            saberesProceso = result.data?.map(p => p.nombre).join(', ') || saberesProceso;
                        }

                        if (criteriosResponse.status === 'fulfilled' && criteriosResponse.value.ok) {
                            const result = await criteriosResponse.value.json();
                            criteriosEvaluacion = result.data?.map(c => c.nombre).join(', ') || criteriosEvaluacion;
                        }

                    } catch (apiError) {
                        logger.warn(`⚠️ Error en APIs de RAP ${rap.id_rap}, usando valores por defecto:`, apiError.message);
                    }

                    const rapCompleto = {
                        id: rap.id_rap,
                        codigo: rap.codigo_rap,
                        nombre: rap.descripcion_rap,
                        duracion: rap.duracion_rap,
                        competencia: rap.nombre_competencia,
                        codigo_norma: rap.codigo_norma,
                        horas_trimestre: rap[`t${trimestre}_htrim`],
                        saberes_conceptos: saberesConceptos,
                        saberes_proceso: saberesProceso,
                        criterios_evaluacion: criteriosEvaluacion
                    };

                    logger.debug(`✅ RAP ${rap.id_rap} completo:`, rapCompleto);
                    return rapCompleto;

                } catch (error) {
                    logger.error(`💥 Error obteniendo info completa del RAP ${rap.id_rap}:`, error);
                    const rapDefault = {
                        id: rap.id_rap,
                        codigo: rap.codigo_rap,
                        nombre: rap.descripcion_rap,
                        duracion: rap.duracion_rap,
                        competencia: rap.nombre_competencia,
                        codigo_norma: rap.codigo_norma,
                        horas_trimestre: rap[`t${trimestre}_htrim`],
                        saberes_conceptos: 'Principios de programación orientada a objetos, patrones de diseño, metodologías de desarrollo',
                        saberes_proceso: 'Análisis de requisitos, diseño de arquitectura, implementación, pruebas',
                        criterios_evaluacion: 'El sistema cumple con los requisitos funcionales y no funcionales especificados'
                    };
                    return rapDefault;
                }
            })
        );

        logger.debug(`\n🎉 PROCESO COMPLETADO - RAPs obtenidos:`, rapsCompletos.length);
        return rapsCompletos;

    } catch (error) {
        logger.error('💥 Error general obteniendo RAPs del trimestre:', error);
        return await obtenerRAPsMock(idFicha, trimestre);
    }
};

// Función para crear planeación real
const crearPlaneacionReal = async (planeacionData) => {
    try {
        logger.debug('💾 Intentando guardar planeación en backend...');
        const response = await fetchWithTimeout('/planeaciones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(planeacionData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('❌ Error del servidor:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        logger.debug('✅ Planeación guardada exitosamente en backend:', result);
        return {
            success: true,
            data: result,
            mensaje: result.mensaje || 'Planeación guardada exitosamente'
        };

    } catch (error) {
        logger.error('💥 Error guardando planeación en backend:', error);
        logger.debug('🔄 Intentando guardar localmente...');
        return await crearPlaneacionLocal(planeacionData);
    }
};

// Función para crear planeación local
const crearPlaneacionLocal = async (planeacionData) => {
    try {
        logger.debug('💾 Guardando planeación localmente CON DATOS COMPLETOS...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Crear la planeación con TODOS los datos necesarios para la visualización
        const planeacionGuardada = {
            id: Date.now(),
            id_planeacion: Date.now(), // Para compatibilidad
            ...planeacionData,
            fecha_creacion: new Date().toISOString(),
            fecha_actualizacion: new Date().toISOString(),
            guardado_local: true,
            estado: 'publicada',
            // Asegurar que tenemos todos los campos necesarios para la vista
            trimestre: planeacionData.trimestre,
            id_ficha: planeacionData.id_ficha,
            // Asegurar que info_ficha esté presente
            info_ficha: planeacionData.info_ficha || {
                ficha: planeacionData.ficha,
                programa: planeacionData.programa,
                proyecto: planeacionData.proyecto
            },
            // Asegurar que los RAPs tengan la estructura correcta
            raps: planeacionData.raps ? planeacionData.raps.map(rap => ({
                id: rap.id_rap || rap.id,
                id_rap: rap.id_rap || rap.id,
                codigo_rap: rap.codigo_rap || rap.codigo,
                nombre_rap: rap.nombre_rap || rap.nombre,
                competencia: rap.competencia,
                horas_trimestre: rap.horas_trimestre,
                saberes_conceptos: rap.saberes_conceptos,
                saberes_proceso: rap.saberes_proceso,
                criterios_evaluacion: rap.criterios_evaluacion,
                // Campos de planeación diligenciados por el usuario
                actividades_aprendizaje: rap.actividades_aprendizaje || rap.actividadesAprendizaje,
                duracion_directa: rap.duracion_directa || rap.duracionDirecta,
                duracion_independiente: rap.duracion_independiente || rap.duracionIndependiente,
                descripcion_evidencia: rap.descripcion_evidencia || rap.descripcionEvidencia,
                estrategias_didacticas: rap.estrategias_didacticas || rap.estrategiasDidacticas,
                ambientes_aprendizaje: rap.ambientes_aprendizaje || rap.ambientesAprendizaje,
                materiales_formacion: rap.materiales_formacion || rap.materialesFormacion,
                observaciones: rap.observaciones
            })) : []
        };

        logger.debug('📋 Planeación completa para guardar:', planeacionGuardada);

        try {
            const planeacionesLocales = JSON.parse(localStorage.getItem('planeaciones_locales') || '[]');

            // Reemplazar si ya existe, o agregar nueva
            const existingIndex = planeacionesLocales.findIndex(p =>
                p.id_planeacion === planeacionGuardada.id_planeacion ||
                p.id === planeacionGuardada.id
            );

            if (existingIndex !== -1) {
                planeacionesLocales[existingIndex] = planeacionGuardada;
                logger.debug('🔄 Planeación actualizada en localStorage');
            } else {
                planeacionesLocales.push(planeacionGuardada);
                logger.debug('✅ Nueva planeación guardada en localStorage');
            }

            localStorage.setItem('planeaciones_locales', JSON.stringify(planeacionesLocales));
            logger.debug('💾 Total de planeaciones en localStorage:', planeacionesLocales.length);
        } catch (storageError) {
            logger.warn('⚠️ No se pudo guardar en localStorage:', storageError);
        }

        logger.debug('✅ Planeación guardada localmente con todos los datos:', planeacionGuardada);
        return {
            success: true,
            data: planeacionGuardada,
            mensaje: 'Planeación guardada localmente (backend no disponible)'
        };

    } catch (error) {
        logger.error('💥 Error guardando localmente:', error);
        return {
            success: false,
            mensaje: 'No se pudo guardar la planeación (ni localmente): ' + error.message
        };
    }
};

// Función para obtener planeaciones locales
const obtenerPlaneacionesLocales = async () => {
    try {
        const planeacionesLocales = JSON.parse(localStorage.getItem('planeaciones_locales') || '[]');
        logger.debug('📂 Planeaciones locales encontradas:', planeacionesLocales.length);
        return { success: true, data: planeacionesLocales };
    } catch (error) {
        logger.error('💥 Error obteniendo planeaciones locales:', error);
        return { success: false, data: [], mensaje: error.message };
    }
};

// Función para obtener todas las planeaciones
const obtenerPlaneaciones = async () => {
    try {
        logger.debug('📥 Obteniendo lista de planeaciones...');
        const response = await fetchWithTimeout('/planeaciones');

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        logger.debug('✅ Planeaciones obtenidas:', data);
        return data;
    } catch (error) {
        logger.error('❌ Error obteniendo planeaciones:', error);
        throw error;
    }
};

// Función para obtener planeaciones por ficha
const obtenerPlaneacionesPorFicha = async (idFicha) => {
    try {
        logger.debug(`📥 Obteniendo planeaciones para ficha ${idFicha}...`);
        const response = await fetchWithTimeout(`/planeaciones/ficha/${idFicha}`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        logger.debug(`✅ Planeaciones para ficha ${idFicha}:`, data);
        return data;
    } catch (error) {
        logger.error('❌ Error obteniendo planeaciones por ficha:', error);
        throw error;
    }
};

// Función para obtener detalles de planeación
const obtenerDetallesPlaneacion = async (idPlaneacion) => {
    try {
        logger.debug(`📋 Obteniendo detalles de planeación ${idPlaneacion}...`);

        // PRIMERO: Buscar en la lista de planeaciones que ya tenemos
        logger.debug(`🔍 Buscando planeación ${idPlaneacion} en datos existentes...`);
        
        // Intentar obtener de localStorage primero
        try {
            const planeacionesLocales = JSON.parse(localStorage.getItem('planeaciones_locales') || '[]');
            const planeacionLocal = planeacionesLocales.find(p =>
                p.id_planeacion == idPlaneacion || 
                p.id == idPlaneacion
            );

            if (planeacionLocal) {
                logger.debug('✅ Planeación encontrada en localStorage:', planeacionLocal);
                return planeacionLocal;
            }
        } catch (localError) {
            logger.warn('⚠️ Error buscando en localStorage:', localError);
        }

        // SEGUNDO: Obtener todas las planeaciones y buscar la específica
        logger.debug(`🌐 Obteniendo lista de planeaciones para buscar ${idPlaneacion}...`);
        
        let planeacionesData;
        
        try {
            // Intentar obtener todas las planeaciones
            const response = await fetchWithTimeout('/planeaciones');
            
            if (response.ok) {
                planeacionesData = await response.json();
                logger.debug('📦 Todas las planeaciones obtenidas:', planeacionesData);
            } else {
                logger.warn(`⚠️ Error ${response.status} obteniendo planeaciones`);
                throw new Error(`Error ${response.status}`);
            }
        } catch (error) {
            logger.warn('🌐 Error obteniendo planeaciones, intentando con datos mock...');
            // Usar datos mock como último recurso
            return await generarDatosMockCompletos(idPlaneacion);
        }

        // Buscar la planeación específica en los datos obtenidos
        const planeacionEncontrada = buscarPlaneacionEnDatos(planeacionesData, idPlaneacion);
        
        if (planeacionEncontrada) {
            logger.debug('✅ Planeación encontrada en datos del backend:', planeacionEncontrada);
            return planeacionEncontrada;
        } else {
            logger.warn(`❌ Planeación ${idPlaneacion} no encontrada en datos del backend`);
            throw new Error('Planeación no encontrada');
        }

    } catch (error) {
        logger.error('💥 Error obteniendo detalles de planeación:', error);
        
        // Último recurso: datos mock
        logger.debug('🔄 Usando datos mock como último recurso...');
        return await generarDatosMockCompletos(idPlaneacion);
    }
};

// Función para eliminar planeación
const eliminarPlaneacion = async (idPlaneacion) => {
    try {
        logger.debug(`🗑️ Intentando eliminar planeación ${idPlaneacion}...`);
        const response = await fetchWithTimeout(`/planeaciones/${idPlaneacion}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error('❌ Error del servidor al eliminar:', errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        logger.debug('✅ Planeación eliminada exitosamente:', result);
        return {
            success: true,
            data: result,
            mensaje: result.mensaje || 'Planeación eliminada exitosamente'
        };

    } catch (error) {
        logger.error('💥 Error eliminando planeación:', error);
        return {
            success: false,
            mensaje: 'No se pudo eliminar la planeación: ' + error.message
        };
    }
};

// Función para verificar salud del backend
const verificarSaludBackend = async () => {
    try {
        logger.debug('🔍 Verificando salud del backend...');
        const response = await fetchWithTimeout('/health');

        if (!response.ok) {
            throw new Error(`Backend respondió con error: ${response.status}`);
        }

        const data = await response.json();
        logger.debug('✅ Backend saludable:', data);
        return { success: true, data };
    } catch (error) {
        logger.error('❌ Backend no disponible:', error);
        return { success: false, error: error.message };
    }
};

// EL OBJETO PRINCIPAL DEL SERVICE
export const planeacionService = {
    obtenerRAPsPorFichaYTrimestre,
    obtenerInfoFichaCompleta,
    crearPlaneacionReal,
    crearPlaneacionLocal,
    obtenerPlaneacionesLocales,
    obtenerPlaneaciones,
    obtenerPlaneacionesPorFicha,
    obtenerDetallesPlaneacion,
    eliminarPlaneacion,
    verificarSaludBackend
};

export default planeacionService;