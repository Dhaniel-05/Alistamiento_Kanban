import httpClient from './httpClient';
import { logger } from '../utils/logger';

const INSTRUCTORES_PATH = '/instructores';

function normalizeEstado(estado) {
  if (estado === 'Deshabilitado' || estado === 0 || estado === '0') {
    return 'Deshabilitado';
  }
  return 'Activo';
}

function extractApiErrorMessage(error, fallback) {
  const data = error.response?.data;
  if (!data) {
    return error.message || fallback;
  }
  if (data.code === 'VALIDATION_ERROR') {
    return 'Datos de entrada inválidos. Revisa los campos del formulario.';
  }
  if (typeof data.error === 'string') {
    return data.error;
  }
  if (typeof data.mensaje === 'string') {
    return data.mensaje;
  }
  return fallback;
}

export const leerUsuarios = async () => {
  try {
    const response = await httpClient.get(INSTRUCTORES_PATH);
    return response.data;
  } catch (error) {
    logger.error('❌ Error en leerUsuarios:', error);
    return [];
  }
};

export const crearUsuario = async (usuario) => {
  try {
    logger.debug('📤 Datos recibidos para CREAR:', usuario);

    const usuarioCompleto = {
      ...usuario,
      id_rol: Number(usuario.id_rol) || 2,
      estado: normalizeEstado(usuario.estado),
    };

    logger.debug('📤 Datos procesados para enviar:', usuarioCompleto);

    const response = await httpClient.post(INSTRUCTORES_PATH, usuarioCompleto);
    return response.data;
  } catch (error) {
    logger.error('❌ Error en crearUsuario:', error);
    throw new Error(extractApiErrorMessage(error, 'Error al crear usuario'));
  }
};

export const actualizarUsuario = async (usuario) => {
  try {
    logger.debug('📤 Datos recibidos para ACTUALIZAR:', usuario);

    const usuarioId = usuario.id_instructor || usuario.id;

    if (!usuarioId) {
      throw new Error('ID de usuario no proporcionado');
    }

    logger.debug('🎯 ID del usuario a actualizar:', usuarioId);

    const datosParaEnviar = {
      cedula: String(usuario.cedula || '').trim(),
      nombre: String(usuario.nombre || '').trim(),
      email: String(usuario.email || '').trim().toLowerCase(),
      ...(usuario.contrasena && usuario.contrasena.trim() !== '' && {
        contrasena: usuario.contrasena,
      }),
      id_rol: Number(usuario.id_rol) || 2,
      estado: normalizeEstado(usuario.estado),
    };

    logger.debug('🎯 Datos procesados para enviar:', datosParaEnviar);

    const response = await httpClient.put(`${INSTRUCTORES_PATH}/${usuarioId}`, datosParaEnviar);
    logger.debug('✅ Usuario actualizado exitosamente:', response.data);
    return response.data;
  } catch (error) {
    logger.error('❌ Error en actualizarUsuario:', error);
    throw new Error(extractApiErrorMessage(error, 'Error al actualizar usuario'));
  }
};

export const eliminarUsuario = async (id) => {
  try {
    logger.debug('🗑️ Eliminando usuario ID:', id);
    const response = await httpClient.delete(`${INSTRUCTORES_PATH}/${id}`);
    return response.data;
  } catch (error) {
    logger.error('❌ Error en eliminarUsuario:', error);
    throw error;
  }
};

export const buscarUsuarioPorId = async (id) => {
  try {
    const usuarios = await leerUsuarios();
    return usuarios.find((u) => u.id_instructor == id || u.id == id);
  } catch (error) {
    logger.error('❌ Error en buscarUsuarioPorId:', error);
    return null;
  }
};
