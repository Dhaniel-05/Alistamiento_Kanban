import { useState, useEffect } from "react";
import "./ModalPermiso.css";

export const ModalPermiso = ({ onClose, onSave, permisoSeleccionado }) => {
    const [nombre, setNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");

    useEffect(() => {
        if (permisoSeleccionado) {
            setNombre(permisoSeleccionado.nombre || "");
            setDescripcion(permisoSeleccionado.descripcion || "");
        } else {
            setNombre("");
            setDescripcion("");
        }
    }, [permisoSeleccionado]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            id_permiso: permisoSeleccionado?.id_permiso,
            nombre,
            descripcion,
        });
    };

    return (
        <div className="modal-fondo">
            <div className="modal-contenedor">
                <h2 className="modal-titulo">
                    {permisoSeleccionado ? "Editar Permiso" : "Crear Permiso"}
                </h2>

                <form className="modal-formulario" onSubmit={handleSubmit}>
                    <input
                        className="modal-entrada"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre del permiso"
                        required
                    />

                    <textarea
                        className="modal-textarea"
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Descripción"
                        rows="3"
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
