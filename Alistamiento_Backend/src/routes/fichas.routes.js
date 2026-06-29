const express = require('express');
const FichasController = require('../controllers/fichas.controller');
const FichaFasesController = require('../controllers/fichaFases.controller');
const autorizarRol = require('../middleware/autorizarRol');
const { autorizarPropietarioORol } = require('../middleware/autorizarRol');
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

const lecturaFichas = autorizarRol('Instructor', 'Gestor', 'Administrador');
const gestionFichas = autorizarRol('Administrador', 'Gestor');
const soloAdminGestor = autorizarRol('Administrador', 'Gestor');
const fichasPropiasOAdminGestor = autorizarPropietarioORol('id_instructor', 'Administrador', 'Gestor');

router.get(
  '/instructor/:id_instructor',
  validate(idInstructorParamSchema, 'params'),
  fichasPropiasOAdminGestor,
  fichasController.obtenerFichasInstructor,
);
router.patch(
  '/fases/:idFichaFase/estado',
  soloAdminGestor,
  validate(idFichaFaseParamSchema, 'params'),
  validate(cambiarEstadoFaseBodySchema, 'body'),
  (req, res, next) => fichaFasesController.cambiarEstado(req, res, next),
);
router.get('/todas', lecturaFichas, (req, res) => fichasController.obtenerTodasLasFichas(req, res));
router.get('/', lecturaFichas, (req, res) => fichasController.obtenerTodasLasFichas(req, res));
router.get('/:id/fases', validate(idParamSchema, 'params'), (req, res, next) =>
  fichaFasesController.listarPorFicha(req, res, next),
);
router.post('/:id/fases/regenerar', soloAdminGestor, validate(idParamSchema, 'params'), (req, res, next) =>
  fichaFasesController.regenerar(req, res, next),
);
// TODO: confirmar si Instructor debe ver fichas de cualquier programa sin validar asignación a la ficha
router.get('/:id_programa', lecturaFichas, validate(idProgramaParamSchema, 'params'), (req, res) =>
  fichasController.obtenerFichasPorProgramas(req, res),
);
router.post('/', gestionFichas, validate(fichaBodySchema, 'body'), (req, res, next) =>
  fichasController.agregarFichas(req, res, next),
);
router.delete('/:id', gestionFichas, validate(idParamSchema, 'params'), (req, res) =>
  fichasController.eliminarFicha(req, res),
);
router.put('/:id', gestionFichas, validate(idParamSchema, 'params'), validate(fichaBodySchema, 'body'), (req, res) =>
  fichasController.actualizarFicha(req, res),
);

module.exports = router;
