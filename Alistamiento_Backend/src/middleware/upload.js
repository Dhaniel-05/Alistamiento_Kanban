const crypto = require('crypto');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const multer = require('multer');
const { removeFileSafe } = require('../utils/fileSystem');

const uploadDir = path.join(__dirname, '../../uploads');
const PDF_MAGIC = Buffer.from('%PDF-');
const MAX_PDF_FILE_SIZE_BYTES = 10 * 1024 * 1024;

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function generateSafePdfFilename() {
  return `${crypto.randomUUID()}.pdf`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, _file, cb) => {
    cb(null, generateSafePdfFilename());
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
    return;
  }
  cb(new Error('Solo se permiten archivos PDF'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_PDF_FILE_SIZE_BYTES,
  },
});

/**
 * Verifica cabecera %PDF- en disco y elimina el archivo si no es válido.
 */
async function validatePdfMagicBytes(req, res, next) {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;
  let handle;

  try {
    handle = await fsPromises.open(filePath, 'r');
    const header = Buffer.alloc(PDF_MAGIC.length);
    const { bytesRead } = await handle.read(header, 0, PDF_MAGIC.length, 0);

    const isPdf = bytesRead === PDF_MAGIC.length && header.equals(PDF_MAGIC);

    if (!isPdf) {
      removeFileSafe(filePath);
      req.file = undefined;
      return res.status(400).json({
        error: 'El archivo no es un PDF válido',
      });
    }

    return next();
  } catch (error) {
    removeFileSafe(filePath);
    req.file = undefined;
    return next(error);
  } finally {
    if (handle) {
      await handle.close();
    }
  }
}

upload.validatePdfMagicBytes = validatePdfMagicBytes;
upload.MAX_PDF_FILE_SIZE_BYTES = MAX_PDF_FILE_SIZE_BYTES;

module.exports = upload;
