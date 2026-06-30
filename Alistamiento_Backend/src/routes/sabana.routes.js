// routes/sabana.routes.js
const express = require('express');
const SabanaController = require('../controllers/sabana.controller');
const autorizarPermiso = require('../middleware/autorizarPermiso');
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

const lecturaSabana = autorizarPermiso('ficha.leer');
const gestionSabana = autorizarPermiso('ficha.editar');

router.get(
  '/sabana/trimestres/:id_ficha',
  lecturaSabana,
  validate(idFichaParamSchema, 'params'),
  (req, res) => sabanaController.obtenerTrimestres(req, res),
);

router.get(
  '/raps/disponibles/:id_ficha',
  lecturaSabana,
  validate(idFichaParamSchema, 'params'),
  (req, res) => sabanaController.obtenerRapsDisponibles(req, res),
);

router.get(
  '/raps/asignados/:id_ficha/:id_trimestre',
  lecturaSabana,
  validate(sabanaRapsAsignadosParamsSchema, 'params'),
  (req, res) => sabanaController.obtenerRapsAsignados(req, res),
);

router.get(
  '/sabana/:id_ficha',
  lecturaSabana,
  validate(idFichaParamSchema, 'params'),
  (req, res) => sabanaController.obtenerSabanaBase(req, res),
);

router.get(
  '/sabana/matriz/:id_ficha',
  lecturaSabana,
  validate(idFichaParamSchema, 'params'),
  (req, res) => sabanaController.obtenerSabanaMatriz(req, res),
);

router.post(
  '/sabana/assign',
  gestionSabana,
  validate(sabanaAssignBodySchema, 'body'),
  (req, res) => sabanaController.asignarRap(req, res),
);

router.delete(
  '/sabana/unassign',
  gestionSabana,
  validate(sabanaUnassignBodySchema, 'body'),
  (req, res) => sabanaController.quitarRap(req, res),
);

router.get(
  '/sabana/instructores/:id_ficha',
  lecturaSabana,
  validate(idFichaParamSchema, 'params'),
  (req, res) => sabanaController.obtenerInstructoresPorFicha(req, res),
);

router.post(
  '/raps/asignar',
  gestionSabana,
  validate(sabanaAssignBodySchema, 'body'),
  (req, res) => sabanaController.asignarRap(req, res),
);

router.delete(
  '/raps/quitar',
  gestionSabana,
  validate(sabanaUnassignBodySchema, 'body'),
  (req, res) => sabanaController.quitarRap(req, res),
);

router.get(
  '/raps/:id/saberes',
  lecturaSabana,
  validate(sabanaRapIdParamSchema, 'params'),
  (req, res) => sabanaController.obtenerSaberes(req, res),
);

router.get(
  '/raps/:id/procesos',
  lecturaSabana,
  validate(sabanaRapIdParamSchema, 'params'),
  (req, res) => sabanaController.obtenerProcesos(req, res),
);

router.get(
  '/raps/:id/criterios',
  lecturaSabana,
  validate(sabanaRapIdParamSchema, 'params'),
  (req, res) => sabanaController.obtenerCriterios(req, res),
);

router.patch('/sabana/update-hours', gestionSabana, (req, res) =>
  sabanaController.actualizarHoras(req, res),
);

router.patch('/sabana/assign-instructor', gestionSabana, (req, res) =>
  sabanaController.asignarInstructor(req, res),
);

router.delete('/sabana/unassign-instructor', gestionSabana, (req, res) =>
  sabanaController.desasignarInstructor(req, res),
);

module.exports = router;
