import "./ModalCargando.css";

export const ModalCargando = ({ mensaje = "Procesando archivos..." }) => {
  return (
    <div className="modal-cargando-overlay">
      <div className="modal-cargando-contenido">
        <div className="spinner-cargando"></div>
        <h3>Procesando archivos PDF</h3>
        <p>{mensaje}</p>
        <div className="progreso-texto">
          <span>Esto puede tomar unos segundos...</span>
        </div>
      </div>
    </div>
  );
};