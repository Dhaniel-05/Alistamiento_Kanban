const express = require('express');
const router = express.Router();
const PdfController = require('../controllers/pdf.controller');
const upload = require('../middleware/upload');
const autorizarRol = require('../middleware/autorizarRol');
const validate = require('../middleware/validate');
const { pdfProcesarBodySchema } = require('../validators/pdf.validator');

const pdfController = new PdfController();

router.use(autorizarRol('Administrador', 'Gestor'));

router.post(
  '/procesar/programa',
  upload.single('archivo'),
  upload.validatePdfMagicBytes,
  validate(pdfProcesarBodySchema, 'body'),
  (req, res, next) => pdfController.procesarPdf(req, res, next),
);

router.post(
  '/procesar/proyecto',
  upload.single('archivo'),
  upload.validatePdfMagicBytes,
  validate(pdfProcesarBodySchema, 'body'),
  (req, res, next) => pdfController.procesarProyecto(req, res, next),
);

module.exports = router;
