import { NavLink } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { tieneAlguno } from '../../utils/permisos';
import './Navbar.css';

const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

const PERMISOS_PANEL = [
  'instructor.crear',
  'programa.leer',
  'ficha.leer',
  'permiso.administrar',
  'fase.gestionar',
];

export const Navbar = () => {
  const { user } = useAuthContext();

  const puedeVerPanel = tieneAlguno(user, PERMISOS_PANEL);

  if (!user || !puedeVerPanel) {
    return null;
  }

  return (
    <nav className="header-nav">
      <NavLink to="/usuarios" className={linkClass}>
        Panel de gestión
      </NavLink>
    </nav>
  );
};
