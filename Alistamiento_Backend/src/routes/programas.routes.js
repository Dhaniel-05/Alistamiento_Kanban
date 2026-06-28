const express = require('express');
const ProgramaController = require('../controllers/programas.controller');
const autorizarRol = require('../middleware/autorizarRol');
const validate = require('../middleware/validate');
const {
  createProgramaBodySchema,
  updateProgramaBodySchema,
  idParamSchema,
} = require('../validators/programas.validator');

const router = express.Router();
const programaController = new ProgramaController();

const lecturaProgramas = autorizarRol('Instructor', 'Gestor', 'Administrador');
const gestionProgramas = autorizarRol('Administrador', 'Gestor');

router.get('/', lecturaProgramas, (req, res, next) => programaController.obtenerProgramas(req, res, next));
router.get('/:id', lecturaProgramas, validate(idParamSchema, 'params'), (req, res, next) =>
  programaController.obtenerProgramaPorId(req, res, next),
);
router.post('/', gestionProgramas, validate(createProgramaBodySchema, 'body'), (req, res, next) =>
  programaController.agregarPrograma(req, res, next),
);
router.put('/:id', gestionProgramas, validate(idParamSchema, 'params'), validate(updateProgramaBodySchema, 'body'), (req, res, next) =>
  programaController.actualizarPrograma(req, res, next),
);
router.delete('/:id', gestionProgramas, validate(idParamSchema, 'params'), (req, res, next) =>
  programaController.eliminarPrograma(req, res, next),
);

module.exports = router;
