import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Usuario } from '../types';

interface AuthContextType {
  user: Usuario | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUser: (user: Usuario | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to auto-login from localStorage token and validate with backend /auth/me
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token) {
          // call /auth/me to validate token
          const raw = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';
          const base = String(raw).replace(/\/+$/g, '');
          const endpoint = base.endsWith('/api') ? `${base}/auth/me` : `${base}/api/auth/me`;
          const resp = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
          if (resp.ok) {
            const data = await resp.json();
            const u = data.data;
            if (u) {
              setUser(u);
              setLoading(false);
              return;
            }
          }
        }
        // fallback: if user exists in localStorage but token invalid, clear
        if (userStr) {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Auto-login error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
      // Normalize base URL from env and avoid duplicate /api segments
      const raw = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';
      const base = String(raw).replace(/\/+$/g, ''); // remove trailing slashes
      const endpoint = base.endsWith('/api') ? `${base}/auth/login` : `${base}/api/auth/login`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const { token, user: userData } = data;

        // Debug: log received user from backend
        console.debug('[Auth] login response user:', userData);

        // Normalize role values to the frontend expected set
        const normalizeRole = (r: any) => {
          if (!r) return 'Instructor';
          const s = String(r).trim().toLowerCase();
          if (s === 'superusuario' || s === 'super usuario' || s === 'super_user') return 'SuperUsuario';
          return 'Instructor';
        };

        const normalizedUser = { ...userData, rol: normalizeRole(userData?.rol) };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
        setUser(normalizedUser as any);

        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const setUserDirect = (u: Usuario | null) => {
    if (u) {
      localStorage.setItem('user', JSON.stringify(u));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setUser(u);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    setUser: setUserDirect,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
