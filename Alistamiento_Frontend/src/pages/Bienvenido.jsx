import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Layout } from '../components/layout/Layout';
import "./Bienvenido.css";

export const Bienvenido = () => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

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
  </div>
</div>

    </Layout>
  );
};