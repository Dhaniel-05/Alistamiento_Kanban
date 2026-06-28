import { useState, useEffect } from "react";
import "./ModalRol.css";

export const ModalRol = ({ onClose, onSave, rolSeleccionado }) => {
    const [nombre, setNombre] = useState("");

    useEffect(() => {
        if (rolSeleccionado) {
            setNombre(rolSeleccionado.nombre || "");
        }
    }, [rolSeleccionado]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const data = { nombre };

        if (rolSeleccionado) {
            onSave({ ...rolSeleccionado, ...data });
        } else {
            onSave(data);
        }
    };

    return (
        <div className="modal-fondo">
            <div className="modal-contenedor">
                <h2 className="modal-titulo">
                    {rolSeleccionado ? "Editar Rol" : "Crear Rol"}
                </h2>

                <form className="modal-formulario" onSubmit={handleSubmit}>
                    <input
                        className="modal-entrada"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre del rol"
                        required
                    />
                    <div className="modal-acciones">
                        <button
                            type="button"
                            className="modal-boton-cancelar"
                            onClick={onClose}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="modal-boton-guardar"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModalRol;
