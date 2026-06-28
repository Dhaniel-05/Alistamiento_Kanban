const { z } = require('zod');
const { positiveInt, idParamSchema } = require('./common.validator');

const instructorEstadoEnum = z.enum(['Activo', 'Deshabilitado']);

const createInstructorBodySchema = z.object({
  id_rol: positiveInt,
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  email: z.string().trim().email('El correo no tiene un formato válido').max(150),
  contrasena: z.string().min(1, 'La contraseña es obligatoria'),
  cedula: z.string().trim().min(1, 'La cédula es obligatoria').max(50),
  estado: instructorEstadoEnum,
});

const updateInstructorBodySchema = z.object({
  id_rol: positiveInt,
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(150),
  email: z.string().trim().email('El correo no tiene un formato válido').max(150),
  contrasena: z.string().optional(),
  cedula: z.string().trim().min(1, 'La cédula es obligatoria').max(50),
  estado: instructorEstadoEnum,
});

const cambiarContrasenaBodySchema = z.object({
  nueva_contrasena: z.string().min(1, 'La nueva contraseña es obligatoria'),
});

const instructorEmailParamSchema = z.object({
  email: z.string().trim().email('El correo no tiene un formato válido'),
});

module.exports = {
  createInstructorBodySchema,
  updateInstructorBodySchema,
  cambiarContrasenaBodySchema,
  instructorEmailParamSchema,
  idParamSchema,
};
