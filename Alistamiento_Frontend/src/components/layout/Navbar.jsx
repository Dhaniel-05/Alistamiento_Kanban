import { NavLink } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { tienePermiso } from '../../utils/permisos';
import './Navbar.css';

const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

export const Navbar = () => {
  const { user } = useAuthContext();

  const puedeVerUsuarios = tienePermiso(user, 'instructor.crear');
  const puedeAdministrarPermisos = tienePermiso(user, 'permiso.administrar');
  const puedeGestionarFases = tienePermiso(user, 'fase.gestionar');

  if (!user || (!puedeVerUsuarios && !puedeAdministrarPermisos && !puedeGestionarFases)) {
    return null;
  }

  return (
    <nav className="header-nav">
      {puedeVerUsuarios && (
        <NavLink to="/usuarios" className={linkClass}>
          Usuarios
        </NavLink>
      )}
      {puedeAdministrarPermisos && (
        <>
          <NavLink to="/roles" className={linkClass}>
            Roles
          </NavLink>
          <NavLink to="/permisos" className={linkClass}>
            Permisos
          </NavLink>
          <NavLink to="/rol-permisos" className={linkClass}>
            Rol-Permisos
          </NavLink>
        </>
      )}
      {puedeGestionarFases && (
        <NavLink to="/fases-configuracion" className={linkClass}>
          Config. Fases
        </NavLink>
      )}
    </nav>
  );
};
