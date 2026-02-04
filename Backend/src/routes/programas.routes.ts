import { Router } from 'express';
import { query } from '../config/database';
import requireAuth from '../middleware/auth.middleware';

const router = Router();

// GET /api/programas - obtener lista simple de programas
router.get('/', requireAuth, async (req, res) => {
  try {
    const programas = await query(`
      SELECT id_programa as id,
             codigo_programa as codigo,
             nombre_programa as nombre,
             titulo_obtenido,
             tipo_programa,
             version,
             duracion_total_programa as duracion_total,
             duracion_etapa_lectiva as duracion_lectiva,
             duracion_etapa_productiva as duracion_productiva
      FROM programa_formativo
      ORDER BY nombre_programa ASC
    `);

    res.json({ success: true, data: programas });
  } catch (err) {
    console.error('Error obteniendo programas:', err);
    res.status(500).json({ success: false, error: 'Error al obtener programas' });
  }
});

// POST /api/programas - crear programa
router.post('/', requireAuth, async (req, res) => {
  try {
    const { codigo_programa, nombre_programa, titulo_obtenido, tipo_programa, version, duracion_total_programa, duracion_lectiva, duracion_productiva } = req.body;
    if (!codigo_programa || !nombre_programa || !titulo_obtenido || !duracion_total_programa) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }
    const sql = `INSERT INTO programa_formativo (codigo_programa, nombre_programa, titulo_obtenido, tipo_programa, version, duracion_total_programa, duracion_etapa_lectiva, duracion_etapa_productiva) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result]: any = await query(sql, [codigo_programa, nombre_programa, titulo_obtenido, tipo_programa || null, version || null, duracion_total_programa, duracion_lectiva || 0, duracion_productiva || 0]);
    return res.json({ success: true, data: { id_programa: result.insertId } });
  } catch (err) {
    console.error('Error creando programa:', err);
    return res.status(500).json({ success: false, error: 'Error al crear programa' });
  }
});

// PUT /api/programas/:id - actualizar
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo_programa, nombre_programa, titulo_obtenido, tipo_programa, version, duracion_total_programa, duracion_lectiva, duracion_productiva } = req.body;
    await query(`UPDATE programa_formativo SET codigo_programa = ?, nombre_programa = ?, titulo_obtenido = ?, tipo_programa = ?, version = ?, duracion_total_programa = ?, duracion_etapa_lectiva = ?, duracion_etapa_productiva = ? WHERE id_programa = ?`, [codigo_programa, nombre_programa, titulo_obtenido, tipo_programa || null, version || null, duracion_total_programa, duracion_lectiva || 0, duracion_productiva || 0, id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando programa:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar programa' });
  }
});

// DELETE /api/programas/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM programa_formativo WHERE id_programa = ?`, [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error eliminando programa:', err);
    return res.status(500).json({ success: false, error: 'Error al eliminar programa' });
  }
});

export default router;
