const planeacionPedagogicaService = require('../services/planeacionPedagogica.service');

class PlaneacionController {
  async crear(req, res, next) {
    try {
      const result = await planeacionPedagogicaService.crearPlaneacion(req.body, req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorFicha(req, res, next) {
    try {
      const result = await planeacionPedagogicaService.obtenerPorFicha(
        req.params.id_ficha,
        req.user,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req, res, next) {
    try {
      const result = await planeacionPedagogicaService.obtenerPorId(
        req.params.id,
        req.user,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req, res, next) {
    try {
      const result = await planeacionPedagogicaService.actualizar(
        req.params.id,
        req.body,
        req.user,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req, res, next) {
    try {
      const result = await planeacionPedagogicaService.eliminar(req.params.id, req.user);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async exportarExcel(req, res, next) {
    try {
      const { id_ficha: idFicha, id_trimestre: idTrimestre } = req.query;
      const { buffer, filename } = await planeacionPedagogicaService.exportarExcel(
        idFicha,
        idTrimestre,
        req.user,
      );

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PlaneacionController;
