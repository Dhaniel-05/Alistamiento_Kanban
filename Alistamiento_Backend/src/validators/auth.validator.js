const { z } = require('zod');

const loginBodySchema = z.object({
  email: z.string().trim().email('El correo no tiene un formato válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

module.exports = {
  loginBodySchema,
};
