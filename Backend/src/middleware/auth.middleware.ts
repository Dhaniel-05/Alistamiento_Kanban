import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';

export interface AuthedRequest extends Request {
  user?: any;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const auth = req.headers['authorization'] || req.headers['x-access-token'];
    console.log(`[AUTH] Path: ${req.path}, Method: ${req.method}`);
    console.log(`[AUTH] Authorization header: ${auth ? auth.substring(0, 20) + '...' : 'MISSING'}`);

    if (!auth) {
      console.log(`[AUTH] ❌ No authorization header found`);
      return res.status(401).json({ success: false, error: 'No autorizado' });
    }

    const token = String(auth).replace(/^Bearer\s+/i, '').trim();
    const user = authService.getUserByToken(token);

    if (!user) {
      console.log(`[AUTH] ❌ Token invalid or expired: ${token.substring(0, 20)}...`);
      return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
    }

    console.log(`[AUTH] ✅ User authenticated: ${user.nombre_completo || user.correo}`);
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ success: false, error: 'Error en autenticación' });
  }
}

export default requireAuth;
