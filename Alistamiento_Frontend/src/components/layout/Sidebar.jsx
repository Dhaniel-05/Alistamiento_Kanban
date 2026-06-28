import { useState, useEffect } from 'react';
import { logger } from '../../utils/logger';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

export const Sidebar = ({ fichaInfo }) => {
  const [activeSection, setActiveSection] = useState('sabana');
  const navigate = useNavigate();
  const location = useLocation();

  // DEBUG: Ver qué datos llegan
  useEffect(() => {
    logger.debug("🔍 Sidebar - fichaInfo recibida:", fichaInfo);
  }, [fichaInfo]);

  // Extraer idFicha de la URL actual
  const obtenerIdFichaActual = () => {
    const matchSabana = location.pathname.match(/\/sabana\/(\d+)/);
    const matchPlaneacion = location.pathname.match(/\/planeacion\/(\d+)/);
    
    return matchSabana ? matchSabana[1] : (matchPlaneacion ? matchPlaneacion[1] : null);
  };

  // Detectar la ruta actual y actualizar la sección activa
  useEffect(() => {
    if (location.pathname.includes('/sabana')) {
      setActiveSection('sabana');
    } else if (location.pathname.includes('/planeacion')) {
      setActiveSection('planeacion');
    }
  }, [location.pathname]);

  const handleNavigation = (section) => {
    setActiveSection(section);
    
    const idFichaActual = obtenerIdFichaActual();
    
    if (section === 'sabana') {
      if (idFichaActual) {
        navigate(`/sabana/${idFichaActual}`);
      } else {
        navigate('/sabana');
      }
    } else if (section === 'planeacion') {
      if (idFichaActual) {
        navigate(`/planeacion/${idFichaActual}`);
      } else {
        navigate('/planeacion');
      }
    }
  };

  // Función para determinar el estado de la ficha
  const obtenerEstadoFicha = (fechaInicio, fechaFin) => {
    if (!fechaInicio) return 'No configurada';
    
    const hoy = new Date();
    const inicio = new Date(fechaInicio);
    const fin = fechaFin ? new Date(fechaFin) : null;
    
    if (hoy < inicio) return 'Pendiente';
    if (fin && hoy > fin) return 'Finalizada';
    return 'Activa';
  };

  // Función para obtener el estado con color
  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case 'Activa': return 'estado-activo';
      case 'Pendiente': return 'estado-pendiente';
      case 'Finalizada': return 'estado-finalizada';
      case 'No configurada': return 'estado-no-configurada';
      default: return 'estado-no-configurada';
    }
  };

  return (
    <aside className="sidebar">
      {/* Navegación Principal */}
      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${activeSection === 'sabana' ? 'active' : ''}`}
          onClick={() => handleNavigation('sabana')}
        >
          <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 12H15M12 9V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="nav-text">Sábana</span>
        </div>

        <div 
          className={`nav-item ${activeSection === 'planeacion' ? 'active' : ''}`}
          onClick={() => handleNavigation('planeacion')}
        >
          <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="nav-text">Planeación Pedagógica</span>
        </div>
      </nav>

      {/* Información de la Ficha */}
      <div className="sidebar-section">
        <h3 className="info-section-title">INFORMACIÓN DE LA FICHA</h3>
        
        {fichaInfo ? (
          <div className="info-content">
            <div className="info-row">
              <span className="info-label">Código:</span>
              <span className="info-value">
                {fichaInfo.codigo_ficha || 'No disponible'}
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Estado:</span>
              <span className={`info-value ${obtenerClaseEstado(
                obtenerEstadoFicha(fichaInfo.fecha_inicio, fichaInfo.fecha_final)
              )}`}>
                {obtenerEstadoFicha(fichaInfo.fecha_inicio, fichaInfo.fecha_final)}
              </span>
            </div>
            
            <div className="info-row">
              <span className="info-label">Jornada:</span>
              <span className="info-value">
                {fichaInfo.jornada || 'No definida'}
              </span>
            </div>

            {fichaInfo.fecha_final && (
              <div className="info-row">
                <span className="info-label">Fin:</span>
                <span className="info-value fecha">
                  {new Date(fichaInfo.fecha_final).toLocaleDateString('es-ES')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="info-content">
            <div className="info-no-data">
              <p>No hay ficha seleccionada</p>
              <p className="info-hint">Selecciona una ficha para ver la información</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};