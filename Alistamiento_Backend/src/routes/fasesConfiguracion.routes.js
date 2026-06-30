const express = require('express');
const FasesConfiguracionController = require('../controllers/fasesConfiguracion.controller');
const autorizarPermiso = require('../middleware/autorizarPermiso');
const validate = require('../middleware/validate');
const {
  jornadaQuerySchema,
  faseConfigBodySchema,
  idParamSchema,
} = require('../validators/fases.validator');

const router = express.Router();
const fasesConfiguracionController = new FasesConfiguracionController();

router.get('/', autorizarPermiso('ficha.leer'), validate(jornadaQuerySchema, 'query'), (req, res, next) =>
  fasesConfiguracionController.listar(req, res, next),
);
router.get('/:id', autorizarPermiso('ficha.leer'), validate(idParamSchema, 'params'), (req, res, next) =>
  fasesConfiguracionController.obtener(req, res, next),
);
router.post('/', autorizarPermiso('fase.gestionar'), validate(faseConfigBodySchema, 'body'), (req, res, next) =>
  fasesConfiguracionController.crear(req, res, next),
);
router.put(
  '/:id',
  autorizarPermiso('fase.gestionar'),
  validate(idParamSchema, 'params'),
  validate(faseConfigBodySchema, 'body'),
  (req, res, next) => fasesConfiguracionController.actualizar(req, res, next),
);
router.delete('/:id', autorizarPermiso('fase.gestionar'), validate(idParamSchema, 'params'), (req, res, next) =>
  fasesConfiguracionController.eliminar(req, res, next),
);

module.exports = router;
