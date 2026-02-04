import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your_super_secret_key';
const TOKEN_EXPIRATION = '1h';  // token expires in 1 hour

// Legacy session storage - optional to keep or remove after migration
const sessions = new Map<string, any>();

function generateTokenString() {
  return Buffer.from(Date.now() + '-' + Math.random()).toString('base64');
}

// Legacy methods (can be removed after full migration)
export function createSession(user: any) {
  const token = generateTokenString();
  sessions.set(token, { user, createdAt: Date.now() });
  return token;
}

export function getUserByTokenLegacy(token: string) {
  if (!token) return null;
  const s = sessions.get(token);
  return s ? s.user : null;
}

export function destroySessionLegacy(token: string) {
  sessions.delete(token);
}

export function debugSessions() {
  return Array.from(sessions.keys());
}

// New JWT methods

export function createJWT(user: any, expiresIn?: string) {
  // Sign token with user info, excluding sensitive data
  const payload = {
    ...user, // Include all user fields
    id: user.id || user.userId,
    correo: user.correo,
    rol: user.rol,
    nombre_completo: user.nombre_completo,
  };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: expiresIn || TOKEN_EXPIRATION });
  return token;
}

export function verifyJWT(token: string) {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    return decoded;
  } catch (err) {
    return null;
  }
}

// Replace getUserByToken usage with JWT verify
export function getUserByToken(token: string) {
  const user = verifyJWT(token);
  return user;
}

export default {
  createSession,
  getUserByToken,
  destroySession: destroySessionLegacy,
  debugSessions,
  createJWT,
  verifyJWT
};
