const express = require('express');
const PlaneacionController = require('../controllers/planeacion.controller');
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

const lecturaPlaneacion = autorizarPermiso('ficha.leer');
const mutacionPlaneacion = autorizarPermiso('ficha.editar');

router.get(
  '/export/excel',
  lecturaPlaneacion,
  validate(exportExcelQuerySchema, 'query'),
  (req, res, next) => planeacionController.exportarExcel(req, res, next),
);

router.get(
  '/ficha/:id_ficha',
  lecturaPlaneacion,
  validate(idFichaParamSchema, 'params'),
  (req, res, next) => planeacionController.obtenerPorFicha(req, res, next),
);

router.get(
  '/:id',
  lecturaPlaneacion,
  validate(idParamSchema, 'params'),
  (req, res, next) => planeacionController.obtenerPorId(req, res, next),
);

router.post(
  '/',
  mutacionPlaneacion,
  validate(crearPlaneacionBodySchema, 'body'),
  (req, res, next) => planeacionController.crear(req, res, next),
);

router.put(
  '/:id',
  mutacionPlaneacion,
  validate(idParamSchema, 'params'),
  validate(actualizarPlaneacionBodySchema, 'body'),
  (req, res, next) => planeacionController.actualizar(req, res, next),
);

router.delete(
  '/:id',
  mutacionPlaneacion,
  validate(idParamSchema, 'params'),
  (req, res, next) => planeacionController.eliminar(req, res, next),
);

module.exports = router;
