import { useEffect, useState } from "react";
import { logger } from "../../utils/logger";
import { useAuthContext } from "../../context/AuthContext";
import { leerFichasPorInstructor } from "../../services/instructorService";
import { Layout } from '../../components/layout/Layout';
import "./InstructorDashboard.css";
import { useNavigate } from "react-router-dom";
import httpClient from "../../services/httpClient";

export const InstructorDashboard = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [fichas, setFichas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programas, setProgramas] = useState([]);

  const resolveInstructorId = () => {
    try {
      const rawInstructor = localStorage.getItem("instructor");
      if (rawInstructor) {
        const parsed = JSON.parse(rawInstructor);
        const id = parsed.id || parsed.id_instructor || parsed.instructor_id || parsed.idInstructor;
        if (id) return id;
      }
    } catch (err) {
      logger.warn(" Error leyendo instructor:", err);
    }

    if (user) {
      const id = user.id || user.id_instructor || user.instructor_id || user.idInstructor;
      if (id) return id;
    }

    return null;
  };

  // Cargar programas
  const cargarProgramas = async () => {
    try {
      const res = await httpClient.get('/programas', { validateStatus: () => true });
      const data = res.data;
      setProgramas(data);
    } catch (error) {
      logger.error("Error cargando programas:", error);
    }
  };

  useEffect(() => {
    const id = resolveInstructorId();

    if (!id) {
      setError("No se pudo identificar al instructor.");
      setLoading(false);
      return;
    }

    const fetchFichas = async () => {
      try {
        const data = await leerFichasPorInstructor(id);
        setFichas(Array.isArray(data) ? data : []);
      } catch (err) {
        logger.error(" Error cargando fichas:", err);
        setError("No se pudieron cargar las fichas.");
      } finally {
        setLoading(false);
      }
    };

    cargarProgramas();
    fetchFichas();
  }, [user]);

  // Función para obtener información del programa
  const obtenerInfoPrograma = (idPrograma) => {
    if (!idPrograma || !programas.length) return { nombre: 'Programa no asignado', codigo: 'N/A' };
    
    const programa = programas.find(p => p.id_programa === idPrograma);
    return {
      nombre: programa ? programa.nombre_programa : 'Programa no encontrado',
      codigo: programa ? programa.codigo_programa : 'N/A'
    };
  };

  const formatDate = (raw) => {
    if (!raw) return "";
    const d = new Date(raw);
    return isNaN(d) ? raw : d.toLocaleDateString();
  };

  // NUEVA FUNCIÓN: Manejar clic en tarjeta de ficha
  const handleFichaClick = (fichaId) => {
    navigate(`/sabana/${fichaId}`);
  };

  return (
    <Layout>
      <div className="instructor-dashboard page-container">
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

        {/* SECCIÓN DE FICHAS */}
        <section className="fichas-section">
          <h2 className="section-title">Mis Fichas Asignadas</h2>
          <p className="section-subtitle">
            Selecciona una ficha para gestionar el programa
          </p>

          {loading && <p className="muted">Cargando fichas...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && (
            <>
              <div className="fichas-count">
                {fichas.length} fichas asignadas
              </div>

              <div className="fichas-grid">
                {fichas.map((f) => {
                  const infoPrograma = obtenerInfoPrograma(f.id_programa);
                  return (
                    <article
                      key={f.id_ficha ?? f.id ?? Math.random()}
                      className="ficha-card"
                      onClick={() => handleFichaClick(f.id_ficha || f.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="ficha-card-header">
                        <div>
                          <div className="ficha-codigo">
                            {f.codigo_ficha || f.codigo || 'N/A'}
                          </div>
                          <div className="ficha-subcodigo">
                            {infoPrograma.codigo !== 'N/A' 
                              ? `${infoPrograma.codigo}-${f.codigo_ficha}`
                              : f.codigo_ficha || f.codigo || 'N/A'
                            }
                          </div>
                        </div>
                        <div className="badge badge-active">
                          Activa
                        </div>
                      </div>

                      <div className="program-box">
                        <div className="program-label">PROGRAMA DE FORMACIÓN</div>
                        <div className="program-name">
                          {infoPrograma.nombre}
                        </div>
                        <div className="program-code">
                          Código: {infoPrograma.codigo}
                        </div>
                      </div>

                      <div className="meta-row">
                        <div className="meta-item">
                          <i className="fas fa-user"></i>
                          <span>{user?.nombre || "Instructor"}</span>
                        </div>
                        <div className="meta-item">
                          <i className="fas fa-calendar-alt"></i>
                          <span>Inicio: {formatDate(f.fecha_inicio)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </Layout>
  );
};