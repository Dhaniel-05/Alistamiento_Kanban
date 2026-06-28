const bcrypt = require('bcrypt');
const AppError = require('../utils/AppError');
const instructorRepository = require('../repositories/instructor.repository');
const { enviarCredenciales } = require('./emailService');

const BCRYPT_ROUNDS = 10;

class InstructorService {
  async getAll({ page, limit } = {}) {
    return instructorRepository.findAll({ page, limit });
  }

  async getById(id) {
    const instructor = await instructorRepository.findById(id);
    if (!instructor) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return instructor;
  }

  async getByEmail(email) {
    const instructor = await instructorRepository.findByEmail(email);
    if (!instructor) {
      throw new AppError('Instructor no encontrado', 404);
    }
    return instructor;
  }

  async create({ id_rol, nombre, email, contrasena, cedula, estado }) {
    const cedulaDuplicada = await instructorRepository.existsByCedula(cedula);
    if (cedulaDuplicada) {
      throw new AppError('La cédula ya está registrada', 400);
    }

    const contrasenaHash = await bcrypt.hash(contrasena, BCRYPT_ROUNDS);
    const id_instructor = await instructorRepository.create({
      id_rol,
      nombre,
      email,
      contrasenaHash,
      cedula,
      estado,
    });

    enviarCredenciales(email, nombre, contrasena);

    return {
      mensaje: 'Instructor creado y correo enviado correctamente',
      id_instructor,
      nombre,
      email,
      cedula,
      id_rol,
      estado,
    };
  }

  async update(id, { cedula, nombre, email, contrasena, id_rol, estado }) {
    const cedulaDuplicada = await instructorRepository.existsByCedulaExcluding(cedula, id);
    if (cedulaDuplicada) {
      throw new AppError('La cédula ya está registrada por otro instructor', 400);
    }

    const payload = { nombre, email, id_rol, cedula, estado };

    if (contrasena && contrasena.trim() !== '') {
      const contrasenaHash = await bcrypt.hash(contrasena, BCRYPT_ROUNDS);
      await instructorRepository.updateWithPassword(id, {
        ...payload,
        contrasenaHash,
      });
    } else {
      await instructorRepository.update(id, payload);
    }

    return { mensaje: 'Instructor actualizado exitosamente' };
  }

  async remove(id) {
    await instructorRepository.delete(id);
    return { mensaje: 'Instructor eliminado exitosamente' };
  }

  async getFichasByInstructorId(id) {
    return instructorRepository.findFichasByInstructorId(id);
  }

  async changePassword(id, nueva_contrasena) {
    const contrasenaHash = await bcrypt.hash(nueva_contrasena, BCRYPT_ROUNDS);
    await instructorRepository.updatePassword(id, contrasenaHash);

    return {
      mensaje: 'Contraseña actualizada correctamente',
      primer_acceso: false,
    };
  }
}

module.exports = new InstructorService();
