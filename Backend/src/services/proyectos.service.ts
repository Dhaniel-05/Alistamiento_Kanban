import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface Proyecto {
    id_proyecto: number;
    codigo_proyecto: string;
    nombre_proyecto: string;
    tiempo_de_ejecucion?: number;
    info_adicional?: string;
    id_programa: number;
}

/**
 * Obtener todos los proyectos formativos
 */
export async function getAllProyectos(): Promise<any[]> {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      p.*,
      prog.codigo_programa,
      prog.nombre_programa as programa_nombre
    FROM proyecto_formativo p
    LEFT JOIN programa_formativo prog ON p.id_programa = prog.id_programa
    ORDER BY p.nombre_proyecto
  `);

    return rows;
}

/**
 * Obtener un proyecto por ID
 */
export async function getProyectoById(id_proyecto: number): Promise<Proyecto | null> {
    const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      p.*,
      prog.codigo_programa,
      prog.nombre_programa as programa_nombre
    FROM proyecto_formativo p
    LEFT JOIN programa_formativo prog ON p.id_programa = prog.id_programa
    WHERE p.id_proyecto = ?
  `, [id_proyecto]);

    return rows[0] as Proyecto || null;
}

/**
 * Crear un nuevo proyecto formativo
 */
export async function createProyecto(proyectoData: Omit<Proyecto, 'id_proyecto'>): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(`
    INSERT INTO proyecto_formativo (
      codigo_proyecto, nombre_proyecto, tiempo_de_ejecucion,
      info_adicional, id_programa
    ) VALUES (?, ?, ?, ?, ?)
  `, [
        proyectoData.codigo_proyecto,
        proyectoData.nombre_proyecto,
        proyectoData.tiempo_de_ejecucion || null,
        proyectoData.info_adicional || null,
        proyectoData.id_programa
    ]);

    return result.insertId;
}

/**
 * Actualizar un proyecto
 */
export async function updateProyecto(id_proyecto: number, proyectoData: Partial<Proyecto>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (proyectoData.codigo_proyecto !== undefined) {
        fields.push('codigo_proyecto = ?');
        values.push(proyectoData.codigo_proyecto);
    }
    if (proyectoData.nombre_proyecto !== undefined) {
        fields.push('nombre_proyecto = ?');
        values.push(proyectoData.nombre_proyecto);
    }
    if (proyectoData.tiempo_de_ejecucion !== undefined) {
        fields.push('tiempo_de_ejecucion = ?');
        values.push(proyectoData.tiempo_de_ejecucion);
    }
    if (proyectoData.info_adicional !== undefined) {
        fields.push('info_adicional = ?');
        values.push(proyectoData.info_adicional);
    }
    if (proyectoData.id_programa !== undefined) {
        fields.push('id_programa = ?');
        values.push(proyectoData.id_programa);
    }

    if (fields.length === 0) return;

    values.push(id_proyecto);

    await pool.query(`
    UPDATE proyecto_formativo SET ${fields.join(', ')} WHERE id_proyecto = ?
  `, values);
}

/**
 * Eliminar un proyecto
 */
export async function deleteProyecto(id_proyecto: number): Promise<void> {
    await pool.query('DELETE FROM proyecto_formativo WHERE id_proyecto = ?', [id_proyecto]);
}

export default {
    getAllProyectos,
    getProyectoById,
    createProyecto,
    updateProyecto,
    deleteProyecto
};
