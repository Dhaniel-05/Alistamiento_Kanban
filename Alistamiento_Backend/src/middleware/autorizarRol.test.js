const autorizarRol = require('../middleware/autorizarRol');
const { autorizarPropietarioORol } = require('../middleware/autorizarRol');
const AppError = require('../utils/AppError');

function runMiddleware(middleware, req) {
  return new Promise((resolve, reject) => {
    middleware(req, {}, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

describe('autorizarRol', () => {
  it('permite rol incluido en la lista', async () => {
    const req = { user: { id: 1, rol: 'Instructor' } };
    await expect(
      runMiddleware(autorizarRol('Instructor', 'Administrador'), req),
    ).resolves.toBeUndefined();
  });

  it('rechaza rol no autorizado con AppError 403', async () => {
    const req = { user: { id: 2, rol: 'Instructor' } };
    await expect(
      runMiddleware(autorizarRol('Administrador', 'Gestor'), req),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'Acceso denegado: rol no autorizado',
    });
  });

  it('rechaza sin rol en el token', async () => {
    const req = { user: { id: 2 } };
    await expect(runMiddleware(autorizarRol('Administrador'), req)).rejects.toBeInstanceOf(AppError);
  });
});

describe('autorizarPropietarioORol', () => {
  it('permite al propietario sin rol administrativo', async () => {
    const req = { user: { id: 5, rol: 'Instructor' }, params: { id: '5' } };
    await expect(
      runMiddleware(autorizarPropietarioORol('id', 'Administrador'), req),
    ).resolves.toBeUndefined();
  });

  it('rechaza a otro instructor que no es propietario', async () => {
    const req = { user: { id: 5, rol: 'Instructor' }, params: { id: '9' } };
    await expect(
      runMiddleware(autorizarPropietarioORol('id', 'Administrador', 'Gestor'), req),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
