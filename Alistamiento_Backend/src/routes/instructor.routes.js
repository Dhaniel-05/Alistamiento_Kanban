const express = require('express');
const InstructoresController = require('../controllers/instructores.controller');
const autorizarPermiso = require('../middleware/autorizarPermiso');
const { autorizarPropietarioOPermiso } = require('../middleware/autorizarRol');
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

const propietarioOEditor = autorizarPropietarioOPermiso('id', 'instructor.editar');
const lecturaInstructor = autorizarPropietarioOPermiso('id', 'instructor.leer');

router.get(
  '/:id/fichas',
  validate(idParamSchema, 'params'),
  autorizarPropietarioOPermiso('id', 'ficha.leer'),
  (req, res, next) => instructoresController.obtenerFichasPorInstructor(req, res, next),
);

router.get('/', autorizarPermiso('instructor.leer'), (req, res, next) =>
  instructoresController.obtenerInstructores(req, res, next),
);
router.get(
  '/email/:email',
  autorizarPermiso('instructor.leer'),
  validate(instructorEmailParamSchema, 'params'),
  (req, res, next) => instructoresController.obtenerInstructorPorEmail(req, res, next),
);
router.get('/:id', validate(idParamSchema, 'params'), lecturaInstructor, (req, res, next) =>
  instructoresController.obtenerInstructorPorId(req, res, next),
);
router.post('/', autorizarPermiso('instructor.crear'), validate(createInstructorBodySchema, 'body'), (req, res, next) =>
  instructoresController.agregarInstructor(req, res, next),
);
router.put(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateInstructorBodySchema, 'body'),
  propietarioOEditor,
  (req, res, next) => instructoresController.actualizarInstructor(req, res, next),
);
router.put(
  '/:id/cambiar-contrasena',
  validate(idParamSchema, 'params'),
  validate(cambiarContrasenaBodySchema, 'body'),
  propietarioOEditor,
  (req, res, next) => instructoresController.cambiarContrasena(req, res, next),
);
router.delete('/:id', autorizarPermiso('instructor.eliminar'), validate(idParamSchema, 'params'), (req, res, next) =>
  instructoresController.eliminarInstructor(req, res, next),
);

module.exports = router;
