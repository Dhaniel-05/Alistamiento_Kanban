const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

const BACKEND_ROOT = path.resolve(__dirname, '../..');
const PYTHON_MAIN = path.join(BACKEND_ROOT, 'Python', 'main.py');
const WINDOWS_VENV_PYTHON = path.join(BACKEND_ROOT, '.venv', 'Scripts', 'python.exe');
const DEFAULT_TIMEOUT_MS = 120_000;
const STDERR_LOG_LIMIT = 4000;

/**
 * Resuelve el intérprete Python sin rutas hardcodeadas de Windows.
 * Prioridad: PYTHON_BIN > .venv local (solo si existe) > python3.
 * @returns {string}
 */
function resolvePythonExecutable() {
  const fromEnv = process.env.PYTHON_BIN?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  if (process.platform === 'win32' && fs.existsSync(WINDOWS_VENV_PYTHON)) {
    return WINDOWS_VENV_PYTHON;
  }

  return 'python3';
}

/**
 * @returns {number}
 */
function getTimeoutMs() {
  const raw = process.env.PYTHON_TIMEOUT_MS;
  if (!raw) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  return parsed;
}

/**
 * Ejecuta Python/main.py y devuelve el objeto JSON raíz { success, data?, error? }.
 * @param {string} pdfPath
 * @param {string} tipo
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
function runPythonExtraction(pdfPath, tipo = 'todo') {
  const pythonBin = resolvePythonExecutable();
  const timeoutMs = getTimeoutMs();
  const absolutePdfPath = path.resolve(pdfPath);

  if (!fs.existsSync(PYTHON_MAIN)) {
    return Promise.reject(new AppError(
      'Motor de extracción PDF no disponible',
      503,
      true,
      'PDF_EXTRACTION_UNAVAILABLE',
    ));
  }

  if (!fs.existsSync(absolutePdfPath)) {
    return Promise.reject(new AppError(
      'Archivo PDF no encontrado',
      400,
      true,
      'PDF_NOT_FOUND',
    ));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const fail = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };

    const child = spawn(pythonBin, [PYTHON_MAIN, absolutePdfPath, tipo], {
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      },
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    const timeoutHandle = setTimeout(() => {
      child.kill('SIGTERM');
      fail(new AppError(
        'La extracción del PDF excedió el tiempo máximo permitido',
        504,
        true,
        'PDF_EXTRACTION_TIMEOUT',
      ));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    child.on('error', (error) => {
      clearTimeout(timeoutHandle);
      logger.error('No se pudo iniciar el proceso Python', {
        pythonBin,
        message: error.message,
      });
      fail(new AppError(
        'No se pudo ejecutar el motor de extracción PDF',
        503,
        true,
        'PDF_EXTRACTION_UNAVAILABLE',
      ));
    });

    child.on('close', (code, signal) => {
      clearTimeout(timeoutHandle);

      if (settled) {
        return;
      }

      const stderrTrimmed = stderr.trim();

      if (stderrTrimmed) {
        logger.warn('Python stderr durante extracción PDF', {
          tipo,
          stderr: stderrTrimmed.slice(0, STDERR_LOG_LIMIT),
        });
      }

      if (code !== 0) {
        logger.error('Python finalizó con código distinto de cero', {
          code,
          signal,
          tipo,
          stderr: stderrTrimmed.slice(0, STDERR_LOG_LIMIT),
        });
        const error = new AppError('Error al procesar el PDF', 500, true, 'PDF_EXTRACTION_FAILED');
        error.details = stderrTrimmed || `exit code ${code}`;
        fail(error);
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch (parseError) {
        logger.error('Salida JSON inválida de Python', {
          message: parseError.message,
          stdoutPreview: stdout.trim().slice(0, 500),
        });
        const error = new AppError('Error al procesar el PDF', 500, true, 'PDF_EXTRACTION_INVALID_JSON');
        error.details = parseError.message;
        fail(error);
        return;
      }

      if (!parsed || typeof parsed !== 'object' || typeof parsed.success !== 'boolean') {
        const error = new AppError(
          'Error al procesar el PDF',
          500,
          true,
          'PDF_EXTRACTION_INVALID_RESPONSE',
        );
        error.details = 'La respuesta del extractor no tiene el formato esperado';
        fail(error);
        return;
      }

      if (!parsed.success) {
        const error = new AppError(
          typeof parsed.error === 'string' && parsed.error.trim()
            ? parsed.error.trim()
            : 'Error al procesar el PDF',
          422,
          true,
          'PDF_EXTRACTION_BUSINESS',
        );
        error.details = parsed.error;
        fail(error);
        return;
      }

      settled = true;
      resolve(parsed);
    });
  });
}

module.exports = {
  runPythonExtraction,
  resolvePythonExecutable,
  PYTHON_MAIN,
  BACKEND_ROOT,
};
