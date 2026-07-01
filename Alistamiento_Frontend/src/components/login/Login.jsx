import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "../../assets/nodorap.png";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { CambioContrasenaModal } from "../ui/ModalCambioContraseña";
import { ModalError } from "../ui/ModalError";
import { logger } from "../../utils/logger";

const DEFAULT_RATE_LIMIT_SECONDS = 120;

const formatCountdown = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const Login = () => {
  const { login, user } = useAuthContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [rateLimitMensaje, setRateLimitMensaje] = useState('');
  
  // Nuevo estado para controlar si ya procesamos el login
  const [procesandoLogin, setProcesandoLogin] = useState(false);

  const navigate = useNavigate();
  const hasHandledUser = useRef(false);

  const loginBloqueado = rateLimitSeconds > 0;

  useEffect(() => {
    if (rateLimitSeconds <= 0) return undefined;

    const timerId = setTimeout(() => {
      setRateLimitSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timerId);
  }, [rateLimitSeconds]);

  useEffect(() => {
    if (rateLimitSeconds === 0) {
      setRateLimitMensaje('');
    }
  }, [rateLimitSeconds]);

  const activarBloqueoRateLimit = (retryAfter, mensaje) => {
    setRateLimitSeconds(retryAfter > 0 ? retryAfter : DEFAULT_RATE_LIMIT_SECONDS);
    setRateLimitMensaje(
      mensaje || 'Demasiados intentos. Intenta de nuevo en unos minutos.',
    );
  };

  // Función para mostrar modal de error
  const mostrarError = (mensaje) => {
    setMensajeError(mensaje);
    setMostrarModalError(true);
  };

  // Cerrar modal de error
  const cerrarModalError = () => setMostrarModalError(false);

  // Quita espacios y convierte a minúsculas
  const normalizarEmail = (correo) => correo.trim().toLowerCase();

  // Valida formato general
  const validarEmail = (correo) => {
    const regex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(correo);
  };

  // Revisa que NO contenga espacios internos
  const contieneEspacios = (correo) => correo.includes(" ");

  // === EFECTO DESPUÉS DE LOGIN EXITOSO ===
  useEffect(() => {
    // Solo ejecutar si estamos procesando el login y tenemos usuario
    if (!procesandoLogin || !user || !user.id) return;

    // Evitar ejecutar varias veces
    if (hasHandledUser.current) return;

    hasHandledUser.current = true;

    // Verificar si necesita cambiar contraseña
    // Asegurar que comparamos correctamente valores booleanos/números
    const necesitaCambiarPassword = 
      user.primer_acceso === true || 
      user.primer_acceso === 1 || 
      user.primer_acceso === "true" || 
      user.primer_acceso === "1";

    const esInstructor = user.rol?.toLowerCase() === "instructor";
    const esGestor = user.rol?.toLowerCase() === "gestor";

    if ((esInstructor || esGestor) && necesitaCambiarPassword) {
      logger.debug("Mostrando modal de cambio de contraseña");
      setShowPasswordModal(true);
    } else {
      logger.debug("Redirigiendo según rol del usuario autenticado");
      redirectByRole(user.rol);
    }

    // Resetear el estado de procesamiento
    setProcesandoLogin(false);

  }, [user, procesandoLogin]);

  // === FUNCIÓN PARA REDIRIGIR SEGÚN EL ROL ===
  const redirectByRole = (rol) => {
    switch (rol?.toLowerCase()) {
      case "administrador":
        navigate("/principal");
        break;

      case "instructor":
        navigate("/instructor");
        break;

      case "gestor":
        navigate("/sabana");
        break;

      default:
        logger.warn("Rol no reconocido; redirigiendo a principal");
        navigate("/principal");
    }
  };

  // === MANEJO DEL LOGIN ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || loginBloqueado) return;

    const emailNormalizado = normalizarEmail(email);

    // Reemplazar el email con el normalizado
    setEmail(emailNormalizado);

    // 1. Validar espacios internos
    if (contieneEspacios(emailNormalizado)) {
      mostrarError("El correo no puede contener espacios.");
      return;
    }

    // 2. Validar formato del correo
    if (!validarEmail(emailNormalizado)) {
      mostrarError("Ingresa un correo válido.");
      return;
    }

    // 3. Validar que no esté vacío
    if (!emailNormalizado) {
      mostrarError("El correo es obligatorio.");
      return;
    }

    // 4. Validar contraseña no vacía
    if (!password.trim()) {
      mostrarError("La contraseña es obligatoria.");
      return;
    }

    setLoading(true);
    hasHandledUser.current = false;
    setProcesandoLogin(false);

    try {
      const success = await login(emailNormalizado, password);

      if (!success) {
        mostrarError("Credenciales inválidas");
        setLoading(false);
        return;
      }

      logger.debug("Login exitoso; procesando post-login");
      setProcesandoLogin(true);

    } catch (error) {
      if (error.code === 'RATE_LIMIT') {
        activarBloqueoRateLimit(error.retryAfter, error.message);
        setLoading(false);
        return;
      }

      logger.error("Error en formulario de login", error.message);
      mostrarError("Error al iniciar sesión: " + error.message);
      setLoading(false);
    }
  };

  // Función para manejar el cierre del modal de cambio de contraseña
  const handleCierreModalCambio = () => {
    logger.debug("Modal de cambio de contraseña cerrado");
    setShowPasswordModal(false);
    hasHandledUser.current = false;
    
    // Limpiar localStorage completamente
    localStorage.clear();
    sessionStorage.clear();
    
    // Forzar recarga completa para limpiar estado
    setTimeout(() => {
        window.location.href = "/login";
    }, 100);
};

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="back-link" onClick={() => navigate("/")}>
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          Volver
        </div>

        <img src={logo} alt="NodoRAP Logo" className="login-logo" />
        <h2>Iniciar Sesión</h2>
        <p className="login-subtitle">
          Ingresa tus credenciales para acceder al sistema
        </p>

        {loginBloqueado && (
          <div className="login-rate-limit-banner" role="alert" aria-live="polite">
            <p className="login-rate-limit-title">{rateLimitMensaje}</p>
            <p className="login-rate-limit-countdown">
              Intenta de nuevo en <strong>{formatCountdown(rateLimitSeconds)}</strong>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@sena.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <VisibilityOffIcon sx={{ color: "#bbb" }} />
                ) : (
                  <VisibilityIcon sx={{ color: "#bbb" }} />
                )}
              </span>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading || loginBloqueado}>
            {loading
              ? "Iniciando sesión..."
              : loginBloqueado
                ? `Intenta de nuevo en ${formatCountdown(rateLimitSeconds)}`
                : "Iniciar Sesión"}
          </button>
        </form>
      </div>

      {showPasswordModal && (
        <CambioContrasenaModal
          onClose={handleCierreModalCambio}
          onSuccess={() => {
            logger.debug("Cambio de contraseña exitoso");
          }}
        />
      )}

      {/* MODAL DE ERROR */}
      {mostrarModalError && (
        <ModalError
          onClose={cerrarModalError}
          titulo="Error"
          mensaje={mensajeError}
          textoBoton="Entendido"
        />
      )}
    </div>
  );
};