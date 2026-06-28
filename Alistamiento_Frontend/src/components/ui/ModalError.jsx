import "./ModalError.css";

export const ModalError = ({ 
  onClose, 
  titulo = "Error", 
  mensaje, 
  textoBoton = "Entendido" 
}) => {
  return (
    <div className="modal-fondo-error">
      <div className="modal-contenedor-error">
        <div className="modal-icono-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        
        <h2 className="modal-titulo-error">{titulo}</h2>
        
        <p className="modal-mensaje-error">{mensaje}</p>

        <div className="modal-acciones-error">
          <button
            type="button"
            className="modal-boton-error"
            onClick={onClose}
          >
            {textoBoton}
          </button>
        </div>
      </div>
    </div>
  );
};