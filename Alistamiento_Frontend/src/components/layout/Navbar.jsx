import { NavLink } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import "./Navbar.css";

export const Navbar = () => {
  const { user } = useAuthContext();

  // Si no hay usuario o no es admin, solo mostramos navbar básico o nada
  if (!user || user.rol !== "Administrador") return null;

  return (
    <nav className="header-nav">
      <NavLink to="/usuarios" className="nav-link">Usuarios</NavLink>
      <NavLink to="/roles" className="nav-link">Roles</NavLink>
      <NavLink to="/permisos" className="nav-link">Permisos</NavLink>
      <NavLink to="/rol-permisos" className="nav-link">Rol-Permisos</NavLink>
    </nav>
  );
};
