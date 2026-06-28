// src/pages/planeacion/components/PlaneacionCard.jsx
import './PlaneacionCard.css';

export const PlaneacionCard = ({ planeacion }) => {
  return (
    <div className="planeacion-card">
      {/* Encabezado de la planeación */}
      <div className="planeacion-encabezado">
        <div className="planeacion-codigo">{planeacion.codigo}</div>
        <div className="planeacion-estado">{planeacion.estado}</div>
      </div>

      {/* Descripción */}
      <p className="planeacion-descripcion">{planeacion.descripcion}</p>

      {/* Metadatos */}
      <div className="planeacion-metadata">
        <span>• {planeacion.autor}</span>
        <span>• C. Creado {planeacion.fechaCreacion}</span>
        <span>• M. Modificado {planeacion.fechaModificacion}</span>
      </div>

      <div className="separator"></div>

      {/* Acciones */}
      <div className="planeacion-acciones">
        <button className="btn-accion btn-ver">Ver</button>
        <button className="btn-accion btn-editar">Editar</button>
        <button className="btn-accion btn-guia">Guía de Aprendizaje</button>
        <button className="btn-accion btn-eliminar">Eliminar</button>
      </div>
    </div>
  );
};