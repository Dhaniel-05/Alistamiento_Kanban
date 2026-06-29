import { NavLink } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import "./Navbar.css";

const ADMIN_GESTOR_ROLES = ["Administrador", "Gestor"];

export const Navbar = () => {
  const { user } = useAuthContext();

  if (!user || !ADMIN_GESTOR_ROLES.includes(user.rol)) {
    return null;
  }

  const esAdministrador = user.rol === "Administrador";

  return (
    <nav className="header-nav">
      {esAdministrador && (
        <>
          <NavLink to="/usuarios" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Usuarios
          </NavLink>
          <NavLink to="/roles" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Roles
          </NavLink>
          <NavLink to="/permisos" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Permisos
          </NavLink>
          <NavLink to="/rol-permisos" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Rol-Permisos
          </NavLink>
        </>
      )}
      <NavLink
        to="/fases-configuracion"
        className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
      >
        Config. Fases
      </NavLink>
    </nav>
  );
};
