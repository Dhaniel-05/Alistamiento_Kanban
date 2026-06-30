const express = require('express');
const FichasController = require('../controllers/fichas.controller');
const FichaFasesController = require('../controllers/fichaFases.controller');
const autorizarPermiso = require('../middleware/autorizarPermiso');
const { autorizarPropietarioOPermiso } = require('../middleware/autorizarRol');
const validate = require('../middleware/validate');
const {
  fichaBodySchema,
  idParamSchema,
  idProgramaParamSchema,
  idInstructorParamSchema,
} = require('../validators/fichas.validator');
const {
  idFichaFaseParamSchema,
  cambiarEstadoFaseBodySchema,
} = require('../validators/fases.validator');

const router = express.Router();
const fichasController = new FichasController();
const fichaFasesController = new FichaFasesController();

const fichasPropiasOPermiso = autorizarPropietarioOPermiso('id_instructor', 'ficha.leer');

router.get(
  '/instructor/:id_instructor',
  validate(idInstructorParamSchema, 'params'),
  fichasPropiasOPermiso,
  fichasController.obtenerFichasInstructor,
);
router.patch(
  '/fases/:idFichaFase/estado',
  autorizarPermiso('fase.gestionar'),
  validate(idFichaFaseParamSchema, 'params'),
  validate(cambiarEstadoFaseBodySchema, 'body'),
  (req, res, next) => fichaFasesController.cambiarEstado(req, res, next),
);
router.get(
  '/todas',
  autorizarPermiso('ficha.leer'),
  (req, res) => fichasController.obtenerTodasLasFichas(req, res),
);
router.get(
  '/',
  autorizarPermiso('ficha.leer'),
  (req, res) => fichasController.obtenerTodasLasFichas(req, res),
);
router.get(
  '/:id/fases',
  autorizarPermiso('ficha.leer'),
  validate(idParamSchema, 'params'),
  (req, res, next) => fichaFasesController.listarPorFicha(req, res, next),
);
router.post(
  '/:id/fases/regenerar',
  autorizarPermiso('fase.gestionar'),
  validate(idParamSchema, 'params'),
  (req, res, next) => fichaFasesController.regenerar(req, res, next),
);
router.get(
  '/:id_programa',
  autorizarPermiso('ficha.leer'),
  validate(idProgramaParamSchema, 'params'),
  (req, res) => fichasController.obtenerFichasPorProgramas(req, res),
);
router.post(
  '/',
  autorizarPermiso('ficha.crear'),
  validate(fichaBodySchema, 'body'),
  (req, res, next) => fichasController.agregarFichas(req, res, next),
);
router.delete(
  '/:id',
  autorizarPermiso('ficha.eliminar'),
  validate(idParamSchema, 'params'),
  (req, res) => fichasController.eliminarFicha(req, res),
);
router.put(
  '/:id',
  autorizarPermiso('ficha.editar'),
  validate(idParamSchema, 'params'),
  validate(fichaBodySchema, 'body'),
  (req, res) => fichasController.actualizarFicha(req, res),
);

module.exports = router;
