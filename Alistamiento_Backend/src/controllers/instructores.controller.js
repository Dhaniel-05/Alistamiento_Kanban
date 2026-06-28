const instructorService = require('../services/instructor.service');

class InstructoresController {
  async obtenerInstructores(req, res, next) {
    try {
      const page = req.query.page !== undefined ? Number(req.query.page) : undefined;
      const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
      const instructores = await instructorService.getAll({ page, limit });
      res.json(instructores);
    } catch (error) {
      next(error);
    }
  }

  async obtenerInstructorPorId(req, res, next) {
    try {
      const instructor = await instructorService.getById(req.params.id);
      res.json(instructor);
    } catch (error) {
      next(error);
    }
  }

  async agregarInstructor(req, res, next) {
    try {
      const result = await instructorService.create(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async actualizarInstructor(req, res, next) {
    try {
      const result = await instructorService.update(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async eliminarInstructor(req, res, next) {
    try {
      const result = await instructorService.remove(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async obtenerInstructorPorEmail(req, res, next) {
    try {
      const instructor = await instructorService.getByEmail(req.params.email);
      res.json(instructor);
    } catch (error) {
      next(error);
    }
  }

  async obtenerFichasPorInstructor(req, res, next) {
    try {
      const fichas = await instructorService.getFichasByInstructorId(req.params.id);
      res.json(fichas);
    } catch (error) {
      next(error);
    }
  }

  async cambiarContrasena(req, res, next) {
    try {
      const result = await instructorService.changePassword(
        req.params.id,
        req.body.nueva_contrasena,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = InstructoresController;
