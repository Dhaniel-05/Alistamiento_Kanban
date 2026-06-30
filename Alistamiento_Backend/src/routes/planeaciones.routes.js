const express = require('express');
const PlaneacionController = require('../controllers/planeacion.controller');
const autorizarRol = require('../middleware/autorizarRol');
const autorizarPermiso = require('../middleware/autorizarPermiso');
const validate = require('../middleware/validate');
const {
  crearPlaneacionBodySchema,
  actualizarPlaneacionBodySchema,
  exportExcelQuerySchema,
  idParamSchema,
  idFichaParamSchema,
} = require('../validators/planeacion.validator');

const router = express.Router();
const planeacionController = new PlaneacionController();

const PERMISO_MUTACION = 'ficha.editar';

router.use(autorizarRol('Instructor', 'Gestor', 'Administrador'));

router.get(
  '/export/excel',
  validate(exportExcelQuerySchema, 'query'),
  (req, res, next) => planeacionController.exportarExcel(req, res, next),
);

router.get(
  '/ficha/:id_ficha',
  validate(idFichaParamSchema, 'params'),
  (req, res, next) => planeacionController.obtenerPorFicha(req, res, next),
);

router.get(
  '/:id',
  validate(idParamSchema, 'params'),
  (req, res, next) => planeacionController.obtenerPorId(req, res, next),
);

router.post(
  '/',
  autorizarPermiso(PERMISO_MUTACION),
  validate(crearPlaneacionBodySchema, 'body'),
  (req, res, next) => planeacionController.crear(req, res, next),
);

router.put(
  '/:id',
  autorizarPermiso(PERMISO_MUTACION),
  validate(idParamSchema, 'params'),
  validate(actualizarPlaneacionBodySchema, 'body'),
  (req, res, next) => planeacionController.actualizar(req, res, next),
);

router.delete(
  '/:id',
  autorizarPermiso(PERMISO_MUTACION),
  validate(idParamSchema, 'params'),
  (req, res, next) => planeacionController.eliminar(req, res, next),
);

module.exports = router;
