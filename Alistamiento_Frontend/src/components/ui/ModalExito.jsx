import "./ModalExito.css";

export const ModalExito = ({ 
  onClose, 
  titulo = "Operación Exitosa", 
  mensaje, 
  textoBoton = "Aceptar" 
}) => {
  return (
    <div className="modal-fondo-exito">
      <div className="modal-contenedor-exito">
        <div className="modal-icono-exito">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path 
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <h2 className="modal-titulo-exito">{titulo}</h2>
        
        <p className="modal-mensaje-exito">{mensaje}</p>

        <div className="modal-acciones-exito">
          <button
            type="button"
            className="modal-boton-exito"
            onClick={onClose}
          >
            {textoBoton}
          </button>
        </div>
      </div>
    </div>
  );
};