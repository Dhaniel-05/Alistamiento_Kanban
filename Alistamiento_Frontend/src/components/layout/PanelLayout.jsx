import { Header } from "./Header";
import { NavLink, Outlet } from "react-router-dom";
import "./PanelLayout.css";

export const PanelLayout = () => {
  return (
    <div className="panel-container">
      {/* Header superior */}
      <Header />

      {/* Barra de pestañas */}
      <nav className="panel-tabs">
        <NavLink
          to="/principal/usuarios"
          className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
        >
          👤 Usuarios
        </NavLink>

        <NavLink
          to="/principal/programas"
          className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
        >
          🎓 Programas
        </NavLink>

        <NavLink
          to="/principal/fichas"
          className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
        >
          📋 Fichas
        </NavLink>
      </nav>

      {/* Contenido del panel */}
      <main className="panel-content">
        <Outlet /> {/* 👈 Aquí React Router inyecta la página activa */}
      </main>
    </div>
  );
};
