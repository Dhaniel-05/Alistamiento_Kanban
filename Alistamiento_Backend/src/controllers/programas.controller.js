const programaService = require('../services/programa.service');

class ProgramaController {
  async obtenerProgramas(req, res, next) {
    try {
      const page = req.query.page !== undefined ? Number(req.query.page) : undefined;
      const limit = req.query.limit !== undefined ? Number(req.query.limit) : undefined;
      const programas = await programaService.getAll({ page, limit });
      res.json(programas);
    } catch (error) {
      next(error);
    }
  }

  async obtenerProgramaPorId(req, res, next) {
    try {
      const programa = await programaService.getById(req.params.id);
      res.json(programa);
    } catch (error) {
      next(error);
    }
  }

  async agregarPrograma(req, res, next) {
    try {
      const result = await programaService.create(req.body);
      res.status(result.statusCode).json(result.body);
    } catch (error) {
      next(error);
    }
  }

  async actualizarPrograma(req, res, next) {
    try {
      const result = await programaService.update(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async eliminarPrograma(req, res, next) {
    try {
      const result = await programaService.remove(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProgramaController;
