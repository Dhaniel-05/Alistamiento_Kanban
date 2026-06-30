import { useAuthContext } from '../context/AuthContext';
import { Login } from '../components/login/Login';
import { Bienvenido } from '../pages/Bienvenido';
import { tienePermiso, tieneAlguno } from '../utils/permisos';

export const PrivateRoute = ({ children, permiso, permisos, allowedRoles }) => {
  const { user } = useAuthContext();

  if (!user) return <Login />;
  if (permiso && !tienePermiso(user, permiso)) return <Bienvenido />;
  if (permisos?.length && !tieneAlguno(user, permisos)) return <Bienvenido />;
  if (allowedRoles && !allowedRoles.includes(user.rol)) return <Bienvenido />;

  return children;
};
