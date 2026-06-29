const fichaFasesService = require('../services/fichaFases.service');

class FichaFasesController {
  async listarPorFicha(req, res, next) {
    try {
      const fases = await fichaFasesService.listarPorFicha(req.params.id);
      res.json(fases);
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const result = await fichaFasesService.cambiarEstado(
        req.params.idFichaFase,
        req.body.estado,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async regenerar(req, res, next) {
    try {
      const result = await fichaFasesService.regenerarFases(req.params.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FichaFasesController;
