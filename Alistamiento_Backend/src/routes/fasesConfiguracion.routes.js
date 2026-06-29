const express = require('express');
const FasesConfiguracionController = require('../controllers/fasesConfiguracion.controller');
const autorizarRol = require('../middleware/autorizarRol');
const validate = require('../middleware/validate');
const {
  jornadaQuerySchema,
  faseConfigBodySchema,
  idParamSchema,
} = require('../validators/fases.validator');

const router = express.Router();
const fasesConfiguracionController = new FasesConfiguracionController();

const soloAdminGestor = autorizarRol('Administrador', 'Gestor');

router.get('/', validate(jornadaQuerySchema, 'query'), (req, res, next) =>
  fasesConfiguracionController.listar(req, res, next),
);
router.get('/:id', validate(idParamSchema, 'params'), (req, res, next) =>
  fasesConfiguracionController.obtener(req, res, next),
);
router.post('/', soloAdminGestor, validate(faseConfigBodySchema, 'body'), (req, res, next) =>
  fasesConfiguracionController.crear(req, res, next),
);
router.put('/:id', soloAdminGestor, validate(idParamSchema, 'params'), validate(faseConfigBodySchema, 'body'), (req, res, next) =>
  fasesConfiguracionController.actualizar(req, res, next),
);
router.delete('/:id', soloAdminGestor, validate(idParamSchema, 'params'), (req, res, next) =>
  fasesConfiguracionController.eliminar(req, res, next),
);

module.exports = router;
