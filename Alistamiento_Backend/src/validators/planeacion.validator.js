const { z } = require('zod');
const { positiveInt, idParamSchema, idFichaParamSchema } = require('./common.validator');

const rapDetalleSchema = z.object({
  id_rap: positiveInt,
  codigo_rap: z.string().trim().max(20).optional(),
  nombre_rap: z.string().optional(),
  competencia: z.string().optional(),
  horas_trimestre: z.coerce.number().int().nonnegative().optional(),
  actividades_aprendizaje: z.string().optional(),
  duracion_directa: z.coerce.number().int().nonnegative().optional(),
  duracion_independiente: z.coerce.number().int().nonnegative().optional(),
  descripcion_evidencia: z.string().optional(),
  estrategias_didacticas: z.string().max(100).optional(),
  ambientes_aprendizaje: z.string().max(100).optional(),
  materiales_formacion: z.string().optional(),
  observaciones: z.string().optional(),
  saberes_conceptos: z.string().optional(),
  saberes_proceso: z.string().optional(),
  criterios_evaluacion: z.string().optional(),
});

const crearPlaneacionBodySchema = z
  .object({
    id_ficha: positiveInt,
    id_trimestre: positiveInt.optional(),
    trimestre: positiveInt.optional(),
    raps: z.array(rapDetalleSchema).min(1, 'Se requiere al menos un RAP'),
    info_ficha: z.record(z.unknown()).optional(),
    fecha_creacion: z.string().trim().optional(),
    instructor: z.unknown().optional(),
  })
  .refine((data) => data.id_trimestre !== undefined || data.trimestre !== undefined, {
    message: 'Se requiere id_trimestre o trimestre (número de trimestre)',
    path: ['id_trimestre'],
  });

const detalleUpdateItemSchema = z.object({
  id_detalle: positiveInt,
  actividades_aprendizaje: z.string().optional(),
  duracion_directa: z.coerce.number().int().nonnegative().optional(),
  duracion_independiente: z.coerce.number().int().nonnegative().optional(),
  descripcion_evidencia: z.string().optional(),
  estrategias_didacticas: z.string().max(100).optional(),
  ambientes_aprendizaje: z.string().max(100).optional(),
  materiales_formacion: z.string().optional(),
  observaciones: z.string().optional(),
  saberes_conceptos: z.string().optional(),
  saberes_proceso: z.string().optional(),
  criterios_evaluacion: z.string().optional(),
});

const actualizarPlaneacionBodySchema = z.object({
  detalles: z.array(detalleUpdateItemSchema).min(1, 'Se requiere al menos un detalle'),
});

const exportExcelQuerySchema = z.object({
  id_ficha: positiveInt,
  id_trimestre: positiveInt.optional(),
});

module.exports = {
  crearPlaneacionBodySchema,
  actualizarPlaneacionBodySchema,
  exportExcelQuerySchema,
  idParamSchema,
  idFichaParamSchema,
};
