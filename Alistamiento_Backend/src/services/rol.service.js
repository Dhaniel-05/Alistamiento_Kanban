const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const rolRepository = require('../repositories/rol.repository');
const instructorRepository = require('../repositories/instructor.repository');

const ROLES_ASIGNABLES_POR_ACTOR = {
  Administrador: ['Administrador', 'Gestor', 'Instructor'],
  Gestor: ['Gestor', 'Instructor'],
};

class RolService {
  getAssignableRoleNames(actorRoleName) {
    return ROLES_ASIGNABLES_POR_ACTOR[actorRoleName] ?? [];
  }

  async obtenerAsignables(actorId) {
    const actor = await instructorRepository.findById(actorId);
    if (!actor) {
      throw new AppError('Acceso denegado', 403, true, 'FORBIDDEN');
    }

    const nombres = this.getAssignableRoleNames(actor.rol);
    if (nombres.length === 0) {
      throw new AppError('Acceso denegado', 403, true, 'FORBIDDEN');
    }

    return rolRepository.findByNames(nombres);
  }

  async assertActorCanAssignRole(actorId, targetIdRol, targetInstructorId = null) {
    const actor = await instructorRepository.findById(actorId);
    if (!actor) {
      throw new AppError('Acceso denegado', 403, true, 'FORBIDDEN');
    }

    const assignableNames = this.getAssignableRoleNames(actor.rol);
    if (assignableNames.length === 0) {
      throw new AppError('No tienes permiso para asignar roles', 403, true, 'ROLE_ASSIGN_FORBIDDEN');
    }

    const targetRole = await rolRepository.findById(targetIdRol);
    if (!targetRole) {
      throw new AppError('El rol especificado no es válido', 400, true, 'ROLE_INVALID');
    }

    if (!assignableNames.includes(targetRole.nombre)) {
      logger.warn('Intento de asignar rol no permitido', {
        actorId,
        actorRol: actor.rol,
        targetIdRol,
        targetRol: targetRole.nombre,
      });

      if (targetRole.nombre === 'Administrador') {
        throw new AppError(
          'No tienes permiso para asignar el rol Administrador',
          403,
          true,
          'ROLE_ESCALATION_FORBIDDEN',
        );
      }

      throw new AppError('No tienes permiso para asignar ese rol', 403, true, 'ROLE_ASSIGN_FORBIDDEN');
    }

    if (targetInstructorId && actor.rol === 'Gestor') {
      const targetUser = await instructorRepository.findById(targetInstructorId);
      if (targetUser?.rol === 'Administrador') {
        logger.warn('Gestor intentó modificar un Administrador', {
          actorId,
          targetInstructorId,
        });
        throw new AppError(
          'No tienes permiso para modificar un usuario Administrador',
          403,
          true,
          'ADMIN_MODIFY_FORBIDDEN',
        );
      }
    }
  }
}

module.exports = new RolService();
