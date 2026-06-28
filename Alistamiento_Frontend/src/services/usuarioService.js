import httpClient from './httpClient';
import { logger } from '../utils/logger';

const INSTRUCTORES_PATH = '/instructores';

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
      estado: Number(usuario.estado) || 1,
    };

    logger.debug('📤 Datos procesados para enviar:', usuarioCompleto);

    const response = await httpClient.post(INSTRUCTORES_PATH, usuarioCompleto);
    return response.data;
  } catch (error) {
    logger.error('❌ Error en crearUsuario:', error);
    const message = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message;
    throw new Error(message || 'Error al crear usuario');
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
      estado: Number(usuario.estado) || 1,
    };

    logger.debug('🎯 Datos procesados para enviar:', datosParaEnviar);

    const response = await httpClient.put(`${INSTRUCTORES_PATH}/${usuarioId}`, datosParaEnviar);
    logger.debug('✅ Usuario actualizado exitosamente:', response.data);
    return response.data;
  } catch (error) {
    logger.error('❌ Error en actualizarUsuario:', error);
    const errorData = error.response?.data;
    throw new Error(errorData?.error || errorData?.mensaje || error.message);
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
