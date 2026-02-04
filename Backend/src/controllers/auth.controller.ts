import { Request, Response } from 'express';
import { pool } from '../config/database';
import authService from '../services/auth.service';

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body; // identifier puede ser correo o num_ident

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Faltan credenciales' });
    }

    // Ajustar la consulta a la estructura de la base de datos (alistamiento.sql)
    // La tabla usuarios usa columnas: id_usuario, nom_completo, num_ident, correo, especialidad, contrasena, rol
    const [rows] = await pool.query(
      `SELECT id_usuario AS id, nom_completo, ini_nom, num_ident, correo, especialidad, contrasena, rol
       FROM usuarios
       WHERE (correo = ? OR num_ident = ?) AND contrasena = ?
       LIMIT 1`,
      [identifier, identifier, password]
    );

    const users: any = rows as any[];
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const u = users[0];
    // Mapear campos para que coincidan con lo que el frontend espera (mantener valores tal como están en DB)
    const mappedRole = u.rol;

    const user = {
      id: u.id,
      ini_nom: u.ini_nom || null,
      nombres: null,
      apellidos: null,
      correo: u.correo,
      perfil_profesional: u.especialidad || null,
      rol: mappedRole,
      nombre_completo: u.nom_completo || null,
      num_ident: u.num_ident
    };

    // Crear JWT token y devolverlo
    const token = authService.createJWT(user);
    return res.json({ success: true, token, user });
  } catch (error) {
    console.error('Auth login error:', error);
    return res.status(500).json({ success: false, message: 'Error interno en autenticación' });
  }
};

// GET /api/auth/me
export const me = async (req: Request, res: Response) => {
  try {
    const auth = req.headers['authorization'] || req.headers['x-access-token'];
    if (!auth) return res.status(401).json({ success: false, error: 'No autorizado' });
    const token = String(auth).replace(/^Bearer\s+/i, '').trim();
    const user = authService.getUserByToken(token);
    if (!user) return res.status(401).json({ success: false, error: 'Token inválido' });
    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('Auth me error:', err);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
  try {
    // JWT token is stateless, no need to destroy session unless implementing blacklist
    return res.json({ success: true });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
};

// GET /api/auth/users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id_usuario AS id, nom_completo, ini_nom, num_ident, correo, especialidad, rol
       FROM usuarios`
    );

    const users = (rows as any[]).map(u => ({
      id_usuario: u.id,
      nom_completo: u.nom_completo,
      ini_nom: u.ini_nom,
      num_ident: u.num_ident,
      correo: u.correo,
      especialidad: u.especialidad,
      rol: u.rol
    }));

    return res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
};

// POST /api/auth/register - Registro de nuevos usuarios
export const register = async (req: Request, res: Response) => {
  try {
    const { nom_completo, num_ident, nombres, apellidos, especialidad, correo, contrasena, rol } = req.body;

    // Validaciones
    if (!nom_completo || !num_ident || !correo || !contrasena) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre completo, número de identificación, correo y contraseña'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ success: false, message: 'Formato de correo electrónico inválido' });
    }

    // Verificar si el usuario ya existe
    const [existing] = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE num_ident = ? OR correo = ?',
      [num_ident, correo]
    );

    const existingUsers: any = existing as any[];
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un usuario con ese número de identificación o correo electrónico'
      });
    }

    // Generar iniciales del nombre
    const ini_nom = nom_completo.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 3);

    // Insertar nuevo usuario
    const [result] = await pool.query(
      `INSERT INTO usuarios (nom_completo, ini_nom, num_ident, correo, especialidad, contrasena, rol)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nom_completo, ini_nom, num_ident, correo, especialidad || null, contrasena, rol || 'Instructor']
    );

    const insertResult: any = result;
    const newUserId = insertResult.insertId;

    // Enviar email de bienvenida (opcional, no bloquear si falla)
    try {
      const { sendInstructorWelcomeEmail } = await import('../services/email.service');
      await sendInstructorWelcomeEmail(correo, nom_completo, num_ident, contrasena);
    } catch (emailError) {
      console.warn('⚠️ No se pudo enviar email de bienvenida:', emailError);
    }

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      userId: newUserId
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ success: false, message: 'Error al registrar usuario' });
  }
};

// POST /api/auth/request-password-reset - Solicitar recuperación de contraseña
export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const { num_ident, correo } = req.body;

    if (!num_ident || !correo) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere número de identificación y correo electrónico'
      });
    }

    // Buscar usuario
    const [rows] = await pool.query(
      'SELECT id_usuario, nom_completo, num_ident, correo FROM usuarios WHERE num_ident = ? AND correo = ?',
      [num_ident, correo]
    );

    const users: any = rows as any[];
    if (!users || users.length === 0) {
      // Por seguridad, no revelar si el usuario existe o no
      return res.json({
        success: true,
        message: 'Si existe una cuenta con esos datos, recibirás un correo con instrucciones'
      });
    }

    const user = users[0];

    // Generar token JWT con expiración de 1 hora
    const resetToken = authService.createJWT({
      userId: user.id_usuario,
      num_ident: user.num_ident,
      correo: user.correo,
      type: 'password-reset'
    }, '1h');

    // Enviar email
    const { sendPasswordResetEmail } = await import('../services/email.service');
    const emailSent = await sendPasswordResetEmail(user.correo, user.nom_completo, resetToken);

    if (!emailSent.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el correo de recuperación'
      });
    }

    return res.json({
      success: true,
      message: 'Se ha enviado un correo con instrucciones para recuperar tu contraseña'
    });
  } catch (error) {
    console.error('Error en solicitud de recuperación:', error);
    return res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
};

// POST /api/auth/reset-password - Cambiar contraseña con token
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere token y nueva contraseña'
      });
    }

    // Validar y decodificar token
    const decoded: any = authService.verifyJWT(token);
    if (!decoded || decoded.type !== 'password-reset') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Actualizar contraseña
    await pool.query(
      'UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?',
      [newPassword, decoded.userId]
    );

    return res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    return res.status(500).json({ success: false, message: 'Error al cambiar la contraseña' });
  }
};
