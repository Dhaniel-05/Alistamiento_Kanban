/** bcrypt hash fijo (cost 10); usado solo para igualar tiempo si el email no existe */
const DUMMY_BCRYPT_HASH = '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxnAqjcq4.VYoMpNDaFJaFcc0p/0u';

const INVALID_CREDENTIALS_RESPONSE = { error: 'Credenciales inválidas' };

module.exports = {
  DUMMY_BCRYPT_HASH,
  INVALID_CREDENTIALS_RESPONSE,
};
