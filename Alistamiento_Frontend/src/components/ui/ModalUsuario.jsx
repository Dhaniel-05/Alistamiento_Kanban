import { useState, useEffect } from 'react';

const validarEmailCompleto = (email) => {
  const errores = [];

  if (!email) {
    return ['El correo electrónico es obligatorio'];
  }

  const emailNormalizado = email.trim().toLowerCase();

  if (emailNormalizado.length < 8) {
    errores.push('El correo es demasiado corto (mínimo 8 caracteres)');
  }

  const partes = emailNormalizado.split('@');
  if (partes.length !== 2) {
    errores.push("Formato de correo inválido. Debe contener un solo '@'");
    return errores;
  }

  const [usuario, dominio] = partes;

  if (usuario.length === 0) {
    errores.push("La parte antes del '@' no puede estar vacía");
  }

  if (dominio.length < 4) {
    errores.push('El dominio es demasiado corto');
  }

  const partesDominio = dominio.split('.');
  if (partesDominio.length < 2) {
    errores.push('El dominio debe contener al menos un punto (ej: dominio.com)');
  }

  if (emailNormalizado.length > 254) {
    errores.push('El correo es demasiado largo (máximo 254 caracteres)');
  }

  return errores;
};

const estadoInicialFormulario = (rolesAsignables, usuarioSeleccionado) => {
  const rolPorDefecto =
    rolesAsignables.find((rol) => rol.nombre === 'Instructor') || rolesAsignables[0];

  if (usuarioSeleccionado) {
    return {
      id_instructor: usuarioSeleccionado.id_instructor || usuarioSeleccionado.id || '',
      cedula: String(usuarioSeleccionado.cedula || ''),
      nombre: usuarioSeleccionado.nombre || '',
      email: usuarioSeleccionado.email || '',
      contrasena: '',
      id_rol: String(usuarioSeleccionado.id_rol || rolPorDefecto?.id_rol || ''),
      estado: usuarioSeleccionado.estado || 'Activo',
    };
  }

  return {
    id_instructor: '',
    cedula: '',
    nombre: '',
    email: '',
    contrasena: '',
    id_rol: rolPorDefecto ? String(rolPorDefecto.id_rol) : '',
    estado: 'Activo',
  };
};

export const ModalUsuario = ({
  onClose,
  onSave,
  usuarioSeleccionado = null,
  rolesAsignables = [],
}) => {
  const modoEdicion = Boolean(usuarioSeleccionado);
  const [formUsuario, setFormUsuario] = useState(() =>
    estadoInicialFormulario(rolesAsignables, usuarioSeleccionado),
  );
  const [erroresValidacion, setErroresValidacion] = useState({
    email: '',
    cedula: '',
    nombre: '',
    contrasena: '',
    id_rol: '',
  });

  useEffect(() => {
    setFormUsuario(estadoInicialFormulario(rolesAsignables, usuarioSeleccionado));
    setErroresValidacion({
      email: '',
      cedula: '',
      nombre: '',
      contrasena: '',
      id_rol: '',
    });
  }, [usuarioSeleccionado, rolesAsignables]);

  const validarEmailEnTiempoReal = (email) => {
    if (!email) {
      setErroresValidacion((prev) => ({ ...prev, email: '' }));
      return true;
    }

    const errores = validarEmailCompleto(email);
    if (errores.length > 0) {
      setErroresValidacion((prev) => ({ ...prev, email: errores[0] }));
      return false;
    }

    setErroresValidacion((prev) => ({ ...prev, email: '' }));
    return true;
  };

  const validarCedula = (cedula) => {
    const cedulaStr = String(cedula).trim();

    if (!cedulaStr) {
      setErroresValidacion((prev) => ({ ...prev, cedula: 'La cédula es obligatoria' }));
      return false;
    }

    if (!/^\d+$/.test(cedulaStr)) {
      setErroresValidacion((prev) => ({ ...prev, cedula: 'La cédula debe contener solo números' }));
      return false;
    }

    if (cedulaStr.length < 7 || cedulaStr.length > 20) {
      setErroresValidacion((prev) => ({
        ...prev,
        cedula: 'La cédula debe tener entre 7 y 20 dígitos',
      }));
      return false;
    }

    setErroresValidacion((prev) => ({ ...prev, cedula: '' }));
    return true;
  };

  const validarNombre = (nombre) => {
    const nombreStr = nombre.trim();

    if (!nombreStr) {
      setErroresValidacion((prev) => ({ ...prev, nombre: 'El nombre es obligatorio' }));
      return false;
    }

    if (nombreStr.length < 3) {
      setErroresValidacion((prev) => ({
        ...prev,
        nombre: 'El nombre debe tener al menos 3 caracteres',
      }));
      return false;
    }

    if (!/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(nombreStr)) {
      setErroresValidacion((prev) => ({
        ...prev,
        nombre: 'El nombre solo puede contener letras y espacios',
      }));
      return false;
    }

    setErroresValidacion((prev) => ({ ...prev, nombre: '' }));
    return true;
  };

  const validarContrasena = (contrasena, esEdicion) => {
    if (esEdicion && !contrasena) {
      setErroresValidacion((prev) => ({ ...prev, contrasena: '' }));
      return true;
    }

    if (!contrasena) {
      setErroresValidacion((prev) => ({ ...prev, contrasena: 'La contraseña es obligatoria' }));
      return false;
    }

    if (contrasena.length < 8) {
      setErroresValidacion((prev) => ({
        ...prev,
        contrasena: 'La contraseña debe tener al menos 8 caracteres',
      }));
      return false;
    }

    const tieneMayuscula = /[A-Z]/.test(contrasena);
    const tieneMinuscula = /[a-z]/.test(contrasena);
    const tieneNumero = /\d/.test(contrasena);

    if (!tieneMayuscula || !tieneMinuscula || !tieneNumero) {
      setErroresValidacion((prev) => ({
        ...prev,
        contrasena: 'La contraseña debe incluir mayúsculas, minúsculas y números',
      }));
      return false;
    }

    setErroresValidacion((prev) => ({ ...prev, contrasena: '' }));
    return true;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormUsuario((prev) => ({ ...prev, [name]: value }));

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
        validarContrasena(value, modoEdicion);
        break;
      case 'id_rol':
        setErroresValidacion((prev) => ({ ...prev, id_rol: '' }));
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const esEmailValido = validarEmailEnTiempoReal(formUsuario.email);
    const esCedulaValida = validarCedula(formUsuario.cedula);
    const esNombreValido = validarNombre(formUsuario.nombre);
    const esContrasenaValida = validarContrasena(formUsuario.contrasena, modoEdicion);
    const rolValido = Boolean(formUsuario.id_rol);

    if (!rolValido) {
      setErroresValidacion((prev) => ({ ...prev, id_rol: 'Seleccione un rol' }));
    }

    if (!esEmailValido || !esCedulaValida || !esNombreValido || !esContrasenaValida || !rolValido) {
      return;
    }

    const erroresCorreo = validarEmailCompleto(formUsuario.email);
    if (erroresCorreo.length > 0) {
      setErroresValidacion((prev) => ({ ...prev, email: erroresCorreo[0] }));
      return;
    }

    const usuarioNormalizado = {
      ...formUsuario,
      email: formUsuario.email.trim().toLowerCase(),
      cedula: String(formUsuario.cedula).trim(),
      id_rol: formUsuario.id_rol,
      estado: formUsuario.estado || 'Activo',
    };

    await onSave(usuarioNormalizado, modoEdicion);
  };

  if (rolesAsignables.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-contenido animate-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Sin permisos</h3>
          <p className="descripcion-modal">
            No tienes roles asignables para gestionar instructores.
          </p>
          <div className="acciones-modal">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenido animate-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{modoEdicion ? 'Editar Instructor' : 'Crear Nuevo Instructor'}</h3>
        <p className="descripcion-modal">
          {modoEdicion
            ? 'Modifica los datos del instructor seleccionado.'
            : 'Completa los siguientes campos para registrar un nuevo instructor.'}
        </p>

        <form className="form-modal" onSubmit={handleSubmit}>
          {modoEdicion && (
            <input type="hidden" name="id_instructor" value={formUsuario.id_instructor} />
          )}

          <label>Rol*</label>
          <select
            name="id_rol"
            value={formUsuario.id_rol}
            onChange={handleChange}
            required
            className={erroresValidacion.id_rol ? 'input-error' : ''}
          >
            <option value="">Seleccionar rol</option>
            {rolesAsignables.map((rol) => (
              <option key={rol.id_rol} value={String(rol.id_rol)}>
                {rol.nombre}
              </option>
            ))}
          </select>
          {erroresValidacion.id_rol && (
            <div className="mensaje-error">{erroresValidacion.id_rol}</div>
          )}

          <label>Cédula*</label>
          <input
            type="text"
            name="cedula"
            placeholder="Número de cédula (7-20 dígitos)"
            value={formUsuario.cedula}
            onChange={(e) => {
              const soloNumeros = e.target.value.replace(/\D/g, '');
              if (soloNumeros.length <= 20) {
                handleChange({ target: { name: 'cedula', value: soloNumeros } });
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
              const soloLetras = e.target.value.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, '');
              handleChange({ target: { name: 'nombre', value: soloLetras } });
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

          <label>{modoEdicion ? 'Nueva Contraseña (opcional)' : 'Contraseña*'}</label>
          <input
            type="password"
            name="contrasena"
            placeholder={modoEdicion ? 'Dejar vacío para mantener la actual' : 'Mínimo 8 caracteres'}
            value={formUsuario.contrasena}
            onChange={handleChange}
            required={!modoEdicion}
            minLength={modoEdicion ? undefined : 8}
            className={erroresValidacion.contrasena ? 'input-error' : ''}
          />
          {erroresValidacion.contrasena && (
            <div className="mensaje-error">{erroresValidacion.contrasena}</div>
          )}

          <label>Estado*</label>
          <select name="estado" value={formUsuario.estado} onChange={handleChange} required>
            <option value="Activo">Activo</option>
            <option value="Deshabilitado">Deshabilitado</option>
          </select>

          <div className="acciones-modal">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-crear-usuario"
              disabled={Object.values(erroresValidacion).some((error) => error !== '')}
            >
              {modoEdicion ? 'Guardar Cambios' : 'Crear Instructor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
