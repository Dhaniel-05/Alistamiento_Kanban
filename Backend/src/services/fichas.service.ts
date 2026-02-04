import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader, PoolConnection } from 'mysql2/promise';

interface Ficha {
    id_ficha: number;
    codigo_ficha: string;
    nombre_ficha: string;
    ambiente: string;
    modalidad_formacion: string;
    jornada: 'Diurna' | 'Nocturna';
    estado: 'Por Iniciar' | 'En Progreso' | 'Finalizada';
    fecha_inicio: string;
    fecha_fin: string;
    id_programa: number;
}

interface CreateFichaData {
    codigo_ficha: string;
    nombre_ficha: string;
    ambiente?: string;
    modalidad_formacion: string;
    jornada: 'Diurna' | 'Nocturna';
    fecha_inicio: string;
    fecha_fin: string;
    id_programa: number;
}

/**
 * Obtener todas las fichas con información del programa
 */
export async function getAllFichas(): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      f.*,
      p.nombre_programa,
      p.codigo_programa,
      p.duracion_total_programa,
      COUNT(DISTINCT r.id_resultado) as total_resultados,
      COUNT(DISTINCT ff.id_ficha_fase) as total_fases,
      0 as resultados_completados
    FROM fichas f
    INNER JOIN programa_formativo p ON f.id_programa = p.id_programa
    LEFT JOIN resultado_de_aprendizaje r ON f.id_ficha = r.id_ficha
    LEFT JOIN ficha_fases ff ON f.id_ficha = ff.id_ficha AND ff.activo = 1
    GROUP BY f.id_ficha
    ORDER BY f.fecha_inicio DESC
  `);

    return rows;
}

/**
 * Obtener una ficha por ID
 */
export async function getFichaById(id_ficha: number): Promise<any | null> {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      f.*,
      p.nombre_programa,
      p.codigo_programa,
      p.duracion_total_programa,
      p.duracion_etapa_lectiva,
      p.duracion_etapa_productiva
    FROM fichas f
    INNER JOIN programa_formativo p ON f.id_programa = p.id_programa
    WHERE f.id_ficha = ?
  `, [id_ficha]);

    return rows[0] || null;
}

/**
 * Crear una nueva ficha y copiar competencias/resultados del programa
 */
export async function createFicha(fichaData: CreateFichaData): Promise<number> {
    const connection = await pool.getConnection();

    try {
        console.log('===== INICIANDO CREACION DE FICHA =====');
        console.log('Datos recibidos:', fichaData);

        await connection.beginTransaction();
        console.log('Transacción iniciada');

        // 1. Crear la ficha
        console.log('Inserting ficha...');
        const [result] = await connection.query<ResultSetHeader>(`
            INSERT INTO fichas (
                codigo_ficha, nombre_ficha, ambiente, modalidad_formacion, 
                jornada, estado, fecha_inicio, fecha_fin, id_programa
            ) VALUES (?, ?, ?, ?, ?, 'Por Iniciar', ?, ?, ?)
        `, [
            fichaData.codigo_ficha,
            fichaData.nombre_ficha,
            fichaData.ambiente || '',
            fichaData.modalidad_formacion,
            fichaData.jornada,
            fichaData.fecha_inicio,
            fichaData.fecha_fin,
            fichaData.id_programa
        ]);

        const id_ficha = result.insertId;
        console.log('Ficha insertada con ID:', id_ficha);

        // 2. Copiar fases de configuración según jornada
        console.log('Copiando fases para jornada:', fichaData.jornada);
        try {
            await connection.query(`
                INSERT INTO ficha_fases (id_ficha, nombre_fase, orden, color, activo)
                SELECT ?, nombre_fase, orden, color, 1
                FROM fases_configuracion
                WHERE jornada = ? AND activo = 1
                ORDER BY orden
            `, [id_ficha, fichaData.jornada]);
            console.log('Fases copiadas exitosamente');
        } catch (faseError) {
            console.error('Error al copiar fases:', faseError);
            throw faseError;
        }

        // 3. Copiar competencias y resultados del programa
        console.log('Iniciando copia de competencias...');
        try {
            await copiarCompetenciasYResultados(connection, id_ficha, fichaData.id_programa);
            console.log('Competencias copiadas exitosamente');
        } catch (compError) {
            console.error('Error al copiar competencias:', compError);
            throw compError;
        }

        console.log('Confirmando transacción...');
        await connection.commit();
        console.log('===== FICHA CREADA EXITOSAMENTE - ID:', id_ficha, '=====');
        return id_ficha;

    } catch (error) {
        console.error('===== ERROR EN CREACION DE FICHA =====');
        console.error('Error:', error);
        console.error('Stack:', (error as any)?.stack);
        try {
            await connection.rollback();
            console.log('Transacción revertida');
        } catch (rollbackError) {
            console.error('Error al hacer rollback:', rollbackError);
        }
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Copiar competencias y resultados de aprendizaje del programa a la ficha
 * Incluye:
 * - Competencias a nivel de programa (id_ficha IS NULL)
 * - Sus resultados correspondientes
 */
async function copiarCompetenciasYResultados(connection: PoolConnection, id_ficha: number, id_programa: number): Promise<void> {
    try {
        console.log(`[copiarCompetenciasYResultados] Iniciando copia para ficha ${id_ficha}, programa ${id_programa}`);

        // Obtener competencias del programa (SIN id_ficha - plantillas a nivel programa)
        const [competenciasPrograma] = await connection.query<RowDataPacket[]>(`
            SELECT * FROM competencias 
            WHERE id_programa = ? AND id_ficha IS NULL
        `, [id_programa]);

        const competenciasArray = Array.isArray(competenciasPrograma) ? competenciasPrograma : [];
        console.log(`[copiarCompetenciasYResultados] Competencias de programa encontradas (id_ficha IS NULL): ${competenciasArray.length}`);

        if (competenciasArray.length === 0) {
            console.log(`[copiarCompetenciasYResultados] No hay competencias a nivel de programa para ${id_programa}`);
            return;
        }

        // Para cada competencia del programa, duplicarla para la ficha
        for (const competencia of competenciasArray) {
            console.log(`[copiarCompetenciasYResultados] Procesando competencia: ${competencia.nombre_competencia}`);

            // Insertar la competencia duplicada para esta ficha
            const [resultCompetencia] = await connection.query<ResultSetHeader>(`
                INSERT INTO competencias 
                (nombre_competencia, codigo_competencia, duracion_competencia, norma_competencia, id_programa, id_ficha)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                competencia.nombre_competencia,
                competencia.codigo_competencia || null,
                competencia.duracion_competencia || null,
                competencia.norma_competencia || null,
                id_programa,
                id_ficha
            ]);

            const id_competencia_nueva = resultCompetencia.insertId;
            console.log(`[copiarCompetenciasYResultados] Competencia duplicada con ID: ${id_competencia_nueva}`);

            // Obtener resultados de esta competencia del programa (con id_ficha IS NULL)
            const [resultados] = await connection.query<RowDataPacket[]>(`
                SELECT * FROM resultado_de_aprendizaje 
                WHERE id_competencia = ? AND id_ficha IS NULL
                ORDER BY orden
            `, [competencia.id_competencia]);

            const resultadosArray = Array.isArray(resultados) ? resultados : [];
            console.log(`[copiarCompetenciasYResultados] Resultados de programa encontrados: ${resultadosArray.length}`);

            // Copiar resultados a la nueva competencia
            for (let i = 0; i < resultadosArray.length; i++) {
                const resultado = resultadosArray[i];

                console.log(`[copiarCompetenciasYResultados] Duplicando resultado: ${resultado.nombre_resultado}`);

                await connection.query(`
                    INSERT INTO resultado_de_aprendizaje 
                    (nombre_resultado, codigo, id_competencia, id_ficha, fase_base, fase_vista, orden,
                     conocimientos_saber, conocimientos_proceso, criterios_evaluacion,
                     actividad_aprendizaje, evidencia_aprendizaje, estrategias_didacticas,
                     materiales_formacion, actividad_proyecto)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    resultado.nombre_resultado,
                    resultado.codigo || null,
                    id_competencia_nueva,
                    id_ficha,
                    resultado.fase_base || null,
                    resultado.fase_vista || null,
                    resultado.orden || i,
                    resultado.conocimientos_saber || null,
                    resultado.conocimientos_proceso || null,
                    resultado.criterios_evaluacion || null,
                    resultado.actividad_aprendizaje || null,
                    resultado.evidencia_aprendizaje || null,
                    resultado.estrategias_didacticas || null,
                    resultado.materiales_formacion || null,
                    resultado.actividad_proyecto || null
                ]);
            }

            if (resultadosArray.length === 0) {
                console.log(`[copiarCompetenciasYResultados] No hay resultados para la competencia, no se crea resultado genérico`);
            }
        }

        console.log(`[copiarCompetenciasYResultados] Copia completada para ficha ${id_ficha}`);
    } catch (error) {
        console.error(`[copiarCompetenciasYResultados] Error:`, error);
        throw error;
    }
}

/**
 * Calcular fase_vista automáticamente según fase_base
 */
async function calcularFaseVista(connection: PoolConnection, fase_base: string | null, id_ficha: number): Promise<string | null> {
    if (!fase_base) return null;

    // Obtener fases de la ficha ordenadas
    const [fases] = await connection.query<RowDataPacket[]>(`
    SELECT nombre_fase FROM ficha_fases
    WHERE id_ficha = ? AND activo = 1
    ORDER BY orden
  `, [id_ficha]);

    if (fases.length === 0) return null;

    const fase_base_lower = fase_base.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Prioridad 1: Buscar fase que sea exactamente "fase_base 1" (ej: "Análisis 1")
    for (const fase of fases) {
        const fase_nombre_lower = fase.nombre_fase.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (fase_nombre_lower === `${fase_base_lower} 1` || fase_nombre_lower === `${fase_base_lower}1`) {
            return fase.nombre_fase;
        }
    }

    // Prioridad 2: Buscar fase que sea exactamente el nombre base (ej: "Evaluación")
    for (const fase of fases) {
        const fase_nombre_lower = fase.nombre_fase.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (fase_nombre_lower === fase_base_lower) {
            return fase.nombre_fase;
        }
    }

    // Fallback: Si no encuentra, retornar la primera fase
    return fases[0].nombre_fase;
}

/**
 * Actualizar una ficha
 */
export async function updateFicha(id_ficha: number, fichaData: Partial<CreateFichaData>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (fichaData.codigo_ficha) {
        fields.push('codigo_ficha = ?');
        values.push(fichaData.codigo_ficha);
    }
    if (fichaData.nombre_ficha) {
        fields.push('nombre_ficha = ?');
        values.push(fichaData.nombre_ficha);
    }
    if (fichaData.ambiente !== undefined) {
        fields.push('ambiente = ?');
        values.push(fichaData.ambiente);
    }
    if (fichaData.modalidad_formacion) {
        fields.push('modalidad_formacion = ?');
        values.push(fichaData.modalidad_formacion);
    }
    if (fichaData.fecha_inicio) {
        fields.push('fecha_inicio = ?');
        values.push(fichaData.fecha_inicio);
    }
    if (fichaData.fecha_fin) {
        fields.push('fecha_fin = ?');
        values.push(fichaData.fecha_fin);
    }

    if (fields.length === 0) return;

    values.push(id_ficha);

    await pool.query(`
    UPDATE fichas SET ${fields.join(', ')} WHERE id_ficha = ?
  `, values);
}

/**
 * Eliminar una ficha (cascade elimina resultados y fases)
 */
export async function deleteFicha(id_ficha: number): Promise<void> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Helper para ejecutar delete con mensaje de contexto
        const deleteFrom = async (table: string, query: string, params: any[]) => {
            try {
                await connection.query(query, params);
            } catch (err: any) {
                console.error(`Error eliminando de tabla ${table}:`, err);
                if (err.code === 'ER_NO_SUCH_TABLE') {
                    console.warn(`Tabla ${table} no existe, continuando...`);
                    return;
                }
                throw new Error(`Falló al eliminar en '${table}': ${err.message}`);
            }
        };

        // 1. Eliminar dependencias de Alistamiento
        await deleteFrom('acta', `
            DELETE FROM acta 
            WHERE id_alistamiento IN (SELECT id_alistamiento FROM alistamiento WHERE id_ficha = ?)
        `, [id_ficha]);

        await deleteFrom('guia_aprendizaje', `
            DELETE FROM guia_aprendizaje 
            WHERE id_alistamiento IN (SELECT id_alistamiento FROM alistamiento WHERE id_ficha = ?)
        `, [id_ficha]);

        await deleteFrom('alistamiento', 'DELETE FROM alistamiento WHERE id_ficha = ?', [id_ficha]);

        // 2. Eliminar programación y resultados
        await deleteFrom('planeacion_resultados', 'DELETE FROM planeacion_resultados WHERE id_ficha = ?', [id_ficha]);

        // 3. Eliminar resultados de aprendizaje
        // Primero por id_ficha directo
        await deleteFrom('resultado_de_aprendizaje', 'DELETE FROM resultado_de_aprendizaje WHERE id_ficha = ?', [id_ficha]);

        // Segundo: eliminar resultados que apunten a las competencias de esta ficha (para evitar error de FK)
        // Esto limpia cualquier resultado inconsistente que tenga id_competencia correcto pero id_ficha incorrecto/nulo
        await deleteFrom('resultado_de_aprendizaje_linked', `
            DELETE FROM resultado_de_aprendizaje 
            WHERE id_competencia IN (SELECT id_competencia FROM competencias WHERE id_ficha = ?)
        `, [id_ficha]);

        // 4. Eliminar competencias
        await deleteFrom('competencias', 'DELETE FROM competencias WHERE id_ficha = ?', [id_ficha]);

        // 5. Eliminar fases
        await deleteFrom('ficha_fases', 'DELETE FROM ficha_fases WHERE id_ficha = ?', [id_ficha]);

        // 6. Eliminar asignaciones
        await deleteFrom('asignar_crear_fichas', 'DELETE FROM asignar_crear_fichas WHERE id_ficha = ?', [id_ficha]);

        // 7. Finalmente, eliminar ficha
        await deleteFrom('fichas', 'DELETE FROM fichas WHERE id_ficha = ?', [id_ficha]);

        await connection.commit();
        console.log(`Ficha ${id_ficha} eliminada correctamente con todas sus dependencias.`);

    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar ficha (rollback):', error);
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Obtener resultados de una ficha
 */
export async function getResultadosByFicha(id_ficha: number): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      r.*,
      c.nombre_competencia,
      c.duracion_competencia,
      c.codigo_competencia,
      u.nom_completo as instructor_nombre,
      u.ini_nom as instructor_iniciales,
      u.id_usuario
    FROM resultado_de_aprendizaje r
    INNER JOIN competencias c ON r.id_competencia = c.id_competencia
    LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
    WHERE r.id_ficha = ?
    ORDER BY r.fase_vista, r.orden
  `, [id_ficha]);

    return rows;
}

/**
 * Obtener fases de una ficha
 */
export async function getFasesByFicha(id_ficha: number): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      ff.*,
      COUNT(r.id_resultado) as total_resultados,
      0 as completados
    FROM ficha_fases ff
    LEFT JOIN resultado_de_aprendizaje r ON ff.nombre_fase = r.fase_vista AND ff.id_ficha = r.id_ficha
    WHERE ff.id_ficha = ? AND ff.activo = 1
    GROUP BY ff.id_ficha_fase
    ORDER BY ff.orden
  `, [id_ficha]);

    return rows;
}

/**
 * Obtener progreso de una ficha
 */
export async function getProgresoFicha(id_ficha: number): Promise<any> {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN estado = 'Terminado' THEN 1 ELSE 0 END) as completados,
      SUM(CASE WHEN estado = 'En Proceso' THEN 1 ELSE 0 END) as en_proceso,
      SUM(CASE WHEN estado = 'Por Iniciar' THEN 1 ELSE 0 END) as por_iniciar,
      SUM(CASE WHEN estado = 'Por Asignar' THEN 1 ELSE 0 END) as por_asignar,
      ROUND((SUM(CASE WHEN estado = 'Terminado' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as porcentaje_completado
    FROM resultado_de_aprendizaje
    WHERE id_ficha = ?
  `, [id_ficha]);

    return rows[0] || {
        total: 0,
        completados: 0,
        en_proceso: 0,
        por_iniciar: 0,
        por_asignar: 0,
        porcentaje_completado: 0
    };
}

export default {
    getAllFichas,
    getFichaById,
    createFicha,
    updateFicha,
    deleteFicha,
    getResultadosByFicha,
    getFasesByFicha,
    getProgresoFicha
};
