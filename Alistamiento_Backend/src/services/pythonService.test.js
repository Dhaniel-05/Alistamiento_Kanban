const fs = require('fs');
const path = require('path');
const { resolvePythonExecutable, BACKEND_ROOT } = require('./pythonService');

const WINDOWS_VENV_PYTHON = path.join(BACKEND_ROOT, '.venv', 'Scripts', 'python.exe');

function withPlatform(platform, callback) {
  const originalPlatform = process.platform;
  Object.defineProperty(process, 'platform', { value: platform });
  try {
    callback();
  } finally {
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  }
}

describe('pythonService.resolvePythonExecutable', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.PYTHON_BIN;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('usa PYTHON_BIN cuando está definido', () => {
    process.env.PYTHON_BIN = '/usr/bin/custom-python';
    const { resolvePythonExecutable: resolve } = require('./pythonService');
    expect(resolve()).toBe('/usr/bin/custom-python');
  });

  it('usa python3 por defecto fuera de Windows sin venv', () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

    withPlatform('linux', () => {
      const { resolvePythonExecutable: resolve } = require('./pythonService');
      expect(resolve()).toBe('python3');
    });

    existsSpy.mockRestore();
  });

  it('usa .venv de Windows solo si el ejecutable existe', () => {
    const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation(
      (targetPath) => targetPath === WINDOWS_VENV_PYTHON,
    );

    withPlatform('win32', () => {
      const { resolvePythonExecutable: resolve } = require('./pythonService');
      expect(resolve()).toBe(WINDOWS_VENV_PYTHON);
    });

    existsSpy.mockRestore();
  });
});
