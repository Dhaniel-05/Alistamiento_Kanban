// src/components/ui/ModalConfirmacion.jsx
import "./ModalConfirmacion.css";

export const ModalConfirmacion = ({ 
  onClose, 
  onConfirm,
  titulo = "Confirmar acción", 
  mensaje, 
  textoConfirmar = "Aceptar",
  textoCancelar = "Cancelar" 
}) => {
  return (
    <div className="modal-fondo-confirmacion">
      <div className="modal-contenedor-confirmacion">
        <div className="modal-icono-confirmacion">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
              stroke="currentColor" 
              strokeWidth="2" 
            />
            <path 
              d="M12 8V12M12 16H12.01" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
            />
          </svg>
        </div>
        
        <h2 className="modal-titulo-confirmacion">{titulo}</h2>
        
        <p className="modal-mensaje-confirmacion">{mensaje}</p>

        <div className="modal-acciones-confirmacion">
          <button
            type="button"
            className="modal-boton-cancelar"
            onClick={onClose}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className="modal-boton-confirmar"
            onClick={onConfirm}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};