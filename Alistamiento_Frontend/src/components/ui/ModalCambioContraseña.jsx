import { useState } from "react";
import { logger } from "../../utils/logger";
import "./ModalCambioContraseña.css";
import logo from "../../assets/nodorap.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { ModalExito } from "../ui/ModalExito";
import { ModalError } from "../ui/ModalError";
import httpClient from "../../services/httpClient";

export const CambioContrasenaModal = ({ onClose, onSuccess }) => {
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [mostrarModalExito, setMostrarModalExito] = useState(false);
    const [mostrarModalError, setMostrarModalError] = useState(false);
    const [mensajeError, setMensajeError] = useState("");
    const [contrasenaCambiada, setContrasenaCambiada] = useState(false);

    const handleUpdate = async () => {
        if (newPass.length < 8) {
            setMensajeError("La contraseña debe tener mínimo 8 caracteres.");
            setMostrarModalError(true);
            return;
        }

        // Validar que tenga mayúsculas, minúsculas y números
        const tieneMayuscula = /[A-Z]/.test(newPass);
        const tieneMinuscula = /[a-z]/.test(newPass);
        const tieneNumero = /\d/.test(newPass);

        if (!tieneMayuscula || !tieneMinuscula || !tieneNumero) {
            setMensajeError("La contraseña debe incluir mayúsculas, minúsculas y números.");
            setMostrarModalError(true);
            return;
        }

        if (newPass !== confirmPass) {
            setMensajeError("Las contraseñas no coinciden.");
            setMostrarModalError(true);
            return;
        }

        const rawUser = localStorage.getItem("user");
        const user = JSON.parse(rawUser);

        if (!user || !user.id) {
            setMensajeError("No se pudo identificar al usuario.");
            setMostrarModalError(true);
            return;
        }

        setLoading(true);

        try {
            const res = await httpClient.put(
                `/instructores/${user.id}/cambiar-contrasena`,
                {
                    nueva_contrasena: newPass,
                    primer_acceso: false,
                },
                { validateStatus: () => true },
            );

            if (res.status < 200 || res.status >= 300) {
                throw new Error(res.data?.error || "Error al cambiar contraseña");
            }

            const result = res.data;
            logger.debug("✅ Contraseña cambiada:", result);

            // Actualizar el usuario en localStorage
            const updatedUser = {
                ...user,
                primer_acceso: false
            };
            localStorage.setItem("user", JSON.stringify(updatedUser));

            // Marcar que la contraseña fue cambiada
            setContrasenaCambiada(true);

            // Mostrar modal de éxito
            setMostrarModalExito(true);

            // Notificar éxito al componente padre si existe
            if (onSuccess) {
                onSuccess();
            }

        } catch (error) {
            logger.error("❌ Error cambiando contraseña:", error);
            setMensajeError(error.message || "No se pudo cambiar la contraseña.");
            setMostrarModalError(true);
        } finally {
            setLoading(false);
        }
    };

    const cerrarModalExito = () => {
        setMostrarModalExito(false);
        
        // Si la contraseña fue cambiada, proceder con el cierre completo
        if (contrasenaCambiada) {
            // 1. Limpiar localStorage
            localStorage.removeItem("user");
            sessionStorage.clear();
            
            // 2. Cerrar todos los modales
            if (onClose) {
                onClose();
            }
            
            // 3. Redirigir al login después de un breve delay
            setTimeout(() => {
                window.location.href = "/login";
            }, 300);
        }
    };

    const cerrarModalError = () => {
        setMostrarModalError(false);
        setMensajeError("");
    };

    return (
        <>
            {/* Modal de éxito (SOBREPONE al modal principal) */}
            {mostrarModalExito && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <ModalExito
                        onClose={cerrarModalExito}
                        titulo="Contraseña Actualizada"
                        mensaje="Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión."
                        textoBoton="Entendido"
                    />
                </div>
            )}

            {/* Modal de error */}
            {mostrarModalError && (
                <div className="modal-overlay" style={{ zIndex: 9999 }}>
                    <ModalError
                        onClose={cerrarModalError}
                        titulo="Error"
                        mensaje={mensajeError}
                        textoBoton="Aceptar"
                    />
                </div>
            )}

            {/* Modal principal (solo se muestra si no hay modal de éxito activo) */}
            {!mostrarModalExito && !mostrarModalError && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        {/* Logo de la página - MÁS GRANDE */}
                        <div className="modal-logo">
                            <img src={logo} alt="NodoRAP" className="logo-image" />
                        </div>

                        {/* Icono del candado - MÁS PEQUEÑO */}
                        <div className="modal-icon-container">
                            <FontAwesomeIcon
                                icon={faLock}
                                className="modal-icon"
                            />
                        </div>

                        <h2 className="modal-title">Cambiar Contraseña</h2>
                        <p className="modal-subtitle">Bienvenido/a Gestor - Instructor. Debes cambiar tu contraseña en el primer acceso.</p>

                        <div className="input-container">
                            <label className="input-label">Nueva Contraseña</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    className="modal-input"
                                    placeholder="•••••••• (mínimo 8 caracteres)"
                                    value={newPass}
                                    onChange={(e) => setNewPass(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>

                        <div className="input-container">
                            <label className="input-label">Confirmar Nueva Contraseña</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="modal-input"
                                    placeholder="••••••••"
                                    value={confirmPass}
                                    onChange={(e) => setConfirmPass(e.target.value)}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                                </button>
                            </div>
                        </div>

                        <p className="password-requirement">La contraseña debe tener al menos 8 caracteres e incluir mayúsculas, minúsculas y números.</p>

                        <button
                            className="modal-btn"
                            onClick={handleUpdate}
                            disabled={loading || !newPass || !confirmPass}
                        >
                            {loading ? "Actualizando..." : "Cambiar Contraseña"}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};