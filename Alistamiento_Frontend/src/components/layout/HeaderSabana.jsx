// src/components/layout/HeaderSabana.jsx
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import "./HeaderSabana.css";
import logo from "../../assets/nodorap.png";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export const HeaderSabana = ({ ficha, programa, gestor }) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleVolver = () => {
    navigate("/instructor");
  };

  return (
    <header className="header-sabana">
      {/* Lado Izquierdo - Logo, Volver y Info de Ficha */}
      <div className="header-sabana-left">
        <div className="header-logo-volver">
          <img src={logo} alt="NodoRAP" className="header-logo-img" />
          <button onClick={handleVolver} className="volver-btn">
            <ArrowBackIcon sx={{ fontSize: 18, marginRight: 1 }} />
            Volver
          </button>
          <div className="ficha-separator">|</div>
          {/* <span className="ficha-codigo">{ficha?.codigo_ficha || 'N/A'}</span> */}
        </div>

        <div className="programa-info">
          <h2 className="programa-nombre">
            {programa?.nombre_programa || 'Programa no asignado'}
          </h2>
          <span className="gestor-tag"></span>
        </div>
      </div>

      {/* Lado Derecho - Info Usuario */}
      <div className="header-sabana-right">
        <div className="ficha-codigo-large">
          {/* {ficha?.codigo_ficha || 'N/A'} */}
        </div>
        
        <div className="user-info">
          <div className="user-details">
            <span className="user-role">{user?.rol}</span>
            <span className="user-name">
              <AccountCircleIcon sx={{ fontSize: 14, marginRight: 1 }} />
              {user?.nombre} {user?.apellido}
            </span>
          </div>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          <LogoutIcon sx={{ fontSize: 18, marginRight: 1 }} />
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};