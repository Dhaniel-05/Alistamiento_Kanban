// routes/sabana.routes.js
const express = require('express');
const SabanaController = require('../controllers/sabana.controller');
const autorizarRol = require('../middleware/autorizarRol');
const validate = require('../middleware/validate');
const { idFichaParamSchema } = require('../validators/common.validator');
const {
  sabanaAssignBodySchema,
  sabanaUnassignBodySchema,
  sabanaRapIdParamSchema,
  sabanaRapsAsignadosParamsSchema,
} = require('../validators/sabana.validator');

const router = express.Router();
const sabanaController = new SabanaController();

router.use(autorizarRol('Instructor', 'Gestor', 'Administrador'));

router.get('/sabana/trimestres/:id_ficha', validate(idFichaParamSchema, 'params'), (req, res) =>
  sabanaController.obtenerTrimestres(req, res),
);

router.get('/raps/disponibles/:id_ficha', validate(idFichaParamSchema, 'params'), (req, res) =>
  sabanaController.obtenerRapsDisponibles(req, res),
);

router.get('/raps/asignados/:id_ficha/:id_trimestre', validate(sabanaRapsAsignadosParamsSchema, 'params'), (req, res) =>
  sabanaController.obtenerRapsAsignados(req, res),
);

router.get('/sabana/:id_ficha', validate(idFichaParamSchema, 'params'), (req, res) =>
  sabanaController.obtenerSabanaBase(req, res),
);

router.get('/sabana/matriz/:id_ficha', validate(idFichaParamSchema, 'params'), (req, res) =>
  sabanaController.obtenerSabanaMatriz(req, res),
);

router.post('/sabana/assign', validate(sabanaAssignBodySchema, 'body'), (req, res) =>
  sabanaController.asignarRap(req, res),
);

router.delete('/sabana/unassign', validate(sabanaUnassignBodySchema, 'body'), (req, res) =>
  sabanaController.quitarRap(req, res),
);

router.get('/sabana/instructores/:id_ficha', validate(idFichaParamSchema, 'params'), (req, res) =>
  sabanaController.obtenerInstructoresPorFicha(req, res),
);

router.post('/raps/asignar', validate(sabanaAssignBodySchema, 'body'), (req, res) =>
  sabanaController.asignarRap(req, res),
);

router.delete('/raps/quitar', validate(sabanaUnassignBodySchema, 'body'), (req, res) =>
  sabanaController.quitarRap(req, res),
);

router.get('/raps/:id/saberes', validate(sabanaRapIdParamSchema, 'params'), (req, res) =>
  sabanaController.obtenerSaberes(req, res),
);

router.get('/raps/:id/procesos', validate(sabanaRapIdParamSchema, 'params'), (req, res) =>
  sabanaController.obtenerProcesos(req, res),
);

router.get('/raps/:id/criterios', validate(sabanaRapIdParamSchema, 'params'), (req, res) =>
  sabanaController.obtenerCriterios(req, res),
);

// TODO: validar body de update-hours y assign/unassign-instructor cuando se definan roles
router.patch('/sabana/update-hours', (req, res) =>
  sabanaController.actualizarHoras(req, res),
);

router.patch('/sabana/assign-instructor', (req, res) =>
  sabanaController.asignarInstructor(req, res),
);

router.delete('/sabana/unassign-instructor', (req, res) =>
  sabanaController.desasignarInstructor(req, res),
);

module.exports = router;
