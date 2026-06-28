const { z } = require('zod');
const { idParamSchema } = require('./common.validator');

const createProgramaBodySchema = z.object({
  codigo_programa: z.string().trim().min(1, 'El código del programa es obligatorio').max(20),
  nombre_programa: z.string().trim().min(1, 'El nombre del programa es obligatorio'),
});

const updateProgramaBodySchema = createProgramaBodySchema;

module.exports = {
  createProgramaBodySchema,
  updateProgramaBodySchema,
  idParamSchema,
};
