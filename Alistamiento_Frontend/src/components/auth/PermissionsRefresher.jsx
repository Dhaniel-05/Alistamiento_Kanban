import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

/** Refresca permisos al cambiar de ruta (sin re-login). */
export const PermissionsRefresher = () => {
  const location = useLocation();
  const { refreshPermissions, token } = useAuthContext();

  useEffect(() => {
    if (token && refreshPermissions) {
      refreshPermissions();
    }
  }, [location.pathname, token, refreshPermissions]);

  return null;
};
