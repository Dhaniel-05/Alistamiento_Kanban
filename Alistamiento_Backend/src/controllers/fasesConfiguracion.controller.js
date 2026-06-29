const fasesConfiguracionService = require('../services/fasesConfiguracion.service');

class FasesConfiguracionController {
  async listar(req, res, next) {
    try {
      const fases = await fasesConfiguracionService.listar(req.query);
      res.json(fases);
    } catch (error) {
      next(error);
    }
  }

  async obtener(req, res, next) {
    try {
      const fase = await fasesConfiguracionService.obtener(req.params.id);
      res.json(fase);
    } catch (error) {
      next(error);
    }
  }

  async crear(req, res, next) {
    try {
      const result = await fasesConfiguracionService.crear(req.body);
      res.status(result.statusCode).json(result.body);
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req, res, next) {
    try {
      const result = await fasesConfiguracionService.actualizar(req.params.id, req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req, res, next) {
    try {
      const result = await fasesConfiguracionService.eliminar(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FasesConfiguracionController;
