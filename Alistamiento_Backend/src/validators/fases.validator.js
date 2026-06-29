const { z } = require('zod');
const { positiveInt, idParamSchema } = require('./common.validator');

const jornadaFaseEnum = z.enum(['Diurna', 'Nocturna', 'Personalizada']);

const jornadaQuerySchema = z.object({
  jornada: jornadaFaseEnum.optional(),
});

const faseConfigBodySchema = z.object({
  jornada: jornadaFaseEnum,
  nombre_fase: z.string().trim().min(1, 'El nombre de la fase es obligatorio').max(100),
  orden: positiveInt,
  color: z.string().trim().max(20).optional(),
  descripcion: z.string().trim().optional().nullable(),
  activo: z.coerce.number().int().min(0).max(1).optional(),
});

const idFichaFaseParamSchema = z.object({
  idFichaFase: positiveInt,
});

const cambiarEstadoFaseBodySchema = z.object({
  estado: z.enum(['Abierta', 'Bloqueada']),
});

module.exports = {
  jornadaQuerySchema,
  faseConfigBodySchema,
  idParamSchema,
  idFichaFaseParamSchema,
  cambiarEstadoFaseBodySchema,
};
