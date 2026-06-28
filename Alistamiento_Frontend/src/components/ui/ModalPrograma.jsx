import { useState } from "react";
import { logger } from "../../utils/logger";
import "./ModalPrograma.css";
import { ModalCargando } from "./ModalCargando";
import httpClient from "../../services/httpClient";

export const ModalPrograma = ({ onClose, onSave }) => {
    const [proyectoFormativo, setProyectoFormativo] = useState(null);
    const [programaFormacion, setProgramaFormacion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensajeCarga, setMensajeCarga] = useState("");

    const handleProyectoChange = (e) => setProyectoFormativo(e.target.files[0]);
    const handleProgramaChange = (e) => setProgramaFormacion(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!proyectoFormativo || !programaFormacion) {
            alert("Por favor selecciona ambos archivos PDF.");
            return;
        }

        try {
            setLoading(true);
            setMensajeCarga("Iniciando procesamiento de archivos...");

            // === 1️ Enviar PROGRAMA DE FORMACIÓN ===
            setMensajeCarga("Procesando Programa de Formación...");
            const formPrograma = new FormData();
            formPrograma.append("archivo", programaFormacion);
            formPrograma.append("tipo", "todo");

            const resPrograma = await httpClient.post('/pdf/procesar/programa', formPrograma, {
                validateStatus: () => true,
            });

            if (resPrograma.status < 200 || resPrograma.status >= 300) {
                const errorText = typeof resPrograma.data === 'string'
                    ? resPrograma.data
                    : JSON.stringify(resPrograma.data);
                logger.error("Error respuesta servidor:", errorText);
                throw new Error(`Error ${resPrograma.status}: ${resPrograma.statusText}`);
            }

            const dataPrograma = resPrograma.data;

            // === 2️ Enviar PROYECTO FORMATIVO ===
            setMensajeCarga("Procesando Proyecto Formativo...");
            const formProyecto = new FormData();
            formProyecto.append("archivo", proyectoFormativo);

            const resProyecto = await httpClient.post('/pdf/procesar/proyecto', formProyecto, {
                validateStatus: () => true,
            });

            if (resProyecto.status < 200 || resProyecto.status >= 300) {
                const errorText = typeof resProyecto.data === 'string'
                    ? resProyecto.data
                    : JSON.stringify(resProyecto.data);
                logger.error("Error respuesta servidor:", errorText);
                throw new Error(`Error ${resProyecto.status}: ${resProyecto.statusText}`);
            }

            const dataProyecto = resProyecto.data;

            // === 3️ Finalizando ===
            setMensajeCarga("Finalizando proceso...");

            // Si todo fue bien, avisar al padre y cerrar modal
            onSave({
                programa: dataPrograma.data || dataPrograma,
                proyecto: dataProyecto.data || dataProyecto,
            });

            // Se eliminó el alert aquí
            onClose();

        } catch (error) {
            logger.error(" Error al enviar los archivos:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setLoading(false);
            setMensajeCarga("");
        }
    };

    return (
        <>
            {/* Modal de carga */}
            {loading && <ModalCargando mensaje={mensajeCarga} />}
            
            {/* Modal principal */}
            <div className="modal-overlay">
                <div className="modal-container">
                    <h2>Crear Nuevo Programa</h2>
                    <p className="modal-subtitle">
                        Carga los archivos PDF requeridos para generar automáticamente la información del programa.
                    </p>

                    <form onSubmit={handleSubmit} className="modal-form">
                        {/* Proyecto Formativo */}
                        <div className="file-upload">
                            <label>Proyecto Formativo* (PDF)</label>
                            <div className="file-box">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    id="proyectoFormativo"
                                    onChange={handleProyectoChange}
                                    hidden
                                    disabled={loading}
                                />
                                <label htmlFor="proyectoFormativo" className="file-label">
                                    {proyectoFormativo ? proyectoFormativo.name : "Seleccionar archivo PDF"}
                                </label>
                            </div>
                        </div>

                        {/* Programa de Formación */}
                        <div className="file-upload">
                            <label>Programa de Formación* (PDF)</label>
                            <div className="file-box">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    id="programaFormacion"
                                    onChange={handleProgramaChange}
                                    hidden
                                    disabled={loading}
                                />
                                <label htmlFor="programaFormacion" className="file-label">
                                    {programaFormacion ? programaFormacion.name : "Seleccionar archivo PDF"}
                                </label>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="modal-actions">
                            <button 
                                type="button" 
                                className="cancel-btn" 
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="create-btn" 
                                disabled={loading}
                            >
                                {loading ? "Procesando..." : "Crear Programa"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};