const { z } = require('zod');

const positiveInt = z.coerce.number().int().positive();

const idParamSchema = z.object({
  id: positiveInt,
});

const idFichaParamSchema = z.object({
  id_ficha: positiveInt,
});

const idProgramaParamSchema = z.object({
  id_programa: positiveInt,
});

const idInstructorParamSchema = z.object({
  id_instructor: positiveInt,
});

module.exports = {
  positiveInt,
  idParamSchema,
  idFichaParamSchema,
  idProgramaParamSchema,
  idInstructorParamSchema,
};
