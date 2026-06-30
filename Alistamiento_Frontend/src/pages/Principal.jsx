import { Link } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { tienePermiso } from '../utils/permisos';
import './Principal.css';

export const Principal = () => {
  const { user } = useAuthContext();
  const puedeGestionarInstructores = tienePermiso(user, 'instructor.crear');

  return (
    <div className="principal-container">
      <header className="menu-superior">
        <nav className="menu-navegacion">
          <ul>
            {puedeGestionarInstructores && (
              <li><Link to="/usuarios">Usuarios</Link></li>
            )}
            <li><Link to="/programas">Programas</Link></li>
            <li><Link to="/fichas">Fichas</Link></li>
          </ul>
        </nav>
      </header>

      <main className="principal-contenido" />
    </div>
  );
};
