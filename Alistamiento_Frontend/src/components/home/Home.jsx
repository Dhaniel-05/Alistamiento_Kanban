import { useNavigate } from "react-router-dom";
import "./Home.css";
import logo from "../../assets/nodorap.png";

export const Home = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <img src={logo} alt="NodoRAP Logo" className="home-logo" />
        <h2 className="home-title">NodoRAP</h2>
        <p className="home-subtitle">
          Sistema de Gestión de Resultados de Aprendizaje y <br />
          Programas de Formación SENA
        </p>
        <button className="home-button" onClick={handleLogin}>
          LOG IN
        </button>
        <p className="home-text">
          Accede a la plataforma para gestionar y consultar información
        </p>
        <footer className="home-footer">
          © 2025 SENA - Servicio Nacional de Aprendizaje
        </footer>
      </div>
    </div>
  );
};
