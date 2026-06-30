// src/pages/planeacion/components/PlaneacionCard.jsx
import { puedeEditarFicha } from '../../../utils/permisos';
import './PlaneacionCard.css';

export const PlaneacionCard = ({
  planeacion,
  user,
  onEditar,
  onEliminar,
  editando = false,
  eliminando = false,
}) => {
  const usuarioPuedeEditar = puedeEditarFicha(user);
  const idPlaneacion = planeacion.id_planeacion || planeacion.id;

  return (
    <div className="planeacion-card">
      <div className="planeacion-encabezado">
        <div className="planeacion-codigo">{planeacion.codigo}</div>
        <div className="planeacion-estado">{planeacion.estado}</div>
      </div>

      <p className="planeacion-descripcion">{planeacion.descripcion}</p>

      <div className="planeacion-metadata">
        <span>• {planeacion.autor}</span>
        <span>• C. Creado {planeacion.fechaCreacion}</span>
        <span>• M. Modificado {planeacion.fechaModificacion}</span>
      </div>

      <div className="separator" />

      <div className="planeacion-acciones">
        <button type="button" className="btn-accion btn-ver">Ver</button>
        {usuarioPuedeEditar && (
          <button
            type="button"
            className="btn-accion btn-editar"
            onClick={() => onEditar?.(planeacion)}
            disabled={editando}
          >
            {editando ? 'Cargando...' : 'Editar'}
          </button>
        )}
        <button type="button" className="btn-accion btn-guia">Guía de Aprendizaje</button>
        <button
          type="button"
          className="btn-accion btn-eliminar"
          onClick={() => onEliminar?.(idPlaneacion)}
          disabled={eliminando}
        >
          {eliminando ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  );
};
