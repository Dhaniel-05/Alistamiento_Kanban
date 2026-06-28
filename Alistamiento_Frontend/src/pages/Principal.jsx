import { Layout } from "../components/layout/Layout";
import "./Principal.css";

export const Principal = () => {
  return (
    <div className="principal-container">
      <header className="menu-superior">
        <nav className="menu-navegacion">
          <ul>
            <li><Link to="/usuarios">Usuarios</Link></li>
            <li><Link to="/programas">Programas</Link></li>
            <li><Link to="/fichas">Fichas</Link></li>
          </ul>
        </nav>
      </header>

      <main className="principal-contenido">
        {/* Espacio vacío para el contenido principal */}
      </main>
    </div>
  );
};