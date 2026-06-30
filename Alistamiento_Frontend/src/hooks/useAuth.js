import { useState, useEffect } from "react";
import { loginRequest } from "../services/authService";
import { logger } from "../utils/logger";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);

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
        const userToStore = {
          ...userData,
          permisos: Array.isArray(userData.permisos) ? [...userData.permisos] : [],
          primer_acceso: userData.primer_acceso !== undefined ? userData.primer_acceso : true,
        };

        setUser(userToStore);
        localStorage.setItem("user", JSON.stringify(userToStore));
      } else {
        logger.error("Login: no se recibieron datos del instructor");
      }

      return true;
    } catch (error) {
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

  return { user, token, login, logout };
};
