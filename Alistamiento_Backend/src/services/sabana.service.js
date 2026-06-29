const db = require("../config/conexion_db");
const logger = require("../config/logger");
const planeacionService = require("./planeacion.service");
const sabanaRepository = require("../repositories/sabana.repository");

/**
 * Servicio para gestionar el alistamiento de RAPs (Resultados de Aprendizaje)
 * Maneja la lógica de negocio para asignación, consulta y gestión de RAPs por ficha y trimestre
 */
class SabanaService {
  /**
   * Obtiene los RAPs disponibles (no asignados a ningún trimestre) de una ficha
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<Array>} Lista de RAPs disponibles
   */
  async obtenerRapsDisponibles(id_ficha) {
    try {
      // Primero obtener el programa de la ficha
      const [fichas] = await db.query(`SELECT id_programa FROM fichas WHERE id_ficha = ?`, [id_ficha]);

      if (fichas.length === 0) {
        throw new Error("Ficha no encontrada");
      }

      const id_programa = fichas[0].id_programa;

      if (!id_programa) {
        throw new Error("La ficha no tiene un programa asociado");
      }

      // Obtener todos los trimestres de la ficha
      const [trimestres] = await db.query(
        `SELECT t.id_trimestre 
         FROM trimestre t
         LEFT JOIN trimestre t ON rt.id_trimestre = t.id_trimestre
         WHERE rt.id_ficha = ?`,
        [id_ficha]
      );

      const ids_trimestres = trimestres.map((t) => t.id_trimestre);

      // Si no hay trimestres, retornar todos los RAPs del programa
      if (ids_trimestres.length === 0) {
        const [raps] = await db.query(
          `SELECT 
            r.id_rap,
            r.codigo,
            r.denominacion,
            r.duracion,
            c.id_competencia,
            c.nombre_competencia,
            c.codigo_norma
           FROM raps r
           JOIN competencias c ON r.id_competencia = c.id_competencia
           WHERE c.id_programa = ?
           ORDER BY r.codigo`,
          [id_programa]
        );
        return raps;
      }

      // Obtener RAPs del programa que NO están asignados a ningún trimestre de esta ficha
      // Construir placeholders para el array de trimestres
      const placeholders = ids_trimestres.map(() => "?").join(",");
      const [raps] = await db.query(
        `SELECT 
          r.id_rap,
          r.codigo,
          r.denominacion,
          r.duracion,
          c.id_competencia,
          c.nombre_competencia,
          c.codigo_norma
         FROM raps r
         JOIN competencias c ON r.id_competencia = c.id_competencia
         WHERE c.id_programa = ?
           AND r.id_rap NOT IN (
             SELECT DISTINCT rt.id_rap 
             FROM rap_trimestre rt 
             WHERE rt.id_trimestre IN (${placeholders})
           )
         ORDER BY r.codigo`,
        [id_programa, ...ids_trimestres]
      );

      return raps;
    } catch (error) {
      logger.error("Error en obtenerRapsDisponibles", { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtiene los RAPs asignados a un trimestre específico de una ficha
   * @param {number} id_ficha - ID de la ficha
   * @param {number} id_trimestre - ID del trimestre
   * @returns {Promise<Array>} Lista de RAPs asignados al trimestre
   */
  async obtenerRapsAsignados(id_ficha, id_trimestre) {
    try {
      // Validar que el trimestre pertenece a la ficha
      const [trimestres] = await db.query(
        `SELECT t.id_trimestre 
         FROM trimestre t
         JOIN planeacion_pedagogica pp ON t.id_planeacion = pp.id_planeacion
         WHERE pp.id_ficha = ? AND t.id_trimestre = ?`,
        [id_ficha, id_trimestre]
      );

      if (trimestres.length === 0) {
        throw new Error("El trimestre no pertenece a la ficha especificada");
      }

      // Obtener RAPs asignados al trimestre
      const [raps] = await db.query(
        `SELECT 
          r.id_rap,
          r.codigo,
          r.denominacion,
          r.duracion,
          rt.horas_trimestre,
          rt.horas_semana,
          rt.estado,
          c.id_competencia,
          c.nombre_competencia,
          c.codigo_norma,
          t.no_trimestre,
          t.fase
         FROM rap_trimestre rt
         JOIN raps r ON rt.id_rap = r.id_rap
         JOIN competencias c ON r.id_competencia = c.id_competencia
         JOIN trimestre t ON rt.id_trimestre = t.id_trimestre
         WHERE rt.id_trimestre = ?
         ORDER BY r.codigo`,
        [id_trimestre]
      );

      return raps;
    } catch (error) {
      logger.error("Error en obtenerRapsAsignados", { stack: error.stack });
      throw error;
    }
  }

  /**
   * Valida que un RAP pertenece al programa de una ficha
   * @param {number} id_rap - ID del RAP
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<boolean>} true si el RAP pertenece al programa
   */
  async validarRapPertenecePrograma(id_rap, id_ficha) {
    try {
      const [resultados] = await db.query(
        `SELECT COUNT(*) as count
         FROM raps r
         JOIN competencias c ON r.id_competencia = c.id_competencia
         JOIN fichas f ON c.id_programa = f.id_programa
         WHERE r.id_rap = ? AND f.id_ficha = ?`,
        [id_rap, id_ficha]
      );

      return resultados[0].count > 0;
    } catch (error) {
      logger.error("Error en validarRapPertenecePrograma", { stack: error.stack });
      throw error;
    }
  }

  /**
   * Valida que un RAP no esté ya asignado al trimestre
   * @param {number} id_rap - ID del RAP
   * @param {number} id_trimestre - ID del trimestre
   * @returns {Promise<boolean>} true si ya está asignado
   */
  async validarRapYaAsignado(id_rap, id_trimestre) {
    try {
      const [resultados] = await db.query(
        `SELECT COUNT(*) as count
         FROM rap_trimestre
         WHERE id_rap = ? AND id_trimestre = ?`,
        [id_rap, id_trimestre]
      );

      return resultados[0].count > 0;
    } catch (error) {
      logger.error("Error en validarRapYaAsignado", { stack: error.stack });
      throw error;
    }
  }

  /**
   * Asigna un RAP a un trimestre usando el procedimiento almacenado
   * @param {number} id_rap - ID del RAP
   * @param {number} id_trimestre - ID del trimestre
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<Object>} Registro recién creado o actualizado
   */

  async asignarRapTrimestre(id_rap, id_trimestre, id_ficha, move = false) {
    return planeacionService.asignarRapTrimestre(id_rap, id_trimestre, id_ficha, move);
  }

  /**
   * Quita un RAP de un trimestre
   * @param {number} id_rap - ID del RAP
   * @param {number} id_trimestre - ID del trimestre
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<boolean>} true si se quitó exitosamente
   */
  async quitarRapTrimestre(id_rap, id_trimestre, id_ficha) {
    return planeacionService.quitarRapTrimestre(id_rap, id_trimestre, id_ficha);
  }

  /**
   * Recalcula las horas de un RAP en una ficha específica
   * @param {number} id_rap - ID del RAP
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<boolean>} true si se recalculó exitosamente
   */
  async recalcularHorasRap(id_rap, id_ficha) {
    return planeacionService.recalcularHorasRap(id_rap, id_ficha);
  }

  /**
   * Obtiene los trimestres de una ficha
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<Array>} Lista de trimestres con id_trimestre, no_trimestre, fase
   */
  async obtenerTrimestresPorFicha(id_ficha) {
    try {
      const [trimestres] = await db.query(
        `SELECT 
          t.id_trimestre,
          t.no_trimestre,
          t.fase,
          t.id_ficha
        FROM trimestre t
        WHERE t.id_ficha = ?
        ORDER BY t.no_trimestre`,
        [id_ficha]
      );

      return trimestres;
    } catch (error) {
      logger.error("Error en obtenerTrimestresPorFicha", { stack: error.stack });
      throw error;
    }
  }

  /**
   * Asigna un instructor a una tarjeta RAP-trimestre
   * @param {number} id_rap_trimestre - ID del registro rap_trimestre
   * @param {number} id_instructor - ID del instructor
   * @returns {Promise<Object>} Registro actualizado
   */
  async asignarInstructor(id_rap_trimestre, id_instructor) {
    try {
      logger.debug("asignarInstructor llamado", { id_rap_trimestre, id_instructor });

      // Si id_instructor es null o undefined, desasignar
      if (id_instructor === null || id_instructor === undefined || id_instructor === "") {
        return await this.desasignarInstructor(id_rap_trimestre);
      }

      // Validar que el instructor existe y está activo
      const [instructores] = await db.query(
        `SELECT id_instructor, nombre, estado 
       FROM instructores 
       WHERE id_instructor = ?`,
        [id_instructor]
      );

      if (instructores.length === 0) {
        throw new Error("Instructor no encontrado");
      }

      if (instructores[0].estado !== "Activo") {
        throw new Error("El instructor no está activo");
      }

      const instructor = instructores[0];
      logger.debug("Instructor asignado a RAP trimestre", { id_instructor });

      // Actualizar el registro rap_trimestre
      await db.query(
        `UPDATE rap_trimestre 
       SET instructor_asignado = ?, id_instructor = ?
       WHERE id_rap_trimestre = ?`,
        [instructor.nombre, id_instructor, id_rap_trimestre]
      );

      logger.debug("Instructor asignado correctamente");

      // Obtener el registro actualizado
      const [resultados] = await db.query(
        `SELECT 
        rt.id_rap_trimestre,
        rt.id_rap,
        rt.id_trimestre,
        rt.id_ficha,
        rt.horas_trimestre,
        rt.horas_semana,
        rt.estado,
        rt.instructor_asignado,
        rt.id_instructor
       FROM rap_trimestre rt
       WHERE rt.id_rap_trimestre = ?`,
        [id_rap_trimestre]
      );

      return resultados[0] || null;
    } catch (error) {
      logger.error("Error en asignarInstructor", { stack: error.stack });
      throw error;
    }
  }

  /**
   * Obtiene los instructores activos para una ficha específica
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<Array>} Lista de instructores
   */
  async obtenerInstructoresPorFicha(id_ficha) {
    try {
      const [instructores] = await db.query(
        `SELECT DISTINCT i.id_instructor, i.nombre, i.email, i.cedula, inf.rol
       FROM instructores i
       INNER JOIN instructor_ficha inf ON i.id_instructor = inf.id_instructor
       WHERE inf.id_ficha = ? AND i.estado = 'Activo'
       ORDER BY i.nombre`,
        [id_ficha]
      );

      return instructores;
    } catch (error) {
      logger.error("Error en obtenerInstructoresPorFicha", { stack: error.stack });
      throw error;
    }
  }

  /**
   * Desasigna un instructor de un RAP-trimestre
   * @param {number} id_rap_trimestre - ID del registro rap_trimestre
   * @returns {Promise<Object>} Registro actualizado
   */
  async desasignarInstructor(id_rap_trimestre) {
    try {
      // Poner ambos campos a NULL: instructor_asignado (nombre) e id_instructor (FK)
      await db.query(
        `UPDATE rap_trimestre
         SET instructor_asignado = NULL,
             id_instructor = NULL
       WHERE id_rap_trimestre = ?`,
        [id_rap_trimestre]
      );

      // Devolver el registro actualizado (si existe)
      const [resultados] = await db.query(
        `SELECT 
         rt.id_rap_trimestre,
         rt.id_rap,
         rt.id_trimestre,
         rt.id_ficha,
         rt.horas_trimestre,
         rt.horas_semana,
         rt.estado,
         rt.instructor_asignado,
         rt.id_instructor
       FROM rap_trimestre rt
       WHERE rt.id_rap_trimestre = ?`,
        [id_rap_trimestre]
      );

      return resultados[0] || null;
    } catch (error) {
      logger.error("Error en desasignarInstructor", { stack: error.stack });
      throw error;
    }
  }

  /**
   * Valida que un trimestre pertenece a una ficha
   * @param {number} id_trimestre - ID del trimestre
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<boolean>} true si el trimestre pertenece a la ficha
   */
  async validarTrimestrePerteneceFicha(id_trimestre, id_ficha) {
    try {
      const [resultados] = await db.query(
        `SELECT COUNT(*) as count
         FROM trimestre t
         JOIN fichas f ON t.id_ficha = f.id_ficha
         WHERE t.id_trimestre = ? AND f.id_ficha = ?`,
        [id_trimestre, id_ficha]
      );

      return resultados[0].count > 0;
    } catch (error) {
      logger.error("Error en validarTrimestrePerteneceFicha", { stack: error.stack });
      throw error;
    }
  }

  /**
   * Construye la matriz de sábana a partir de filas base (equivalente a v_sabana_matriz).
   * Agrupa por RAP y pivota dinámicamente por no_trimestre.
   * @param {Array} baseRows
   * @returns {Array}
   */
  _buildSabanaMatriz(baseRows) {
    if (!baseRows.length) {
      return [];
    }

    const trimestresEnFicha = [...new Set(baseRows.map((row) => row.no_trimestre))]
      .sort((a, b) => a - b);

    const groups = new Map();

    for (const row of baseRows) {
      if (!groups.has(row.id_rap)) {
        groups.set(row.id_rap, {
          base: {
            id_ficha: row.id_ficha,
            id_competencia: row.id_competencia,
            codigo_norma: row.codigo_norma,
            nombre_competencia: row.nombre_competencia,
            duracion_maxima: row.duracion_maxima,
            id_rap: row.id_rap,
            codigo_rap: row.codigo_rap,
            descripcion_rap: row.descripcion_rap,
            duracion_rap: row.duracion_rap,
          },
          byTrimestre: new Map(),
        });
      }
      groups.get(row.id_rap).byTrimestre.set(row.no_trimestre, row);
    }

    const matriz = [];

    for (const { base, byTrimestre } of groups.values()) {
      const fila = { ...base };
      let totalHoras = 0;

      for (const noTrimestre of trimestresEnFicha) {
        const trimestreRow = byTrimestre.get(noTrimestre);
        const prefix = `t${noTrimestre}`;

        fila[`${prefix}_id_rap_trimestre`] = trimestreRow?.id_rap_trimestre ?? null;
        fila[`${prefix}_htrim`] = trimestreRow?.horas_trimestre != null
          ? Math.round(Number(trimestreRow.horas_trimestre))
          : null;
        fila[`${prefix}_hsem`] = trimestreRow?.horas_semana != null
          ? Math.round(Number(trimestreRow.horas_semana))
          : null;
        fila[`${prefix}_id_instructor`] = trimestreRow?.id_instructor ?? null;
        fila[`${prefix}_instructor`] = trimestreRow?.instructor_asignado ?? null;

        if (trimestreRow?.horas_trimestre != null) {
          totalHoras += Number(trimestreRow.horas_trimestre);
        }
      }

      fila.total_horas = totalHoras;
      matriz.push(fila);
    }

    matriz.sort((a, b) => {
      if (a.id_competencia !== b.id_competencia) {
        return a.id_competencia - b.id_competencia;
      }
      const codigoA = Number.parseInt(a.codigo_rap, 10) || 0;
      const codigoB = Number.parseInt(b.codigo_rap, 10) || 0;
      if (codigoA !== codigoB) {
        return codigoA - codigoB;
      }
      return a.id_rap - b.id_rap;
    });

    return matriz;
  }

  /**
   * Obtiene la sábana base de una ficha (sin vistas).
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<Array>} Datos de la sabana base
   */
  async obtenerSabanaBase(id_ficha) {
    try {
      const existe = await sabanaRepository.fichaExists(id_ficha);
      if (!existe) {
        throw new Error("Ficha no encontrada");
      }

      return await sabanaRepository.findSabanaBaseByFicha(id_ficha);
    } catch (error) {
      logger.error("Error en obtenerSabanaBase", { stack: error.stack, id_ficha });
      if (error.message === "Ficha no encontrada") {
        throw error;
      }
      throw new Error("Error al obtener sabana base");
    }
  }

  /**
   * Obtiene la matriz de sábana de una ficha (sin vistas).
   * @param {number} id_ficha - ID de la ficha
   * @returns {Promise<Array>} Datos de la sabana matriz
   */
  async obtenerSabanaMatriz(id_ficha) {
    try {
      const baseRows = await this.obtenerSabanaBase(id_ficha);
      return this._buildSabanaMatriz(baseRows);
    } catch (error) {
      if (error.message === "Ficha no encontrada") {
        throw error;
      }
      logger.error("Error en obtenerSabanaMatriz", { stack: error.stack, id_ficha });
      throw new Error("Error al obtener sabana matriz");
    }
  }
}

module.exports = SabanaService;
