const express = require('express');
const InstructoresController = require('../controllers/instructores.controller');
const autorizarRol = require('../middleware/autorizarRol');
const { autorizarPropietarioORol } = require('../middleware/autorizarRol');
const validate = require('../middleware/validate');
const {
  createInstructorBodySchema,
  updateInstructorBodySchema,
  cambiarContrasenaBodySchema,
  instructorEmailParamSchema,
  idParamSchema,
} = require('../validators/instructores.validator');

const router = express.Router();
const instructoresController = new InstructoresController();

const soloAdminGestor = autorizarRol('Administrador', 'Gestor');
const propietarioOAdminGestor = autorizarPropietarioORol('id', 'Administrador', 'Gestor');

router.get('/:id/fichas', validate(idParamSchema, 'params'), propietarioOAdminGestor, (req, res, next) =>
  instructoresController.obtenerFichasPorInstructor(req, res, next),
);

router.get('/', soloAdminGestor, (req, res, next) =>
  instructoresController.obtenerInstructores(req, res, next),
);
router.get('/email/:email', soloAdminGestor, validate(instructorEmailParamSchema, 'params'), (req, res, next) =>
  instructoresController.obtenerInstructorPorEmail(req, res, next),
);
router.get('/:id', validate(idParamSchema, 'params'), propietarioOAdminGestor, (req, res, next) =>
  instructoresController.obtenerInstructorPorId(req, res, next),
);
router.post('/', soloAdminGestor, validate(createInstructorBodySchema, 'body'), (req, res, next) =>
  instructoresController.agregarInstructor(req, res, next),
);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateInstructorBodySchema, 'body'), propietarioOAdminGestor, (req, res, next) =>
  instructoresController.actualizarInstructor(req, res, next),
);
router.put('/:id/cambiar-contrasena', validate(idParamSchema, 'params'), validate(cambiarContrasenaBodySchema, 'body'), propietarioOAdminGestor, (req, res, next) =>
  instructoresController.cambiarContrasena(req, res, next),
);
router.delete('/:id', soloAdminGestor, validate(idParamSchema, 'params'), (req, res, next) =>
  instructoresController.eliminarInstructor(req, res, next),
);

module.exports = router;
