const fs = require('fs');
const path = require('path');
const os = require('os');
const upload = require('./upload');

describe('upload middleware', () => {
  let tempDir;
  let tempFile;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-test-'));
    tempFile = path.join(tempDir, 'sample.pdf');
  });

  afterEach(() => {
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('MAX_PDF_FILE_SIZE_BYTES es 10MB', () => {
    expect(upload.MAX_PDF_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  test('validatePdfMagicBytes acepta cabecera %PDF-', async () => {
    fs.writeFileSync(tempFile, '%PDF-1.4 fake content');

    const req = { file: { path: tempFile } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await upload.validatePdfMagicBytes(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
    expect(fs.existsSync(tempFile)).toBe(true);
  });

  test('validatePdfMagicBytes elimina archivo inválido y responde 400', async () => {
    fs.writeFileSync(tempFile, 'NOT-A-PDF');

    const req = { file: { path: tempFile } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await upload.validatePdfMagicBytes(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'El archivo no es un PDF válido',
    });
    expect(req.file).toBeUndefined();
    expect(fs.existsSync(tempFile)).toBe(false);
    expect(next).not.toHaveBeenCalled();
  });
});
