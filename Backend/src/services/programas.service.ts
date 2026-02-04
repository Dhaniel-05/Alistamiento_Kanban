import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

interface Programa {
  id_programa: number;
  codigo_programa: string;
  nombre_programa: string;
  titulo_obtenido: string;
  tipo_programa?: string;
  version?: string;
  duracion_total_programa: number;
  duracion_etapa_lectiva?: number;
  duracion_etapa_productiva?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
}

/**
 * Obtener todos los programas formativos
 */
export async function getAllProgramas(): Promise<Programa[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      p.*,
      COUNT(DISTINCT f.id_ficha) as total_fichas,
      COUNT(DISTINCT c.id_competencia) as total_competencias
    FROM programa_formativo p
    LEFT JOIN fichas f ON p.id_programa = f.id_programa
    LEFT JOIN competencias c ON p.id_programa = c.id_programa
    GROUP BY p.id_programa
    ORDER BY p.nombre_programa
  `);

  return rows as Programa[];
}

/**
 * Obtener un programa por ID
 */
export async function getProgramaById(id_programa: number): Promise<Programa | null> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT * FROM programa_formativo WHERE id_programa = ?
  `, [id_programa]);

  return rows[0] as Programa || null;
}

/**
 * Obtener competencias de un programa
 */
export async function getCompetenciasByPrograma(id_programa: number): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      c.*,
      COUNT(DISTINCT r.id_resultado) as total_resultados
    FROM competencias c
    LEFT JOIN resultado_de_aprendizaje r ON c.id_competencia = r.id_competencia AND r.id_ficha IS NULL
    WHERE c.id_programa = ?
    GROUP BY c.id_competencia
    ORDER BY c.codigo_competencia
  `, [id_programa]);

  return rows;
}

/**
 * Obtener resultados plantilla de una competencia
 */
export async function getResultadosPlantillaByCompetencia(id_competencia: number): Promise<any[]> {
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT * FROM resultado_de_aprendizaje
    WHERE id_competencia = ? AND id_ficha IS NULL
    ORDER BY orden
  `, [id_competencia]);

  return rows;
}

/**
 * Crear un nuevo programa formativo
 */
export async function createPrograma(programaData: Omit<Programa, 'id_programa'>): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(`
    INSERT INTO programa_formativo (
      codigo_programa, nombre_programa, titulo_obtenido, tipo_programa,
      version, duracion_total_programa, duracion_etapa_lectiva,
      duracion_etapa_productiva, fecha_inicio, fecha_fin
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    programaData.codigo_programa,
    programaData.nombre_programa,
    programaData.titulo_obtenido,
    programaData.tipo_programa || null,
    programaData.version || null,
    programaData.duracion_total_programa,
    programaData.duracion_etapa_lectiva || null,
    programaData.duracion_etapa_productiva || null,
    programaData.fecha_inicio || null,
    programaData.fecha_fin || null
  ]);

  return result.insertId;
}

/**
 * Actualizar un programa formativo
 */
export async function updatePrograma(
  id_programa: number,
  programaData: Partial<Omit<Programa, 'id_programa'>>
): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];

  if (programaData.codigo_programa) {
    fields.push('codigo_programa = ?');
    values.push(programaData.codigo_programa);
  }
  if (programaData.nombre_programa) {
    fields.push('nombre_programa = ?');
    values.push(programaData.nombre_programa);
  }
  if (programaData.titulo_obtenido) {
    fields.push('titulo_obtenido = ?');
    values.push(programaData.titulo_obtenido);
  }
  if (programaData.tipo_programa !== undefined) {
    fields.push('tipo_programa = ?');
    values.push(programaData.tipo_programa);
  }
  if (programaData.version !== undefined) {
    fields.push('version = ?');
    values.push(programaData.version);
  }
  if (programaData.duracion_total_programa !== undefined) {
    fields.push('duracion_total_programa = ?');
    values.push(programaData.duracion_total_programa);
  }
  if (programaData.duracion_etapa_lectiva !== undefined) {
    fields.push('duracion_etapa_lectiva = ?');
    values.push(programaData.duracion_etapa_lectiva);
  }
  if (programaData.duracion_etapa_productiva !== undefined) {
    fields.push('duracion_etapa_productiva = ?');
    values.push(programaData.duracion_etapa_productiva);
  }
  if (programaData.fecha_inicio !== undefined) {
    fields.push('fecha_inicio = ?');
    values.push(programaData.fecha_inicio);
  }
  if (programaData.fecha_fin !== undefined) {
    fields.push('fecha_fin = ?');
    values.push(programaData.fecha_fin);
  }

  if (fields.length === 0) return;

  values.push(id_programa);

  await pool.query(`
    UPDATE programa_formativo SET ${fields.join(', ')} WHERE id_programa = ?
  `, values);
}

/**
 * Eliminar un programa formativo
 * 
 * Reglas de eliminación:
 * 1. No permite eliminar si hay fichas asociadas
 * 2. No permite eliminar si hay competencias/resultados asociados a fichas (id_ficha IS NOT NULL)
 * 3. Elimina todos los proyectos asociados al programa
 * 4. Elimina competencias y resultados plantilla (id_ficha IS NULL)
 * 5. Elimina el programa
 */
export async function deletePrograma(id_programa: number): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    console.log(`[DELETE PROGRAMA] Iniciando eliminación del programa ${id_programa}`);

    // 1. Verificar si hay fichas asociadas
    const [fichas] = await connection.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM fichas WHERE id_programa = ?
    `, [id_programa]);

    if (fichas[0].count > 0) {
      throw new Error(`No se puede eliminar el programa. Tiene ${fichas[0].count} ficha(s) asociada(s). Elimine las fichas primero.`);
    }

    // 2. Verificar si hay competencias asociadas a fichas (estas no se deben eliminar)
    const [competenciasFichas] = await connection.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count FROM competencias 
      WHERE id_programa = ? AND id_ficha IS NOT NULL
    `, [id_programa]);

    if (competenciasFichas[0].count > 0) {
      throw new Error(`No se puede eliminar el programa. Tiene ${competenciasFichas[0].count} competencia(s) asociada(s) a fichas existentes. Estas competencias pertenecen a las fichas y deben eliminarse junto con ellas.`);
    }

    // 3. Eliminar resultados de aprendizaje SIN ficha (plantillas del programa)
    const [resultadosDeleted] = await connection.query<ResultSetHeader>(`
      DELETE r FROM resultado_de_aprendizaje r
      INNER JOIN competencias c ON r.id_competencia = c.id_competencia
      WHERE c.id_programa = ? AND r.id_ficha IS NULL
    `, [id_programa]);
    console.log(`[DELETE PROGRAMA] Eliminados ${resultadosDeleted.affectedRows} resultados plantilla`);

    // 4. Eliminar competencias SIN ficha (plantillas del programa)
    const [competenciasDeleted] = await connection.query<ResultSetHeader>(`
      DELETE FROM competencias 
      WHERE id_programa = ? AND id_ficha IS NULL
    `, [id_programa]);
    console.log(`[DELETE PROGRAMA] Eliminadas ${competenciasDeleted.affectedRows} competencias plantilla`);

    // 5. Eliminar proyectos formativos asociados
    const [proyectosDeleted] = await connection.query<ResultSetHeader>(`
      DELETE FROM proyecto_formativo WHERE id_programa = ?
    `, [id_programa]);
    console.log(`[DELETE PROGRAMA] Eliminados ${proyectosDeleted.affectedRows} proyectos formativos`);

    // 6. Eliminar el programa
    const [programaDeleted] = await connection.query<ResultSetHeader>(`
      DELETE FROM programa_formativo WHERE id_programa = ?
    `, [id_programa]);

    if (programaDeleted.affectedRows === 0) {
      throw new Error('Programa no encontrado');
    }

    console.log(`[DELETE PROGRAMA] Programa ${id_programa} eliminado exitosamente`);
    console.log(`[DELETE PROGRAMA] Resumen: ${proyectosDeleted.affectedRows} proyectos, ${competenciasDeleted.affectedRows} competencias, ${resultadosDeleted.affectedRows} resultados eliminados`);

    await connection.commit();

  } catch (error) {
    await connection.rollback();
    console.error('[DELETE PROGRAMA] Error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

export default {
  getAllProgramas,
  getProgramaById,
  getCompetenciasByPrograma,
  getResultadosPlantillaByCompetencia,
  createPrograma,
  updatePrograma,
  deletePrograma
};
