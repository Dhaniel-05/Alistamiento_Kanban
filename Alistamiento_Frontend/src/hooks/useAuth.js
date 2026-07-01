import { useState, useEffect, useCallback, useRef } from "react";
import { loginRequest, fetchSessionMe } from "../services/authService";
import { logger } from "../utils/logger";

const FOCUS_THROTTLE_MS = 60_000;

const mergeUserSession = (prev, instructor) => {
  if (!instructor) return prev;

  return {
    ...(prev || {}),
    ...instructor,
    permisos: Array.isArray(instructor.permisos) ? [...instructor.permisos] : [],
    primer_acceso: instructor.primer_acceso !== undefined
      ? instructor.primer_acceso
      : prev?.primer_acceso,
  };
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const lastFocusRefreshAtRef = useRef(0);
  const isRefreshingRef = useRef(false);

  const persistUser = useCallback((nextUser) => {
    if (!nextUser) return;
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const refreshPermissions = useCallback(async () => {
    const activeToken = token || localStorage.getItem("token");
    if (!activeToken || isRefreshingRef.current) return;

    isRefreshingRef.current = true;

    try {
      const data = await fetchSessionMe();
      const instructor = data?.instructor ?? data?.user ?? data;

      setUser((prev) => {
        const updated = mergeUserSession(prev, instructor);
        localStorage.setItem("user", JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      logger.warn("No se pudieron refrescar permisos; se mantiene cache local", error.message);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [token]);

  const refreshPermissionsOnFocus = useCallback(() => {
    const now = Date.now();
    if (now - lastFocusRefreshAtRef.current < FOCUS_THROTTLE_MS) {
      return;
    }
    lastFocusRefreshAtRef.current = now;
    refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    if (token && !user) {
      const raw = localStorage.getItem("user");

      try {
        const storedUser = raw ? JSON.parse(raw) : null;
        if (storedUser) setUser(storedUser);
      } catch (error) {
        logger.error("Error al parsear usuario almacenado", error.message);
        localStorage.removeItem("user");
        setUser(null);
      }
    }
  }, [token, user]);

  useEffect(() => {
    if (!token) return undefined;

    refreshPermissions();

    window.addEventListener("focus", refreshPermissionsOnFocus);

    return () => {
      window.removeEventListener("focus", refreshPermissionsOnFocus);
    };
  }, [token, refreshPermissions, refreshPermissionsOnFocus]);

  const login = async (email, password) => {
    try {
      const data = await loginRequest({ email, password });

      if (!data || !data.token) {
        logger.error("Login: no se recibió token del backend");
        return false;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);

      const userData = data.instructor;

      if (userData) {
        const userToStore = mergeUserSession(null, userData);
        persistUser(userToStore);
        await refreshPermissions();
      } else {
        logger.error("Login: no se recibieron datos del instructor");
      }

      return true;
    } catch (error) {
      if (error.code === 'RATE_LIMIT') {
        throw error;
      }
      logger.error("Login fallido", error.message);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("instructor");
  };

  return { user, token, login, logout, refreshPermissions };
};
