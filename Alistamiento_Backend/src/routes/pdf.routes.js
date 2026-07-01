const express = require('express');
const router = express.Router();
const PdfController = require('../controllers/pdf.controller');
const upload = require('../middleware/upload');
const autorizarPermiso = require('../middleware/autorizarPermiso');
const validate = require('../middleware/validate');
const { pdfProcesarBodySchema } = require('../validators/pdf.validator');

const pdfController = new PdfController();

const puedeImportarPdf = autorizarPermiso('pdf.importar');

router.post(
  '/procesar/programa',
  puedeImportarPdf,
  upload.single('archivo'),
  upload.validatePdfMagicBytes,
  validate(pdfProcesarBodySchema, 'body'),
  (req, res, next) => pdfController.procesarPdf(req, res, next),
);

router.post(
  '/procesar/proyecto',
  puedeImportarPdf,
  upload.single('archivo'),
  upload.validatePdfMagicBytes,
  validate(pdfProcesarBodySchema, 'body'),
  (req, res, next) => pdfController.procesarProyecto(req, res, next),
);

module.exports = router;
