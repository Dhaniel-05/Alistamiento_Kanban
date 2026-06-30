import { Navigate } from 'react-router-dom';

/** Redirige rutas legacy al panel unificado de usuarios. */
export const FasesConfiguracionPagina = () => <Navigate to="/usuarios?tab=fases" replace />;
