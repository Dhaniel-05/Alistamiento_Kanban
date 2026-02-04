import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface FaseConfiguracion {
    id_fase_config: number;
    jornada: 'Diurna' | 'Nocturna' | 'Personalizada';
    nombre_fase: string;
    orden: number;
    color: string;
    activo: boolean;
}

interface FichaFase {
    id_ficha_fase: number;
    id_ficha: number;
    nombre_fase: string;
    orden: number;
    color: string;
    activo: boolean;
}

/**
 * Obtener fases de configuración por jornada
 */
export async function getFasesConfiguracion(jornada?: 'Diurna' | 'Nocturna' | 'Personalizada'): Promise<FaseConfiguracion[]> {
    let sql = 'SELECT * FROM fases_configuracion WHERE activo = 1';
    const params: any[] = [];

    if (jornada) {
        sql += ' AND jornada = ?';
        params.push(jornada);
    }

    sql += ' ORDER BY jornada, orden';

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    return rows as FaseConfiguracion[];
}

/**
 * Crear fase personalizada en configuración
 */
export async function createFaseConfiguracion(faseData: Omit<FaseConfiguracion, 'id_fase_config'>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(`
    INSERT INTO fases_configuracion (jornada, nombre_fase, orden, color, activo)
    VALUES (?, ?, ?, ?, ?)
  `, [
        faseData.jornada,
        faseData.nombre_fase,
        faseData.orden,
        faseData.color || '#3B82F6',
        faseData.activo ? 1 : 0
    ]);

    return result.insertId;
}

/**
 * Obtener fases de una ficha específica
 */
export async function getFasesByFicha(id_ficha: number): Promise<FichaFase[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT id_ficha_fase, id_ficha, nombre_fase, orden, color, activo
    FROM ficha_fases
    WHERE id_ficha = ? AND activo = 1
    ORDER BY orden
  `, [id_ficha]);

    return rows as FichaFase[];
}

/**
 * Agregar fase personalizada a una ficha
 */
export async function addFaseToFicha(id_ficha: number, faseData: {
    nombre_fase: string;
    orden: number;
    color?: string;
}): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(`
    INSERT INTO ficha_fases (id_ficha, nombre_fase, orden, color, activo)
    VALUES (?, ?, ?, ?, 1)
  `, [
        id_ficha,
        faseData.nombre_fase,
        faseData.orden,
        faseData.color || '#3B82F6'
    ]);

    return result.insertId;
}

/**
 * Actualizar fase de una ficha
 */
export async function updateFaseFicha(id_ficha: number, id_ficha_fase: number, faseData: {
    nombre_fase?: string;
    orden?: number;
    color?: string;
    activo?: boolean;
}): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (faseData.nombre_fase !== undefined) {
        fields.push('nombre_fase = ?');
        values.push(faseData.nombre_fase);
    }
    if (faseData.orden !== undefined) {
        fields.push('orden = ?');
        values.push(faseData.orden);
    }
    if (faseData.color !== undefined) {
        fields.push('color = ?');
        values.push(faseData.color);
    }
    if (faseData.activo !== undefined) {
        fields.push('activo = ?');
        values.push(faseData.activo ? 1 : 0);
    }

    if (fields.length === 0) return;

    values.push(id_ficha_fase, id_ficha);

    await pool.query(`
    UPDATE ficha_fases 
    SET ${fields.join(', ')}
    WHERE id_ficha_fase = ? AND id_ficha = ?
  `, values);
}

/**
 * Eliminar fase de una ficha (mover resultados a otra fase primero)
 */
export async function deleteFaseFicha(id_ficha: number, id_ficha_fase: number): Promise<void> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Obtener nombre de la fase a eliminar
        const [faseRows] = await connection.query<RowDataPacket[]>(`
      SELECT nombre_fase FROM ficha_fases WHERE id_ficha_fase = ?
    `, [id_ficha_fase]);

        if (faseRows.length === 0) {
            throw new Error('Fase no encontrada');
        }

        const nombreFaseEliminar = faseRows[0].nombre_fase;

        // Obtener la primera fase activa diferente a la que se va a eliminar
        const [fasesActivas] = await connection.query<RowDataPacket[]>(`
      SELECT nombre_fase FROM ficha_fases
      WHERE id_ficha = ? AND activo = 1 AND id_ficha_fase != ?
      ORDER BY orden
      LIMIT 1
    `, [id_ficha, id_ficha_fase]);

        if (fasesActivas.length === 0) {
            throw new Error('No se puede eliminar la última fase activa');
        }

        const faseDestino = fasesActivas[0].nombre_fase;

        // Mover resultados de la fase a eliminar a la fase destino
        await connection.query(`
      UPDATE resultado_de_aprendizaje
      SET fase_vista = ?
      WHERE id_ficha = ? AND fase_vista = ?
    `, [faseDestino, id_ficha, nombreFaseEliminar]);

        // Eliminar la fase
        await connection.query(`
      DELETE FROM ficha_fases 
      WHERE id_ficha_fase = ? AND id_ficha = ?
    `, [id_ficha_fase, id_ficha]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/**
 * Reordenar fases de una ficha
 */
export async function reorderFasesFicha(id_ficha: number, fases: { id_ficha_fase: number; orden: number }[]): Promise<void> {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        for (const fase of fases) {
            await connection.query(`
        UPDATE ficha_fases
        SET orden = ?
        WHERE id_ficha_fase = ? AND id_ficha = ?
      `, [fase.orden, fase.id_ficha_fase, id_ficha]);
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

export default {
    getFasesConfiguracion,
    createFaseConfiguracion,
    getFasesByFicha,
    addFaseToFicha,
    updateFaseFicha,
    deleteFaseFicha,
    reorderFasesFicha
};
