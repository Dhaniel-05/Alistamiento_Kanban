const express = require('express');
const FichasController = require('../controllers/fichas.controller');
const autorizarRol = require('../middleware/autorizarRol');
const { autorizarPropietarioORol } = require('../middleware/autorizarRol');
const validate = require('../middleware/validate');
const {
  fichaBodySchema,
  idParamSchema,
  idProgramaParamSchema,
  idInstructorParamSchema,
} = require('../validators/fichas.validator');

const router = express.Router();
const fichasController = new FichasController();

const lecturaFichas = autorizarRol('Instructor', 'Gestor', 'Administrador');
const gestionFichas = autorizarRol('Administrador', 'Gestor');
const fichasPropiasOAdminGestor = autorizarPropietarioORol('id_instructor', 'Administrador', 'Gestor');

router.get(
  '/instructor/:id_instructor',
  validate(idInstructorParamSchema, 'params'),
  fichasPropiasOAdminGestor,
  fichasController.obtenerFichasInstructor,
);
router.get('/todas', lecturaFichas, (req, res) => fichasController.obtenerTodasLasFichas(req, res));
router.get('/', lecturaFichas, (req, res) => fichasController.obtenerTodasLasFichas(req, res));
// TODO: confirmar si Instructor debe ver fichas de cualquier programa sin validar asignación a la ficha
router.get('/:id_programa', lecturaFichas, validate(idProgramaParamSchema, 'params'), (req, res) =>
  fichasController.obtenerFichasPorProgramas(req, res),
);
router.post('/', gestionFichas, validate(fichaBodySchema, 'body'), (req, res) =>
  fichasController.agregarFichas(req, res),
);
router.delete('/:id', gestionFichas, validate(idParamSchema, 'params'), (req, res) =>
  fichasController.eliminarFicha(req, res),
);
router.put('/:id', gestionFichas, validate(idParamSchema, 'params'), validate(fichaBodySchema, 'body'), (req, res) =>
  fichasController.actualizarFicha(req, res),
);

module.exports = router;
