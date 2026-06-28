const { z } = require('zod');

const pdfTipoEnum = z.enum([
  'programa',
  'competencias',
  'raps',
  'proyecto',
  'fases',
  'actividades',
  'todo',
]);

const pdfProcesarBodySchema = z.object({
  tipo: pdfTipoEnum.optional().default('todo'),
});

module.exports = {
  pdfProcesarBodySchema,
  pdfTipoEnum,
};
