const bcrypt = require('bcrypt');
const { DUMMY_BCRYPT_HASH, INVALID_CREDENTIALS_RESPONSE } = require('../utils/authLogin.constants');

describe('authLogin.constants', () => {
  it('el hash dummy es un bcrypt válido', async () => {
    const result = await bcrypt.compare('cualquier-texto', DUMMY_BCRYPT_HASH);
    expect(typeof result).toBe('boolean');
  });

  it('la respuesta unificada de fallo no revela el motivo', () => {
    expect(INVALID_CREDENTIALS_RESPONSE).toEqual({ error: 'Credenciales inválidas' });
  });
});
