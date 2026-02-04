import { Router } from 'express';
import { query } from '../config/database';
import requireAuth from '../middleware/auth.middleware';

const router = Router();

// GET /api/planeacion/ficha/:idFicha - Obtener planeación de una ficha
router.get('/ficha/:idFicha', requireAuth, async (req, res) => {
    try {
        const { idFicha } = req.params;
        const planeacion = await query(`
      SELECT 
        p.*,
        r.nombre_resultado as resultado_nombre,
        r.codigo_resultado as resultado_codigo,
        u.nombre_completo as instructor_nombre
      FROM planeacion_pedagogica p
      LEFT JOIN resultado_de_aprendizaje r ON p.id_resultado = r.id_resultado_aprendizaje
      LEFT JOIN usuarios u ON p.id_instructor = u.id_usuario
      WHERE p.id_ficha = ?
      ORDER BY p.fecha_inicio ASC
    `, [idFicha]);
        res.json({ success: true, data: planeacion });
    } catch (err) {
        console.error('Error obteniendo planeación:', err);
        res.status(500).json({ success: false, error: 'Error al obtener planeación' });
    }
});

// POST /api/planeacion - Crear entrada de planeación
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            id_ficha,
            fase_proyecto,
            actividad_proyecto,
            id_resultado,
            fecha_inicio,
            fecha_fin,
            horas,
            id_instructor,
            observaciones
        } = req.body;

        if (!id_ficha) {
            return res.status(400).json({ success: false, error: 'id_ficha es requerido' });
        }

        const sql = `
      INSERT INTO planeacion_pedagogica 
      (id_ficha, fase_proyecto, actividad_proyecto, id_resultado, fecha_inicio, fecha_fin, horas, id_instructor, observaciones)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const [result]: any = await query(sql, [
            id_ficha,
            fase_proyecto,
            actividad_proyecto,
            id_resultado || null,
            fecha_inicio || null,
            fecha_fin || null,
            horas || null,
            id_instructor || null,
            observaciones || null
        ]);

        res.json({ success: true, data: { id_planeacion: result.insertId } });
    } catch (err) {
        console.error('Error creando planeación:', err);
        res.status(500).json({ success: false, error: 'Error al crear planeación' });
    }
});

// PUT /api/planeacion/:id - Actualizar entrada de planeación
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            fase_proyecto,
            actividad_proyecto,
            id_resultado,
            fecha_inicio,
            fecha_fin,
            horas,
            id_instructor,
            observaciones
        } = req.body;

        const sql = `
      UPDATE planeacion_pedagogica 
      SET fase_proyecto = ?, actividad_proyecto = ?, id_resultado = ?, 
          fecha_inicio = ?, fecha_fin = ?, horas = ?, id_instructor = ?, observaciones = ?
      WHERE id_planeacion = ?
    `;

        await query(sql, [
            fase_proyecto,
            actividad_proyecto,
            id_resultado || null,
            fecha_inicio || null,
            fecha_fin || null,
            horas || null,
            id_instructor || null,
            observaciones || null,
            id
        ]);

        res.json({ success: true });
    } catch (err) {
        console.error('Error actualizando planeación:', err);
        res.status(500).json({ success: false, error: 'Error al actualizar planeación' });
    }
});

// DELETE /api/planeacion/:id - Eliminar entrada de planeación
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM planeacion_pedagogica WHERE id_planeacion = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error eliminando planeación:', err);
        res.status(500).json({ success: false, error: 'Error al eliminar planeación' });
    }
});

export default router;
