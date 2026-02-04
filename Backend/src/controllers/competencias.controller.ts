

import { Request, Response } from 'express';
import { pool } from '../config/database';

// Obtener instructores asignados a una competencia (basado en resultados de aprendizaje)
export const getInstructoresPorCompetencia = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Obtener instructores únicos que tienen resultados asignados en esta competencia
    const [rows]: any = await pool.query(
      `SELECT DISTINCT
        u.id_usuario AS id_instructor,
        u.nom_completo AS nombre_instructor,
        u.correo,
        COUNT(r.id_resultado) as total_resultados
      FROM resultado_de_aprendizaje r
      INNER JOIN usuarios u ON r.id_usuario = u.id_usuario
      WHERE r.id_competencia = ? AND r.id_usuario IS NOT NULL
      GROUP BY u.id_usuario, u.nom_completo, u.correo
      ORDER BY u.nom_completo`, 
      [id]
    );

    res.json({
      success: true,
      data: rows.map((row: any) => ({
        id_instructor: row.id_instructor,
        nombre_instructor: row.nombre_instructor,
        correo: row.correo,
        total_resultados: row.total_resultados
      }))
    });
  } catch (error) {
    console.error('Error obteniendo instructores de la competencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los instructores de la competencia'
    });
  }
};

// Obtener todas las competencias con sus instructores
export const getCompetenciasConInstructores = async (req: Request, res: Response) => {
    try {
        const [rows]: any = await pool.query(`
          SELECT
            c.id_competencia,
            c.nombre_competencia,
            c.codigo_competencia,
            GROUP_CONCAT(DISTINCT CONCAT(u.id_usuario, ':', u.nom_completo, ':', u.correo) SEPARATOR '||') AS instructores
          FROM competencias c
          LEFT JOIN resultado_de_aprendizaje r ON c.id_competencia = r.id_competencia
          LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
          WHERE r.id_usuario IS NOT NULL
          GROUP BY c.id_competencia, c.nombre_competencia, c.codigo_competencia
        `);
       res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error obteniendo competencias con instructores' });
    }
};
