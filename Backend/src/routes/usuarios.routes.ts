import { Router } from 'express';
import { pool } from '../config/database';
import requireAuth from '../middleware/auth.middleware';
import { sendInstructorWelcomeEmail } from '../services/email.service';
import crypto from 'crypto';

const router = Router();

// POST /api/usuarios - crear usuario
router.post('/', requireAuth, async (req: any, res) => {
  const connection = await pool.getConnection();
  
  try {
    const { nom_completo, num_ident, ini_nom, especialidad, correo, rol, id_fichas } = req.body;
    
    // Validar campos obligatorios
    if (!nom_completo || !num_ident || !ini_nom || !rol) {
      return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
    }

    // Si es instructor, validar correo
    if (rol === 'Instructor' && !correo) {
      return res.status(400).json({ success: false, error: 'El correo es obligatorio para instructores' });
    }

    await connection.beginTransaction();

    // Generar contraseña aleatoria si no se proporciona
    let contrasena = req.body.contrasena;
    if (!contrasena) {
      contrasena = crypto.randomBytes(8).toString('hex'); // Contraseña de 16 caracteres
    }

    // Crear usuario
    const [result]: any = await connection.query(
      `INSERT INTO usuarios (nom_completo, num_ident, ini_nom, especialidad, correo, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nom_completo, num_ident, ini_nom, especialidad || null, correo || null, contrasena, rol]
    );

    const idUsuario = result.insertId;

    // Si se proporcionaron fichas, asignarlas
    if (id_fichas && Array.isArray(id_fichas) && id_fichas.length > 0) {
      for (const idFicha of id_fichas) {
        await connection.query(
          `INSERT INTO asignar_crear_fichas (id_usuario, id_ficha) VALUES (?, ?)`,
          [idUsuario, idFicha]
        );
      }
    }

    await connection.commit();

    connection.release();

    // Si es instructor y tiene correo, enviar email con credenciales (después de commit)
    if (rol === 'Instructor' && correo) {
      const fichasNombres = id_fichas && Array.isArray(id_fichas) && id_fichas.length > 0
        ? await Promise.all(
            id_fichas.map(async (idFicha: number) => {
              const conn2 = await pool.getConnection();
              try {
                const [fichas]: any = await conn2.query(
                  `SELECT CONCAT(codigo_ficha, ' - ', nombre_ficha) as nombre FROM fichas WHERE id_ficha = ?`,
                  [idFicha]
                );
                return fichas[0]?.nombre || `Ficha ${idFicha}`;
              } finally {
                conn2.release();
              }
            })
          )
        : [];

      const emailResult = await sendInstructorWelcomeEmail(
        correo,
        nom_completo,
        num_ident, // Usuario es el número de identificación
        contrasena,
        fichasNombres
      );

      if (!emailResult.success) {
        console.warn('⚠️ Usuario creado pero no se pudo enviar el correo:', emailResult.error);
      }
    }

    return res.json({ 
      success: true, 
      data: { 
        id_usuario: idUsuario,
        contrasena: rol === 'Instructor' ? contrasena : undefined // Solo devolver si es instructor
      } 
    });
  } catch (err: any) {
    await connection.rollback();
    connection.release();
    console.error('Error creando usuario:', err);
    
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, error: 'Ya existe un usuario con ese número de identificación o correo' });
    }
    
    return res.status(500).json({ success: false, error: 'Error al crear usuario' });
  }
});

// PUT /api/usuarios/:id - actualizar usuario
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom_completo, num_ident, ini_nom, especialidad, correo, contrasena, rol } = req.body;
    await pool.query(
      `UPDATE usuarios SET nom_completo = ?, num_ident = ?, ini_nom = ?, especialidad = ?, correo = ?, contrasena = ?, rol = ? WHERE id_usuario = ?`,
      [nom_completo, num_ident, ini_nom, especialidad || null, correo || null, contrasena || null, rol, id]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando usuario:', err);
    return res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/usuarios/:id - eliminar usuario
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM usuarios WHERE id_usuario = ?`, [id]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    return res.status(500).json({ success: false, error: 'Error al eliminar usuario' });
  }
});

export default router;
