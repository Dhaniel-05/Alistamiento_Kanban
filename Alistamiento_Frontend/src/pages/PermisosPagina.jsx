import { Navigate } from 'react-router-dom';

/** Redirige rutas legacy al panel unificado de usuarios. */
export const PermisosPagina = () => <Navigate to="/usuarios?tab=permisos" replace />;
