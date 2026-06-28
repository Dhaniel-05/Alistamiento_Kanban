const { z } = require('zod');
const { positiveInt, idParamSchema } = require('./common.validator');

const jornadaEnum = z.enum(['Diurna', 'Nocturna']);

const fichaBodySchema = z.object({
  id_programa: positiveInt,
  codigo_ficha: z.string().trim().min(1, 'El código de ficha es obligatorio').max(20),
  modalidad: z.string().trim().min(1, 'La modalidad es obligatoria').max(20),
  jornada: jornadaEnum,
  ambiente: z.string().trim().min(1, 'El ambiente es obligatorio').max(10),
  fecha_inicio: z.string().trim().min(1, 'La fecha de inicio es obligatoria'),
  fecha_final: z.string().trim().min(1, 'La fecha final es obligatoria'),
  cantidad_trimestre: positiveInt,
  gestor: positiveInt.optional(),
  instructores: z.array(positiveInt).optional(),
});

module.exports = {
  fichaBodySchema,
  idParamSchema,
  idProgramaParamSchema: z.object({
    id_programa: positiveInt,
  }),
  idInstructorParamSchema: z.object({
    id_instructor: positiveInt,
  }),
};
