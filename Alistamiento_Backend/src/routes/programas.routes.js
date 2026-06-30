const express = require('express');
const ProgramaController = require('../controllers/programas.controller');
const autorizarPermiso = require('../middleware/autorizarPermiso');
const validate = require('../middleware/validate');
const {
  createProgramaBodySchema,
  updateProgramaBodySchema,
  idParamSchema,
} = require('../validators/programas.validator');

const router = express.Router();
const programaController = new ProgramaController();

router.get('/', autorizarPermiso('programa.leer'), (req, res, next) =>
  programaController.obtenerProgramas(req, res, next),
);
router.get('/:id', autorizarPermiso('programa.leer'), validate(idParamSchema, 'params'), (req, res, next) =>
  programaController.obtenerProgramaPorId(req, res, next),
);
router.post('/', autorizarPermiso('programa.crear'), validate(createProgramaBodySchema, 'body'), (req, res, next) =>
  programaController.agregarPrograma(req, res, next),
);
router.put(
  '/:id',
  autorizarPermiso('programa.editar'),
  validate(idParamSchema, 'params'),
  validate(updateProgramaBodySchema, 'body'),
  (req, res, next) => programaController.actualizarPrograma(req, res, next),
);
router.delete('/:id', autorizarPermiso('programa.eliminar'), validate(idParamSchema, 'params'), (req, res, next) =>
  programaController.eliminarPrograma(req, res, next),
);

module.exports = router;
