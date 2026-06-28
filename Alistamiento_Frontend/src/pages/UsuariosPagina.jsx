import { useState, useEffect } from "react";
import { logger } from "../utils/logger";
import { ModalUsuario } from "../components/ui/ModalUsuario";
import { ModalPrograma } from "../components/ui/ModalPrograma";
import { ModalFicha } from "../components/ui/ModalFicha";
import { ModalExito } from "../components/ui/ModalExito";
import { ModalError } from "../components/ui/ModalError";
import { ModalConfirmacion } from "../components/ui/ModalConfirmacion";
import { Layout } from "../components/layout/Layout";
import { useUsuarios } from "../hooks/useUsuarios";
import { useProgramas } from "../hooks/useProgramas";
import { useFichas } from "../hooks/useFichas";
import "./Pagina.css";

export const UsuariosPagina = () => {
  const [seccionActiva, setSeccionActiva] = useState("instructores");
  const { usuarios, debugInfo, guardarUsuario, eliminarUsuarioPorId } = useUsuarios();
  const { programas, cargarProgramas, eliminarPrograma } = useProgramas();
  const {
    fichas,
    cargarFichas,
    guardarFichaEnApi,
    eliminarFichaEnApi,
  } = useFichas({ autoLoad: false });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalPrograma, setMostrarModalPrograma] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);

  // Estados para modales de éxito y error
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');
  const [elementoAEliminar, setElementoAEliminar] = useState(null);
  const [tipoAccion, setTipoAccion] = useState('');

  // Estado para errores de validación en tiempo real
  const [erroresValidacion, setErroresValidacion] = useState({
    email: '',
    cedula: '',
    nombre: '',
    contrasena: ''
  });

  const [formUsuario, setFormUsuario] = useState({
    cedula: "",
    nombre: "",
    email: "",
    contrasena: "",
    id_rol: "",
    estado: 1,
  });

  // Lista de dominios institucionales permitidos (puedes ampliarla)
  const dominiosPermitidos = [
    'sena.edu.co',
    'misena.edu.co',
    'senavirtual.edu.co',
    'edu.co',
    'gmail.com',
    'hotmail.com',
    'outlook.com',
    'yahoo.com',
  ];

  // ========== FUNCIONES DE VALIDACIÓN DE CORREO ==========

  // Validación completa de correo electrónico
  const validarEmailCompleto = (email) => {
    const errores = [];

    if (!email) {
      return ["El correo electrónico es obligatorio"];
    }

    const emailNormalizado = email.trim().toLowerCase();

    // 1. Validar longitud mínima total
    if (emailNormalizado.length < 8) {
      errores.push("El correo es demasiado corto (mínimo 8 caracteres)");
    }

    // 2. Validar formato básico
    const partes = emailNormalizado.split('@');
    if (partes.length !== 2) {
      errores.push("Formato de correo inválido. Debe contener un solo '@'");
      return errores;
    }

    const [usuario, dominio] = partes;

    // 3. Validar parte local (antes del @)
    if (usuario.length === 0) {
      errores.push("La parte antes del '@' no puede estar vacía");
    }

    if (usuario.length > 64) {
      errores.push("La parte antes del '@' es demasiado larga (máximo 64 caracteres)");
    }

    // Caracteres válidos en parte local
    const regexUsuario = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
    if (!regexUsuario.test(usuario.replace(/\.(?=.*\.)/g, ''))) {
      errores.push("La parte antes del '@' contiene caracteres no permitidos");
    }

    // No puede empezar o terminar con punto
    if (usuario.startsWith('.') || usuario.endsWith('.')) {
      errores.push("La parte antes del '@' no puede empezar o terminar con punto");
    }

    // No puede tener puntos consecutivos
    if (usuario.includes('..')) {
      errores.push("La parte antes del '@' no puede tener puntos consecutivos");
    }

    // 4. Validar dominio (después del @)
    if (dominio.length === 0) {
      errores.push("El dominio no puede estar vacío");
    }

    if (dominio.length < 4) {
      errores.push("El dominio es demasiado corto");
    }

    // 5. Validar estructura del dominio
    const partesDominio = dominio.split('.');
    if (partesDominio.length < 2) {
      errores.push("El dominio debe contener al menos un punto (ej: dominio.com)");
    }

    // Cada parte del dominio debe tener al menos 2 caracteres
    for (let i = 0; i < partesDominio.length; i++) {
      if (partesDominio[i].length === 0) {
        errores.push("El dominio no puede tener partes vacías entre puntos");
      }
      if (partesDominio[i].length === 1 && i < partesDominio.length - 1) {
        errores.push("Cada parte del dominio debe tener al menos 2 caracteres");
      }
    }

    // Última parte (TLD) debe tener al menos 2 caracteres
    const tld = partesDominio[partesDominio.length - 1];
    if (tld.length < 2) {
      errores.push("La extensión del dominio debe tener al menos 2 caracteres (ej: .com, .co)");
    }

    // 6. Validar contra patrones inválidos conocidos
    const patronesInvalidos = [
      /^[^@]+@[^@]{1,3}\.[^@]{1}$/, // h@g.c
      /^[^@]+@[^@]{1,2}\.[^@]{2,}$/, // h@g.com
      /^[^@]+@\.[^@]+$/, // usuario@.com
      /^@[^@]+$/, // @dominio.com
      /^[^@]+@$/, // usuario@
    ];

    if (patronesInvalidos.some(patron => patron.test(emailNormalizado))) {
      errores.push("Formato de correo inválido");
    }

    // 7. Longitud máxima total
    if (emailNormalizado.length > 254) {
      errores.push("El correo es demasiado largo (máximo 254 caracteres)");
    }

    return errores;
  };

  // Validación en tiempo real del email
  const validarEmailEnTiempoReal = (email) => {
    if (!email) {
      setErroresValidacion(prev => ({ ...prev, email: '' }));
      return true;
    }

    const errores = validarEmailCompleto(email);
    if (errores.length > 0) {
      setErroresValidacion(prev => ({ ...prev, email: errores[0] }));
      return false;
    }

    setErroresValidacion(prev => ({ ...prev, email: '' }));
    return true;
  };

  // Validación de cédula
  const validarCedula = (cedula) => {
    const cedulaStr = String(cedula).trim();

    if (!cedulaStr) {
      setErroresValidacion(prev => ({ ...prev, cedula: 'La cédula es obligatoria' }));
      return false;
    }

    if (!/^\d+$/.test(cedulaStr)) {
      setErroresValidacion(prev => ({ ...prev, cedula: 'La cédula debe contener solo números' }));
      return false;
    }

    if (cedulaStr.length < 7 || cedulaStr.length > 20) {
      setErroresValidacion(prev => ({ ...prev, cedula: 'La cédula debe tener entre 7 y 20 dígitos' }));
      return false;
    }

    setErroresValidacion(prev => ({ ...prev, cedula: '' }));
    return true;
  };

  // Validación de nombre
  const validarNombre = (nombre) => {
    const nombreStr = nombre.trim();

    if (!nombreStr) {
      setErroresValidacion(prev => ({ ...prev, nombre: 'El nombre es obligatorio' }));
      return false;
    }

    if (nombreStr.length < 3) {
      setErroresValidacion(prev => ({ ...prev, nombre: 'El nombre debe tener al menos 3 caracteres' }));
      return false;
    }

    if (nombreStr.length > 100) {
      setErroresValidacion(prev => ({ ...prev, nombre: 'El nombre es demasiado largo' }));
      return false;
    }

    // Permitir letras, espacios, tildes y ñ
    if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(nombreStr)) {
      setErroresValidacion(prev => ({ ...prev, nombre: 'El nombre solo puede contener letras y espacios' }));
      return false;
    }

    setErroresValidacion(prev => ({ ...prev, nombre: '' }));
    return true;
  };

  // Validación de contraseña
  const validarContrasena = (contrasena) => {
    if (!contrasena) {
      setErroresValidacion(prev => ({ ...prev, contrasena: 'La contraseña es obligatoria' }));
      return false;
    }

    if (contrasena.length < 8) {
      setErroresValidacion(prev => ({ ...prev, contrasena: 'La contraseña debe tener al menos 8 caracteres' }));
      return false;
    }

    // Opcional: validar fortaleza de contraseña
    const tieneMayuscula = /[A-Z]/.test(contrasena);
    const tieneMinuscula = /[a-z]/.test(contrasena);
    const tieneNumero = /\d/.test(contrasena);

    if (!tieneMayuscula || !tieneMinuscula || !tieneNumero) {
      setErroresValidacion(prev => ({ ...prev, contrasena: 'La contraseña debe incluir mayúsculas, minúsculas y números' }));
      return false;
    }

    setErroresValidacion(prev => ({ ...prev, contrasena: '' }));
    return true;
  };

  // Función para mostrar modal de éxito
  const mostrarExito = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarModalExito(true);
  };

  // Función para mostrar modal de error
  const mostrarError = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarModalError(true);
  };

  // Función para mostrar modal de confirmación
  const mostrarConfirmacion = (mensaje, tipo, elementoId = null) => {
    setMensajeModal(mensaje);
    setTipoAccion(tipo);
    setElementoAEliminar(elementoId);
    setMostrarModalConfirmacion(true);
  };

  // Cerrar modales
  const cerrarModalExito = () => setMostrarModalExito(false);
  const cerrarModalError = () => setMostrarModalError(false);
  const cerrarModalConfirmacion = () => setMostrarModalConfirmacion(false);

  // Ejecutar acción confirmada
  const ejecutarAccionConfirmada = async () => {
    try {
      if (tipoAccion === 'eliminarInstructor') {
        await eliminarUsuarioPorId(elementoAEliminar);
        mostrarExito("Instructor eliminado exitosamente");
      } else if (tipoAccion === 'eliminarPrograma') {
        await handleEliminarPrograma(elementoAEliminar);
      } else if (tipoAccion === 'eliminarFicha') {
        await handleEliminarFicha(elementoAEliminar);
      }
    } catch (error) {
      logger.error("Error ejecutando acción:", error);
      mostrarError("Error al realizar la operación");
    }
    cerrarModalConfirmacion();
  };

  // Edición de Fichas
  const abrirModalFicha = (ficha) => {
    setFichaSeleccionada(ficha);
    setModalAbierto(true);
  };

  const cerrarModalFicha = () => {
    setFichaSeleccionada(null);
    setModalAbierto(false);
  };

  // Cargar FICHAS desde el backend
  useEffect(() => {
    if (seccionActiva === "fichas") {
      cargarFichas().catch((error) => {
        logger.error("Error cargando fichas:", error);
        mostrarError("Error al cargar las fichas");
      });
    }
  }, [seccionActiva, cargarFichas]);

  const abrirModal = (usuario = null) => {
    setModoEdicion(!!usuario);

    const valoresPorDefecto = {
      cedula: "",
      nombre: "",
      email: "",
      contrasena: "",
      id_rol: "2", // Mantener como string para el input
      estado: 1,
    };

    // Si estamos en modo edición, asegurarnos de mantener el ID y convertir el rol
    const usuarioAEditar = usuario ? {
      ...valoresPorDefecto,
      ...usuario,
      // Asegurar que el ID esté presente
      id_instructor: usuario.id_instructor || usuario.id,
      // Asegurar que id_rol sea string para el input
      id_rol: String(usuario.id_rol || "2")
    } : valoresPorDefecto;

    logger.debug("🔄 Abriendo modal en modo:", modoEdicion ? "edición" : "creación");
    logger.debug("📋 Datos del usuario para editar:", usuarioAEditar);

    setFormUsuario(usuarioAEditar);
    setMostrarModal(true);

    // Limpiar errores al abrir modal
    setErroresValidacion({
      email: '',
      cedula: '',
      nombre: '',
      contrasena: ''
    });
  };
  const cerrarModal = () => setMostrarModal(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormUsuario({ ...formUsuario, [name]: value });

    // Validación en tiempo real
    switch (name) {
      case 'email':
        validarEmailEnTiempoReal(value);
        break;
      case 'cedula':
        validarCedula(value);
        break;
      case 'nombre':
        validarNombre(value);
        break;
      case 'contrasena':
        validarContrasena(value);
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    logger.debug("🔍 Iniciando submit del formulario");

    // Validar todos los campos antes de proceder
    const esEmailValido = validarEmailEnTiempoReal(formUsuario.email);
    const esCedulaValida = validarCedula(formUsuario.cedula);
    const esNombreValido = validarNombre(formUsuario.nombre);
    const esContrasenaValida = modoEdicion ? true : validarContrasena(formUsuario.contrasena);

    if (!esEmailValido || !esCedulaValida || !esNombreValido || !esContrasenaValida) {
      mostrarError("Por favor, corrige los errores en el formulario antes de continuar.");
      return;
    }

    // Normalizar datos
    const correo = formUsuario.email.trim().toLowerCase();
    const cedula = String(formUsuario.cedula).trim();

    // IMPORTANTE: Normalizar el formUsuario antes de las validaciones
    const usuarioNormalizado = {
      ...formUsuario,
      email: correo,
      cedula: cedula,
      id_rol: formUsuario.id_rol || "2",
      estado: formUsuario.estado || 1
    };

    logger.debug("📤 Datos normalizados a enviar:", usuarioNormalizado);

    // Validación final de correo (más estricta)
    const erroresCorreo = validarEmailCompleto(correo);
    if (erroresCorreo.length > 0) {
      mostrarError(erroresCorreo[0]);
      return;
    }

    // Validar correo duplicado - CORREGIDO
    const correoExistente = usuarios.some(u => {
      if (!u.email) return false;

      // Comparar emails normalizados
      const emailUsuarioExistente = u.email.toLowerCase().trim();
      const emailNuevo = correo.toLowerCase().trim();

      // Si estamos en modo edición, excluir al usuario actual
      if (modoEdicion && u.id_instructor === usuarioNormalizado.id_instructor) {
        return false;
      }

      return emailUsuarioExistente === emailNuevo;
    });

    if (correoExistente) {
      mostrarError("Este correo electrónico ya está registrado en el sistema.");
      return;
    }

    // Validar cédula duplicada - CORREGIDO
    const cedulaExistente = usuarios.some(u => {
      if (!u.cedula) return false;

      // Comparar cédulas como strings
      const cedulaUsuarioExistente = String(u.cedula).trim();
      const cedulaNueva = cedula.trim();

      // Si estamos en modo edición, excluir al usuario actual
      if (modoEdicion && u.id_instructor === usuarioNormalizado.id_instructor) {
        return false;
      }

      return cedulaUsuarioExistente === cedulaNueva;
    });

    if (cedulaExistente) {
      mostrarError("Esta cédula ya está registrada en el sistema. Por favor, verifica el número.");
      return;
    }

    logger.debug("🎯 Modo edición:", modoEdicion);
    logger.debug("✅ Todas las validaciones pasaron");

    try {
      await guardarUsuario(usuarioNormalizado, modoEdicion);
      mostrarExito(modoEdicion ? "Instructor actualizado exitosamente" : "Instructor creado exitosamente");
      cerrarModal();

    } catch (error) {
      logger.error("❌ Error en handleSubmit:", error);

      // Manejar errores específicos del backend
      const errorMsg = error.message.toLowerCase();

      if (errorMsg.includes("cédula") || errorMsg.includes("cedula")) {
        mostrarError("Error: La cédula ya está registrada en el sistema.");
      } else if (errorMsg.includes("correo") || errorMsg.includes("email") || errorMsg.includes("mail")) {
        mostrarError("Error: El correo electrónico ya está registrado en el sistema.");
      } else if (errorMsg.includes("contrasena") || errorMsg.includes("contraseña") || errorMsg.includes("password")) {
        mostrarError("Error: La contraseña no cumple con los requisitos.");
      } else if (errorMsg.includes("rol")) {
        mostrarError("Error: El rol especificado no es válido.");
      } else {
        mostrarError("Error al guardar usuario: " + error.message);
      }
    }
  };

  const handleEliminarPrograma = async (id) => {
    try {
      const result = await eliminarPrograma(id);
      mostrarExito(result.mensaje || "Programa eliminado exitosamente");
    } catch (error) {
      logger.error('Error al eliminar programa:', error);
      mostrarError(`Error al eliminar programa: ${error.message}`);
    }
  };

  const handleGuardarPrograma = async () => {
    try {
      setMostrarModalPrograma(false);
      await cargarProgramas();
      mostrarExito("Programa creado exitosamente");
    } catch (error) {
      logger.error("Error recargando programas:", error);
      mostrarError("El programa se creó pero hubo un error al recargar la lista");
    }
  };

  const guardarFicha = async (ficha) => {
    try {
      const esEdicion = !!ficha.id_ficha;

      const fichaData = {
        id_programa: ficha.id_programa,
        codigo_ficha: ficha.codigo_ficha,
        modalidad: ficha.modalidad,
        jornada: ficha.jornada,
        ambiente: ficha.ambiente,
        fecha_inicio: ficha.fecha_inicio,
        fecha_final: ficha.fecha_final,
        cantidad_trimestre: ficha.cantidad_trimestre ?? 3,
        instructores: ficha.instructores || [],
        id_instructor: ficha.id_instructor || null,
      };

      if (fichaSeleccionada) {
        fichaData.id_ficha = fichaSeleccionada.id_ficha;
      }

      const { resultado } = await guardarFichaEnApi(fichaData);
      mostrarExito(esEdicion ? "Ficha actualizada exitosamente" : "Ficha creada exitosamente");
      return resultado;
    } catch (error) {
      logger.error("❌ Error guardando ficha:", error);
      mostrarError(`Error al guardar ficha: ${error.message}`);
      throw error;
    }
  };

  const handleEliminarFicha = async (idFicha) => {
    try {
      await eliminarFichaEnApi(idFicha);
      mostrarExito("Ficha eliminada correctamente");
    } catch (error) {
      logger.error("Error eliminando ficha:", error);
      mostrarError(`Error al eliminar ficha: ${error.message}`);
    }
  };

  // Obtener nombre del programa por ID
  const obtenerNombrePrograma = (idPrograma) => {
    const programa = programas.find(p => p.id_programa == idPrograma);
    return programa ? programa.nombre_programa : "Programa no encontrado";
  };

  return (
    <Layout>
      <div className="usuarios-container">
        {/* Para depuración (puedes eliminar esto después) */}
        <div style={{ display: 'none' }}>
          <h4>Depuración - Usuarios existentes:</h4>
          <pre style={{ fontSize: '10px', background: '#f5f5f5', padding: '10px' }}>
            {debugInfo || 'No hay usuarios cargados'}
          </pre>
        </div>

        {/* MENU DE SECCIONES CON ANIMACIÓN */}
        <div className="menu-secciones-animadas">
          <div
            className={`tab ${seccionActiva === "instructores" ? "activo" : ""}`}
            onClick={() => setSeccionActiva("instructores")}
          >
            <i className="fas fa-user"></i>
            <span>Instructores</span>
          </div>
          <div
            className={`tab ${seccionActiva === "programas" ? "activo" : ""}`}
            onClick={() => setSeccionActiva("programas")}
          >
            <i className="fas fa-graduation-cap"></i>
            <span>Programas</span>
          </div>
          <div
            className={`tab ${seccionActiva === "fichas" ? "activo" : ""}`}
            onClick={() => setSeccionActiva("fichas")}
          >
            <i className="fas fa-file-alt"></i>
            <span>Fichas</span>
          </div>
        </div>

        {/* SECCIÓN INSTRUCTORES */}
        {seccionActiva === "instructores" && (
          <>
            <div className="usuarios-header">
              <div>
                <h2 className="titulo-seccion">Gestión de Instructores</h2>
                <p className="subtitulo">
                  Administra instructores, gestores y administradores del sistema.
                </p>
              </div>

              <button className="btn-crear" onClick={() => abrirModal()}>
                <i className="fas fa-user-plus"></i> Crear Instructor
              </button>
            </div>

            <div className="usuarios-lista">
              {usuarios.filter(u => u.rol !== "Administrador").length === 0 ? (
                <p>No hay instructores registrados en el sistema.</p>
              ) : (
                usuarios
                  .filter(u => u.rol !== "Administrador")
                  .map((u) => (
                    <div key={u.id_instructor} className="usuario-card">
                      <div className="usuario-info">
                        <h4>{u.nombre}</h4>
                        <p><strong>Correo:</strong> {u.email}</p>
                      </div>
                      <div className="acciones-card">
                        <button
                          className="btn-editar"
                          onClick={() => abrirModal(u)}
                          title="Editar instructor"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        <button
                          className="btn-eliminar"
                          onClick={() => mostrarConfirmacion(
                            "¿Estás seguro de que deseas eliminar este instructor? Esta acción no se puede deshacer.",
                            'eliminarInstructor',
                            u.id_instructor
                          )}
                          title="Eliminar instructor"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>

            {mostrarModal && (
              <div className="modal-overlay" onClick={cerrarModal}>
                <div
                  className="modal-contenido animate-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3>{modoEdicion ? "Editar Instructor" : "Crear Nuevo Instructor"}</h3>
                  <p className="descripcion-modal">
                    {modoEdicion
                      ? "Modifica los datos del instructor seleccionado."
                      : "Completa los siguientes campos para registrar un nuevo instructor."}
                  </p>

                  <form className="form-modal" onSubmit={handleSubmit}>
                    {/* Campo oculto para el ID en modo edición */}
                    {modoEdicion && (
                      <input
                        type="hidden"
                        name="id_instructor"
                        value={formUsuario.id_instructor}
                      />
                    )}

                    <label>Cédula*</label>
                    <input
                      type="text"
                      name="cedula"
                      placeholder="Número de cédula (7-20 dígitos)"
                      value={formUsuario.cedula}
                      onChange={(e) => {
                        const soloNumeros = e.target.value.replace(/\D/g, "");
                        if (soloNumeros.length <= 20) {
                          handleChange({
                            target: { name: "cedula", value: soloNumeros }
                          });
                        }
                      }}
                      minLength={7}
                      maxLength={20}
                      required
                      className={erroresValidacion.cedula ? 'input-error' : ''}
                    />
                    {erroresValidacion.cedula && (
                      <div className="mensaje-error">{erroresValidacion.cedula}</div>
                    )}

                    <label>Nombre Completo*</label>
                    <input
                      type="text"
                      name="nombre"
                      placeholder="Nombre completo (mínimo 3 letras)"
                      value={formUsuario.nombre}
                      onChange={(e) => {
                        const soloLetras = e.target.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, "");
                        handleChange({
                          target: { name: "nombre", value: soloLetras }
                        });
                      }}
                      required
                      className={erroresValidacion.nombre ? 'input-error' : ''}
                    />
                    {erroresValidacion.nombre && (
                      <div className="mensaje-error">{erroresValidacion.nombre}</div>
                    )}

                    <label>Correo Electrónico*</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="ejemplo@sena.edu.co"
                      value={formUsuario.email}
                      onChange={handleChange}
                      required
                      className={erroresValidacion.email ? 'input-error' : ''}
                    />
                    {erroresValidacion.email && (
                      <div className="mensaje-error">{erroresValidacion.email}</div>
                    )}
                    <div className="sugerencia-correo">
                      <small>Ejemplos válidos: nombre.apellido@sena.edu.co, usuario@dominio.com</small>
                    </div>

                    <>
                      {/* Mostrar siempre el campo contraseña */}
                      <label>Contraseña*</label>
                      <input
                        type="password"
                        name="contrasena"
                        placeholder="•••••••••• (mínimo 8 caracteres)"
                        value={formUsuario.contrasena}
                        onChange={handleChange}
                        required
                        minLength={8}
                        className={erroresValidacion.contrasena ? 'input-error' : ''}
                      />
                      {erroresValidacion.contrasena && (
                        <div className="mensaje-error">{erroresValidacion.contrasena}</div>
                      )}
                      <div className="sugerencia-contrasena">
                        <small>Debe incluir mayúsculas, minúsculas y números</small>
                      </div>
                    </>

                    <div className="acciones-modal">
                      <button type="button" className="btn-cancelar" onClick={cerrarModal}>
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn-crear-usuario"
                        disabled={
                          Object.values(erroresValidacion).some(error => error !== '') ||
                          !formUsuario.cedula ||
                          !formUsuario.nombre ||
                          !formUsuario.email ||
                          (!modoEdicion && !formUsuario.contrasena)
                        }
                      >
                        {modoEdicion ? "Guardar Cambios" : "Crear Instructor"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {/* SECCIÓN PROGRAMAS */}
        {seccionActiva === "programas" && (
          <>
            <div className="usuarios-header">
              <div>
                <h2 className="titulo-seccion">Gestión de Programas</h2>
                <p className="subtitulo">
                  Administra los programas de formación del sistema.
                </p>
              </div>

              <button
                className="btn-crear"
                onClick={() => setMostrarModalPrograma(true)}
              >
                <i className="fas fa-book-open"></i> Crear Programa
              </button>
            </div>

            <div className="usuarios-lista">
              {programas.length === 0 ? (
                <p>No hay programas registrados.</p>
              ) : (
                programas.map((p) => (
                  <div key={p.id_programa} className="usuario-card">
                    <div className="usuario-info">
                      <h4>{p.nombre_programa}</h4>
                      <p><strong>Código:</strong> {p.codigo_programa}</p>
                      <p><strong>Fichas Asociadas:</strong> {p.total_fichas}</p>
                    </div>
                    <div className="acciones-card">
                      <button
                        className="btn-eliminar"
                        onClick={() => mostrarConfirmacion(
                          "¿Estás seguro de que deseas eliminar este programa? Esta acción eliminará todas las fichas asociadas.",
                          'eliminarPrograma',
                          p.id_programa
                        )}
                        title="Eliminar programa"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {mostrarModalPrograma && (
              <ModalPrograma
                onClose={() => setMostrarModalPrograma(false)}
                onSave={handleGuardarPrograma}
              />
            )}
          </>
        )}

        {/* SECCIÓN FICHAS */}
        {seccionActiva === "fichas" && (
          <div className="fichas-seccion">
            <div className="usuarios-header">
              <div>
                <h2 className="titulo-seccion">Gestión de Fichas</h2>
                <p className="subtitulo">
                  Administra las fichas activas de los programas de formación.
                </p>
              </div>

              <button className="btn-crear" onClick={() => { abrirModalFicha(null) }}>
                <i className="fas fa-folder-plus"></i> Crear Ficha
              </button>
            </div>

            <div className="usuarios-lista">
              {fichas.length === 0 ? (
                <p>No hay fichas registradas.</p>
              ) : (
                fichas.map((ficha) => (
                  <div key={ficha.id_ficha} className="usuario-card">
                    <div className="usuario-info">
                      <h4>Ficha #{ficha.codigo_ficha}</h4>
                      <p><strong>Programa:</strong> {ficha.nombre_programa || obtenerNombrePrograma(ficha.id_programa)}</p>
                      <p><strong>Modalidad:</strong> {ficha.modalidad}</p>
                      <p><strong>Jornada:</strong> {ficha.jornada}</p>
                      <p><strong>Ambiente:</strong> {ficha.ubicacion}</p>
                      <p><strong>Fecha Inicio:</strong> {new Date(ficha.fecha_inicio).toLocaleDateString()}</p>
                      <p><strong>Fecha Fin:</strong> {new Date(ficha.fecha_fin).toLocaleDateString()}</p>
                    </div>

                    <div className="acciones-card">
                      <button
                        className="btn-editar"
                        onClick={() => { abrirModalFicha(ficha) }}
                        title="Editar ficha"
                      >
                        <i className="fas fa-pen"></i>
                      </button>

                      <button
                        className="btn-eliminar"
                        onClick={() => mostrarConfirmacion(
                          "¿Estás seguro de que deseas eliminar esta ficha? Esta acción no se puede deshacer.",
                          'eliminarFicha',
                          ficha.id_ficha
                        )}
                        title="Eliminar ficha"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {modalAbierto && (
              <ModalFicha
                fichaSeleccionada={fichaSeleccionada}
                fichasExistentes={fichas} // Pasar las fichas existentes
                onClose={() => { cerrarModalFicha(); }}
                onSave={async (nuevaFicha) => {
                  await guardarFicha(nuevaFicha);
                  setModalAbierto(false);
                }}
              />
            )}
          </div>
        )}

        {/* MODALES DE ÉXITO Y ERROR */}
        {mostrarModalExito && (
          <ModalExito
            onClose={cerrarModalExito}
            titulo="¡Operación Exitosa!"
            mensaje={mensajeModal}
            textoBoton="Continuar"
          />
        )}

        {mostrarModalError && (
          <ModalError
            onClose={cerrarModalError}
            titulo="Error"
            mensaje={mensajeModal}
            textoBoton="Entendido"
          />
        )}

        {/* MODAL DE CONFIRMACIÓN */}
        {mostrarModalConfirmacion && (
          <ModalConfirmacion
            onClose={cerrarModalConfirmacion}
            onConfirm={ejecutarAccionConfirmada}
            titulo="Confirmar Eliminación"
            mensaje={mensajeModal}
            textoConfirmar="Eliminar"
            textoCancelar="Cancelar"
          />
        )}
      </div>
    </Layout>
  );
};