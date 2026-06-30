import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { tienePermiso } from "../utils/permisos";
import { Layout } from '../components/layout/Layout';
import "./Bienvenido.css";

export const Bienvenido = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const puedeVerSabana = tienePermiso(user, 'ficha.leer');

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Layout>
     <div className="bienvenido-dashboard">
  <div className="bienvenido-card">
    <h1 className="bienvenido-saludo">
      Bienvenido/a, {user?.nombre}
    </h1>

    <p className="bienvenido-rol">
      Rol: {user?.rol}
    </p>

    {puedeVerSabana && (
      <button
        type="button"
        onClick={() => navigate('/sabana')}
        style={{
          marginTop: '1rem',
          padding: '0.6rem 1.2rem',
          backgroundColor: '#11a1c2',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Ir a Sábana Pedagógica
      </button>
    )}
  </div>
</div>

    </Layout>
  );
};