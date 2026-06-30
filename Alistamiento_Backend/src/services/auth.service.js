const instructorRepository = require('../repositories/instructor.repository');
const AppError = require('../utils/AppError');

class AuthService {
  /**
   * Devuelve usuario y permisos actuales desde BD (no del token).
   * @param {number} userId
   */
  async obtenerSesionVigente(userId) {
    const instructor = await instructorRepository.findSessionById(userId);

    if (!instructor) {
      throw new AppError('Usuario no encontrado', 404, true, 'USER_NOT_FOUND');
    }

    return instructor;
  }
}

module.exports = new AuthService();
