const db = require("../config/conexion_db");
const logger = require("../config/logger");
const fichaService = require("../services/ficha.service");

class FichasController {
  async obtenerFichasPorProgramas(req, res) {
    const { id_programa } = req.params;

    try {
      const [fichas] = await db.query(
        `SELECT
          f.id_ficha,
          f.codigo_ficha,
          f.modalidad,
          f.jornada,
          f.ambiente,
          f.fecha_inicio,
          f.fecha_final,
          f.cantidad_trimestre,
          p.nombre_programa AS programa,
          p.codigo_programa
        FROM fichas f
        LEFT JOIN programa_formacion p ON f.id_programa = p.id_programa
        WHERE f.id_programa = ?`,
        [id_programa]
      );

      if (fichas.length === 0) {
        return res.status(404).json({ error: "No se encontraron fichas para este programa" });
      }

      res.json(fichas);
    } catch (error) {
      logger.error('Error al obtener fichas', { stack: error.stack });
      res.status(500).json({ error: "Error al obtener fichas" });
    }
  }

  async obtenerTodasLasFichas(req, res) {
    try {
      const [fichas] = await db.query(
        `SELECT
          f.id_ficha,
          f.codigo_ficha,
          f.modalidad,
          f.jornada,
          f.ambiente AS ubicacion,
          f.fecha_inicio,
          f.fecha_final AS fecha_fin,
          f.cantidad_trimestre,
          f.id_programa,
          p.nombre_programa,
          (
            SELECT inf.id_instructor
            FROM instructor_ficha inf
            WHERE inf.id_ficha = f.id_ficha
              AND UPPER(inf.rol) = 'GESTOR'
            LIMIT 1
          ) AS id_instructor
        FROM fichas f
        LEFT JOIN programa_formacion p ON f.id_programa = p.id_programa`
      );

      res.json(fichas);
    } catch (error) {
      logger.error('Error al obtener todas las fichas', { stack: error.stack });
      res.status(500).json({ error: "Error al obtener fichas" });
    }
  }

  async agregarFichas(req, res, next) {
    try {
      const result = await fichaService.crearFicha(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async syncTrimestreFasesTodas(req, res, next) {
    try {
      const result = await fichaService.sincronizarFasesTrimestre(null);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async syncTrimestreFasesPorFicha(req, res, next) {
    try {
      const idFicha = parseInt(req.params.id, 10);
      const result = await fichaService.sincronizarFasesTrimestre(idFicha);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async actualizarFicha(req, res) {
    const { id } = req.params;
    const {
      id_programa,
      codigo_ficha,
      modalidad,
      jornada,
      ambiente,
      fecha_inicio,
      fecha_final,
      cantidad_trimestre,
      gestor,        // <-- quien es el gestor
      instructores   // <-- instructores normales
    } = req.body;

    try {

      await db.query(
        `UPDATE fichas
        SET id_programa=?, codigo_ficha=?, modalidad=?, jornada=?, ambiente=?,
            fecha_inicio=?, fecha_final=?, cantidad_trimestre=?
        WHERE id_ficha=?`,
        [
          id_programa,
          codigo_ficha,
          modalidad,
          jornada,
          ambiente,
          fecha_inicio,
          fecha_final,
          cantidad_trimestre,
          id
        ]
      );

      // 1 Eliminar instructores antiguos
      await db.query("DELETE FROM instructor_ficha WHERE id_ficha = ?", [id]);

      // 2 Insertar nuevo gestor
      if (gestor) {
        await db.query(
          "INSERT INTO instructor_ficha (id_instructor, id_ficha, rol) VALUES (?, ?, 'Gestor')",
          [gestor, id]
        );
      }

      // 3 Insertar instructores normales
      if (Array.isArray(instructores)) {
        for (const inst of instructores) {
          await db.query(
            "INSERT INTO instructor_ficha (id_instructor, id_ficha, rol) VALUES (?, ?, 'Instructor')",
            [inst, id]
          );
        }
      }

      res.json({ mensaje: "Ficha actualizada correctamente" });
    } catch (error) {
      logger.error('Error al actualizar ficha', { stack: error.stack });
      res.status(500).json({ error: "Error al actualizar la ficha" });
    }
  }


  async obtenerFichasInstructor(req, res) {
    const { id_instructor } = req.params;

    try {
      const [rows] = await db.query(
        `SELECT
          f.id_ficha,
          f.codigo_ficha,
          f.modalidad,
          f.jornada,
          f.ambiente AS ubicacion,
          f.fecha_inicio,
          f.fecha_final,
          f.id_programa
        FROM instructor_ficha i
        INNER JOIN fichas f ON i.id_ficha = f.id_ficha
        WHERE i.id_instructor = ?`,
        [id_instructor]
      );

      res.json(rows);
    } catch (error) {
      logger.error('Error obteniendo fichas del instructor', { stack: error.stack });
      res.status(500).json({ error: "Error al obtener fichas del instructor" });
    }
  }

  async eliminarFicha(req, res) {
    const { id } = req.params;

    try {
      const [existe] = await db.query(
        "SELECT id_ficha FROM fichas WHERE id_ficha = ?",
        [id]
      );

      if (existe.length === 0) {
        return res.status(404).json({ error: "Ficha no encontrada" });
      }

      await db.query("DELETE FROM fichas WHERE id_ficha = ?", [id]);

      res.json({ mensaje: "Ficha eliminada correctamente" });
    } catch (error) {
      logger.error('Error eliminando ficha', { stack: error.stack });
      res.status(500).json({ error: "Error al eliminar la ficha" });
    }
  }
}

module.exports = FichasController;