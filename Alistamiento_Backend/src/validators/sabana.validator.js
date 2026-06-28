const { z } = require('zod');
const { positiveInt } = require('./common.validator');

const sabanaAssignBodySchema = z.object({
  id_rap: positiveInt,
  id_trimestre: positiveInt,
  id_ficha: positiveInt,
  move: z.coerce.boolean().optional(),
});

const sabanaUnassignBodySchema = z.object({
  id_rap: positiveInt,
  id_trimestre: positiveInt,
  id_ficha: positiveInt,
});

const sabanaRapIdParamSchema = z.object({
  id: positiveInt,
});

const sabanaRapsAsignadosParamsSchema = z.object({
  id_ficha: positiveInt,
  id_trimestre: positiveInt,
});

module.exports = {
  sabanaAssignBodySchema,
  sabanaUnassignBodySchema,
  sabanaRapIdParamSchema,
  sabanaRapsAsignadosParamsSchema,
};
