// // import { pool } from "../config/database";

// // interface Competencia {
// //   competencia: string;
// //   codigo: string;
// //   nombre: string;
// //   hora: string;
// //   criterios_evaluacion: string;
// //   conocimientos_proceso: string;
// //   conocimientos_saber: string;
// //   resultados_aprendizaje: string[];
// // }

// // export const PdfServices = {
// //   async insertarCompetencias(lista: Competencia[], idPrograma: number = 1) {
// //     const sql = `
// //       INSERT INTO competencias (
// //         norma_competencia, codigo_competencia, actividad_proyecto, nombre_competencia,
// //         duracion_competencia, criterios_de_evaluacion, conocimientos_proceso,
// //         conocimientos_saber, fase_base, fase_vista, id_programa
// //       )
// //       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// //     `;

// //     const conn = await pool.getConnection();

// //     try {
// //       for (const c of lista) {
// //         // 🧹 Limpiar el número de horas, extrayendo solo el valor numérico
// //         let duracionNumerica: number | null = null;
// //         if (c.hora) {
// //           const match = c.hora.match(/\d+/);
// //           duracionNumerica = match ? parseInt(match[0], 10) : null;
// //         }

// //         await conn.query(sql, [
// //           c.competencia || "",
// //           c.codigo || "",
// //           c.resultados_aprendizaje?.join("\n") || "",
// //           c.nombre || "",
// //           duracionNumerica, // 👈 ahora sí número
// //           c.criterios_evaluacion || "",
// //           c.conocimientos_proceso || "",
// //           c.conocimientos_saber || "",
// //           "Base",
// //           "Vista",
// //           idPrograma,
// //         ]);
// //       }

// //       return { success: true, inserted: lista.length };
// //     } catch (err) {
// //       console.error("❌ Error insertando competencias:", err);
// //       return { success: false, error: err };
// //     } finally {
// //       conn.release();
// //     }
// //   },
// // };

// // import { pool } from "../config/database";

// // interface Competencia {
// //   competencia: string;
// //   codigo: string;
// //   nombre: string;
// //   hora: string;
// //   criterios_evaluacion: string;
// //   conocimientos_proceso: string;
// //   conocimientos_saber: string;
// //   resultados_aprendizaje: string[];
// // }

// // export const PdfServices = {
// //   async insertarCompetencias(lista: Competencia[], idPrograma: number = 1) {
// //     const sqlCompetencia = `
// //       INSERT INTO competencias (
// //         norma_competencia, codigo_competencia, actividad_proyecto, nombre_competencia,
// //         duracion_competencia, criterios_de_evaluacion, conocimientos_proceso,
// //         conocimientos_saber, fase_base, fase_vista, id_programa
// //       )
// //       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// //     `;

// //     const sqlResultado = `
// //       INSERT INTO resultado_de_aprendizaje (
// //         nombre_resultado, estado, instructor_asignado, id_competencia
// //       )
// //       VALUES (?, 'Por Asignar', NULL, ?)
// //     `;

// //     const conn = await pool.getConnection();

// //     try {
// //       await conn.beginTransaction(); // 🔒 Iniciar transacción para mantener consistencia

// //       let totalCompetencias = 0;
// //       let totalResultados = 0;

// //       for (const c of lista) {
// //         // 🧹 Limpiar el número de horas
// //         let duracionNumerica: number | null = null;
// //         if (c.hora) {
// //           const match = c.hora.match(/\d+/);
// //           duracionNumerica = match ? parseInt(match[0], 10) : null;
// //         }

// //         // 1️⃣ Insertar la competencia
// //         const [result] = await conn.query(sqlCompetencia, [
// //           c.competencia || "",
// //           c.codigo || "",
// //           c.resultados_aprendizaje?.join("\n") || "", // Se mantiene en actividad_proyecto
// //           c.nombre || "",
// //           duracionNumerica,
// //           c.criterios_evaluacion || "",
// //           c.conocimientos_proceso || "",
// //           c.conocimientos_saber || "",
// //           "Base",
// //           "Vista",
// //           idPrograma,
// //         ]);

// //         // 🆔 Obtener el ID de la competencia recién insertada
// //         const idCompetencia = (result as any).insertId;
// //         totalCompetencias++;

// //         // 2️⃣ Insertar los resultados de aprendizaje relacionados
// //         if (c.resultados_aprendizaje && Array.isArray(c.resultados_aprendizaje)) {
// //           for (const resultado of c.resultados_aprendizaje) {
// //             // Filtrar líneas vacías o que no sean resultados válidos
// //             const resultadoLimpio = resultado.trim();

// //             // Ignorar líneas que no sean resultados de aprendizaje reales
// //             if (
// //               resultadoLimpio &&
// //               !resultadoLimpio.includes("CONOCIMIENTOS") &&
// //               !resultadoLimpio.match(/^\d+\.\d+/)  // Ignora líneas como "4.6 CONOCIMIENTOS"
// //             ) {
// //               await conn.query(sqlResultado, [
// //                 resultadoLimpio,
// //                 idCompetencia
// //               ]);
// //               totalResultados++;
// //             }
// //           }
// //         }
// //       }

// //       await conn.commit(); // ✅ Confirmar transacción

// //       return {
// //         success: true,
// //         insertedCompetencias: totalCompetencias,
// //         insertedResultados: totalResultados
// //       };

// //     } catch (err) {
// //       await conn.rollback(); // ❌ Revertir cambios si hay error
// //       console.error("❌ Error insertando competencias y resultados:", err);
// //       return { success: false, error: err };
// //     } finally {
// //       conn.release();
// //     }
// //   },
// // };

// import { pool } from "../config/database";
// import { exec } from "child_process";
// import { promisify } from "util";
// import path from "path";
// import { fileURLToPath } from "url";

// const execPromise = promisify(exec);

// // ⚙️ Solución para __dirname en módulos ES
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// interface Competencia {
//   competencia: string;
//   codigo: string;
//   nombre: string;
//   hora: string;
//   criterios_evaluacion: string;
//   conocimientos_proceso: string;
//   conocimientos_saber: string;
//   resultados_aprendizaje: string[];
// }

// export const PdfServices = {
//   /**
//    * 🐍 Ejecuta el script de Python para generar el JSON
//    */
//   async ejecutarScriptPython(): Promise<{ success: boolean; output?: string; error?: string }> {
//     try {
//       // Ruta al script de Python
//       const pythonScriptPath = path.resolve(__dirname, "../../python/process_pdf.py");

//       console.log("🐍 Ejecutando script de Python:", pythonScriptPath);

//       // Ejecutar el script de Python
//       const { stdout, stderr } = await execPromise(`python3 "${pythonScriptPath}"`);

//       if (stderr) {
//         console.warn("⚠️ Advertencias de Python:", stderr);
//       }

//       console.log("✅ Script de Python ejecutado:", stdout);

//       return { success: true, output: stdout };
//     } catch (error: any) {
//       console.error("❌ Error ejecutando script de Python:", error);
//       return { 
//         success: false, 
//         error: error.message || String(error)
//       };
//     }
//   },

//   async insertarCompetencias(lista: Competencia[], idPrograma: number = 1) {
//     const sqlCompetencia = `
//       INSERT INTO competencias (
//         norma_competencia, codigo_competencia, actividad_proyecto, nombre_competencia,
//         duracion_competencia, criterios_de_evaluacion, conocimientos_proceso,
//         conocimientos_saber, fase_base, fase_vista, id_programa
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const sqlResultado = `
//       INSERT INTO resultado_de_aprendizaje (
//         nombre_resultado, estado, instructor_asignado, id_competencia
//       )
//       VALUES (?, 'Por Asignar', NULL, ?)
//     `;

//     const conn = await pool.getConnection();

//     try {
//       await conn.beginTransaction(); // 🔒 Iniciar transacción para mantener consistencia

//       let totalCompetencias = 0;
//       let totalResultados = 0;

//       for (const c of lista) {
//         // 🧹 Limpiar el número de horas
//         let duracionNumerica: number | null = null;
//         if (c.hora) {
//           const match = c.hora.match(/\d+/);
//           duracionNumerica = match ? parseInt(match[0], 10) : null;
//         }

//         // 🔤 Convertir todo a minúsculas
//         const competenciaMin = (c.competencia || "").toLowerCase();
//         const codigoMin = (c.codigo || "").toLowerCase();
//         const nombreMin = (c.nombre || "").toLowerCase();
//         const criteriosMin = (c.criterios_evaluacion || "").toLowerCase();
//         const procesoMin = (c.conocimientos_proceso || "").toLowerCase();
//         const saberMin = (c.conocimientos_saber || "").toLowerCase();
//         const actividadMin = (c.resultados_aprendizaje?.join("\n") || "").toLowerCase();

//         // 1️⃣ Insertar la competencia
//         const [result] = await conn.query(sqlCompetencia, [
//           competenciaMin,
//           codigoMin,
//           actividadMin, // Se mantiene en actividad_proyecto
//           nombreMin,
//           duracionNumerica,
//           criteriosMin,
//           procesoMin,
//           saberMin,
//           "base", // También en minúsculas
//           "vista", // También en minúsculas
//           idPrograma,
//         ]);

//         // 🆔 Obtener el ID de la competencia recién insertada
//         const idCompetencia = (result as any).insertId;
//         totalCompetencias++;

//         // 2️⃣ Insertar los resultados de aprendizaje relacionados
//         if (c.resultados_aprendizaje && Array.isArray(c.resultados_aprendizaje)) {
//           for (const resultado of c.resultados_aprendizaje) {
//             // Filtrar líneas vacías o que no sean resultados válidos
//             const resultadoLimpio = resultado.trim();

//             // Ignorar líneas que no sean resultados de aprendizaje reales
//             if (
//               resultadoLimpio &&
//               !resultadoLimpio.includes("CONOCIMIENTOS") &&
//               !resultadoLimpio.match(/^\d+\.\d+/)  // Ignora líneas como "4.6 CONOCIMIENTOS"
//             ) {
//               // 🔤 Convertir resultado a minúsculas
//               await conn.query(sqlResultado, [
//                 resultadoLimpio.toLowerCase(),
//                 idCompetencia
//               ]);
//               totalResultados++;
//             }
//           }
//         }
//       }

//       await conn.commit(); // ✅ Confirmar transacción

//       return {
//         success: true,
//         insertedCompetencias: totalCompetencias,
//         insertedResultados: totalResultados
//       };

//     } catch (err) {
//       await conn.rollback(); // ❌ Revertir cambios si hay error
//       console.error("❌ Error insertando competencias y resultados:", err);
//       return { success: false, error: err };
//     } finally {
//       conn.release();
//     }
//   },
// };

import { pool } from "../config/database";
import { exec, execSync } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const execPromise = promisify(exec);

/**
 * Detecta qué binario de Python está disponible en el sistema.
 * Intenta `python3` y luego `python`. Lanza error si ninguno existe.
 */
function detectPythonBinary(): string {
  // 1) Si el usuario definió una ruta explícita, usarla
  const envPython = process.env.PYTHON_PATH;
  const candidates: string[] = [];

  if (envPython) {
    candidates.push(envPython);
  }

  // 2) Intentar usar un virtualenv local dentro del proyecto (Windows y *nix)
  try {
    const winVenv = path.resolve(__dirname, "../../alistamiento/Scripts/python.exe");
    const nixVenv = path.resolve(__dirname, "../../alistamiento/bin/python");
    candidates.push(winVenv, nixVenv);
  } catch (err) {
    // no crítico
  }

  // 3) Finalmente, probar los comandos globales conocidos
  candidates.push("python3", "python");

  for (const cmd of candidates) {
    if (!cmd) continue;
    try {
      // Encerrar el comando entre comillas para soportar rutas con espacios
      execSync(`"${cmd}" --version`, { stdio: "ignore" });
      return cmd;
    } catch (e) {
      // intentar siguiente
    }
  }

  throw new Error("No se encontró Python en el sistema. Instala Python y asegúrate de que 'python', 'python3' o la ruta a un venv estén disponibles.");
}

// ⚙️ Solución para __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Competencia {
  competencia: string;
  codigo: string;
  nombre: string;
  hora: string;
  criterios_evaluacion: string;
  conocimientos_proceso: string;
  conocimientos_saber: string;
  resultados_aprendizaje: string[];
}

// Agregar esta interfaz al inicio del archivo
interface ProyectoInfo {
  codigo_proyecto_sofia: string | null;
  codigo_programa_sofia: string | null;
  nombre_proyecto: string | null;
  tiempo_ejecucion_meses: string | number | null;
}

interface ProgramaInfo {
  codigo_programa: string | null;
  nombre_programa: string | null;
  titulo_obtenido: string | null;
  tipo_programa: string | null;
  version: string | null;
  duracion_total_programa: number | null;
  duracion_etapa_lectiva: number | null;
  duracion_etapa_productiva: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
}

interface FaseCompetencia {
  codigo_competencia: string;
  fase: string;
}

// Interfaz para actualización de fases de resultados de aprendizaje
interface FaseResultado {
  codigo_resultado: string;
  fase: string;
}

// Interfaz para resultados de aprendizaje del proyecto con información completa
interface ResultadoProyecto {
  nombre_resultado: string | null;
  codigo_completo: string;
  codigo_corto: string | null;
  fase: string;
}

/**
 * Función de normalización de texto para comparación
 * Convierte a minúsculas, quita tildes y espacios extra
 */
function normalize(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .trim();
}

export const PdfServices = {
  /**
   * 🐍 Ejecuta el script de Python con la ruta del PDF como argumento
   */

  async ejecutarScriptProyecto(pdfPath: string): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      const pythonScriptPath = path.resolve(__dirname, "../../python/process_project_pdf.py");
      const outputJsonPath = path.resolve(__dirname, "../../python/output_project.json");

      console.log("🐍 Ejecutando script de Python para proyecto...");
      console.log("📄 PDF a procesar:", pdfPath);
      console.log("📜 Script:", pythonScriptPath);

      let pythonCmd = 'python3';
      try {
        pythonCmd = detectPythonBinary();
      } catch (err) {
        console.error('❌ Python no encontrado:', err);
        return { success: false, error: String(err) };
      }

      const command = `${pythonCmd} "${pythonScriptPath}" "${pdfPath}" "${outputJsonPath}"`;
      console.log("🔧 Comando:", command);

      const { stdout, stderr } = await execPromise(command);

      if (stderr) {
        console.warn("⚠️ Advertencias de Python:", stderr);
      }

      console.log("✅ Script de Python ejecutado:", stdout);

      return { success: true, output: stdout };
    } catch (error: any) {
      console.error("❌ Error ejecutando script de Python:", error);
      return {
        success: false,
        error: error.message || String(error)
      };
    }
  },
  async ejecutarScriptPython(pdfPath: string): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      const pythonScriptPath = path.resolve(__dirname, "../../python/process_pdf.py");
      const outputJsonPath = path.resolve(__dirname, "../../python/output.json");

      console.log("🐍 Ejecutando script de Python...");
      console.log("📄 PDF a procesar:", pdfPath);
      console.log("📜 Script:", pythonScriptPath);

      let pythonCmd = 'python3';
      try {
        pythonCmd = detectPythonBinary();
      } catch (err) {
        console.error('❌ Python no encontrado:', err);
        return { success: false, error: String(err) };
      }

      // Ejecutar Python pasando la ruta del PDF y la ruta de salida como argumentos
      const command = `${pythonCmd} "${pythonScriptPath}" "${pdfPath}" "${outputJsonPath}"`;
      console.log("🔧 Comando:", command);

      const { stdout, stderr } = await execPromise(command);

      if (stderr) {
        console.warn("⚠️ Advertencias de Python:", stderr);
      }

      console.log("✅ Script de Python ejecutado:", stdout);

      return { success: true, output: stdout };
    } catch (error: any) {
      console.error("❌ Error ejecutando script de Python:", error);
      return {
        success: false,
        error: error.message || String(error)
      };
    }
  },

  async insertarCompetencias(lista: Competencia[], idPrograma: number = 1, idFicha?: number) {
    // ✅ SQL actualizado para competencias (sin columnas que ya no existen)
    const sqlCompetencia = `
      INSERT INTO competencias (
        norma_competencia, 
        codigo_competencia, 
        nombre_competencia,
        duracion_competencia, 
        id_programa,
        id_ficha
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    // ✅ SQL actualizado para resultados con las nuevas columnas
    const sqlResultado = `
      INSERT INTO resultado_de_aprendizaje (
        nombre_resultado, 
        id_competencia,
        id_ficha,
        conocimientos_saber,
        conocimientos_proceso,
        criterios_evaluacion,
        actividad_proyecto
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      let totalCompetencias = 0;
      let totalResultados = 0;

      for (const c of lista) {
        // 🧹 Limpiar el número de horas
        let duracionNumerica: number | string | null = null;
        if (c.hora) {
          const match = c.hora.match(/\d+/);
          duracionNumerica = match ? match[0] : null; // Guardar como string según tu esquema
        }

        // 🔤 Convertir a minúsculas
        const competenciaMin = (c.competencia || "").toLowerCase();
        const codigoMin = (c.codigo || "").toLowerCase();
        const nombreMin = (c.nombre || "").toLowerCase();
        const criteriosMin = (c.criterios_evaluacion || "").toLowerCase();
        const procesoMin = (c.conocimientos_proceso || "").toLowerCase();
        const saberMin = (c.conocimientos_saber || "").toLowerCase();

        // 1️⃣ Insertar la competencia (SIN las columnas que ya no existen)
        const [result] = await conn.query(sqlCompetencia, [
          competenciaMin,           // norma_competencia
          codigoMin,                // codigo_competencia
          nombreMin,                // nombre_competencia
          duracionNumerica,         // duracion_competencia
          idPrograma,               // id_programa
          idFicha || null           // id_ficha
        ]);

        // 🆔 Obtener el ID de la competencia recién insertada
        const idCompetencia = (result as any).insertId;
        totalCompetencias++;

        console.log(`   ✅ Competencia insertada: ${codigoMin} - ${nombreMin.substring(0, 50)}...`);

        // 2️⃣ Insertar los resultados de aprendizaje relacionados
        if (c.resultados_aprendizaje && Array.isArray(c.resultados_aprendizaje)) {
          for (const resultado of c.resultados_aprendizaje) {
            const resultadoLimpio = (resultado || "").trim();

            if (!resultadoLimpio) {
              console.log(`   ⚠️ Línea vacía/skipped en resultados de competencia id_competencia=${idCompetencia}`);
              continue;
            }

            // Filtros de exclusión
            const contieneConocimientos = /conocimientos/i.test(resultadoLimpio);
            const prefijoNumeroPuntoNumero = /^\d+\.\d+/.test(resultadoLimpio);

            if (contieneConocimientos || prefijoNumeroPuntoNumero) {
              const motivo = contieneConocimientos ? 'contiene CONOCIMIENTOS' : 'prefijo numerado tipo X.Y';
              console.log(`   ✂️ Saltado: '${resultadoLimpio.substring(0, 120)}' - motivo: ${motivo}`);
              continue;
            }

            const resultadoNormalizado = normalize(resultadoLimpio);
            if (resultadoNormalizado === 'denominacion' || resultadoNormalizado === 'denominación') {
              console.log(`   ✂️ Saltado (palabra genérica): '${resultadoLimpio.substring(0, 80)}'`);
              continue;
            }

            try {
              // ✅ Insertar resultado con las columnas movidas desde competencias
              await conn.query(sqlResultado, [
                resultadoLimpio.toLowerCase(),  // nombre_resultado
                idCompetencia,                   // id_competencia
                idFicha || null,                 // id_ficha
                saberMin,                        // conocimientos_saber
                procesoMin,                      // conocimientos_proceso
                criteriosMin,                    // criterios_evaluacion
                ""                               // actividad_proyecto (vacío por ahora)
              ]);
              totalResultados++;
              console.log(`   ✅ Insertado resultado: '${resultadoLimpio.substring(0, 120)}' (id_competencia=${idCompetencia})`);
            } catch (err) {
              console.error(`   ❌ Error insertando resultado '${resultadoLimpio.substring(0, 120)}':`, err);
            }
          }
        }
      }

      await conn.commit();

      console.log(`\n📊 Resumen de inserción:`);
      console.log(`   ✅ Competencias insertadas: ${totalCompetencias}`);
      console.log(`   ✅ Resultados insertados: ${totalResultados}`);

      return {
        success: true,
        insertedCompetencias: totalCompetencias,
        insertedResultados: totalResultados
      };

    } catch (err) {
      await conn.rollback();
      console.error("❌ Error insertando competencias y resultados:", err);
      return { success: false, error: err };
    } finally {
      conn.release();
    }
  },

  /**
   * 📥 Procesa un PDF subido por el usuario
   */
  async procesarPDFSubido(filePath: string, idPrograma: number = 1, idFicha?: number) {
    try {
      console.log("🚀 Iniciando procesamiento del PDF...");

      // 1️⃣ Ejecutar script de Python
      const pythonResult = await this.ejecutarScriptPython(filePath);

      if (!pythonResult.success) {
        return {
          success: false,
          error: "Error al procesar el PDF con Python",
          details: pythonResult.error,
        };
      }

      // 2️⃣ Leer el JSON generado
      const jsonPath = path.resolve(__dirname, "../../python/output.json");

      // Esperar un momento para asegurar que el archivo se escribió
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!fs.existsSync(jsonPath)) {
        return {
          success: false,
          error: "No se generó el archivo JSON después de procesar el PDF",
        };
      }

      const rawData = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(rawData);

      // Nota: anteriormente se guardaba un respaldo en `extraction_raw`.
      // Se ha eliminado el almacenamiento crudo para evitar esa tabla.

      const programa = data.programa;
      const competencias = data.competencias;

      let detectedProgramaId = idPrograma;
      if (programa) {
        try {
          const saveRes: any = await this.guardarProgramaFormativo(programa);
          if (saveRes && saveRes.id_programa) {
            detectedProgramaId = saveRes.id_programa;
          }
        } catch (err) {
          console.warn('⚠️ guardarProgramaFormativo falló:', err);
        }
      }

      if (!Array.isArray(competencias) || competencias.length === 0) {
        return {
          success: false,
          error: "No se encontraron competencias en el PDF",
        };
      }

      console.log(`📊 Se encontraron ${competencias.length} competencias`);

      // 3️⃣ Insertar en la base de datos usando el id_programa detectado y id_ficha (se crea automáticamente si no existe)
      const result = await this.insertarCompetencias(competencias, detectedProgramaId || idPrograma, idFicha);

      // 4️⃣ Limpiar archivo temporal
      try {
        fs.unlinkSync(filePath);
        console.log("🗑️ Archivo temporal eliminado");
      } catch (err) {
        console.warn("⚠️ No se pudo eliminar el archivo temporal:", err);
      }

      return result;
    } catch (error: any) {
      console.error("❌ Error procesando PDF:", error);
      return {
        success: false,
        error: "Error general al procesar el PDF",
        details: error.message,
      };
    }
  },
  async procesarPDFProyecto(filePath: string, idPrograma: number) {
    try {
      console.log("\n🚀 ================================");
      console.log("🚀 Iniciando procesamiento del PDF de proyecto");
      console.log(`🚀 ID Programa: ${idPrograma}`);
      console.log("🚀 ================================\n");

      // 1️⃣ Ejecutar script de Python
      const pythonResult = await this.ejecutarScriptProyecto(filePath);

      if (!pythonResult.success) {
        return {
          success: false,
          error: "Error al procesar el PDF de proyecto con Python",
          details: pythonResult.error,
        };
      }

      // 2️⃣ Leer el JSON generado
      const jsonPath = path.resolve(__dirname, "../../python/output_project.json");

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!fs.existsSync(jsonPath)) {
        return {
          success: false,
          error: "No se generó el archivo JSON después de procesar el PDF de proyecto",
        };
      }

      const rawData = fs.readFileSync(jsonPath, "utf-8");
      const data = JSON.parse(rawData);

      // Extraer información del JSON
      const proyectoInfo: ProyectoInfo = data.proyecto || data;
      const programaInfo: ProgramaInfo | null = data.programa || null;
      const fasesCompetencias: FaseCompetencia[] = data.fases_competencias || [];
      const fasesResultados: ResultadoProyecto[] = data.fases_resultados || [];

      console.log(`\n📦 Datos extraídos del PDF:`);
      console.log(`   📋 Proyecto:`, proyectoInfo);
      console.log(`   📚 Programa:`, programaInfo ? 'Sí' : 'No');
      console.log(`   🔄 Fases (competencias): ${fasesCompetencias.length} relaciones`);
      console.log(`   🔄 Fases (resultados): ${fasesResultados.length} relaciones`);

      // Nota: anteriormente se guardaba un respaldo en `extraction_raw`.
      // Se ha eliminado el almacenamiento crudo para evitar esa tabla.

      // 3️⃣ Guardar información del programa formativo si está disponible
      let detectedProgramaId = idPrograma;
      if (programaInfo) {
        try {
          console.log('\n📥 Guardando/actualizando programa_formativo desde PDF de proyecto...');
          const saveRes: any = await this.guardarProgramaFormativo(programaInfo);
          if (saveRes && saveRes.id_programa) {
            detectedProgramaId = saveRes.id_programa;
            console.log(`✅ Programa guardado/actualizado con id_programa=${detectedProgramaId}`);
          }
        } catch (err) {
          console.warn('⚠️ No se pudo guardar programa_formativo desde proyecto:', err);
        }
      } else {
        // Fallback: intentar con información básica del proyecto
        try {
          const programaCandidate: any = {};
          if (proyectoInfo.codigo_programa_sofia) {
            programaCandidate.codigo_programa = proyectoInfo.codigo_programa_sofia;
          }
          if (proyectoInfo.nombre_proyecto) {
            programaCandidate.nombre_programa = proyectoInfo.nombre_proyecto;
          }

          if (Object.keys(programaCandidate).length > 0) {
            console.log('\n📥 Intentando guardar programa_formativo con información básica del proyecto...');
            // Agregar valores por defecto para evitar errores de NULL
            programaCandidate.titulo_obtenido = programaCandidate.titulo_obtenido || 'TECNÓLOGO';
            programaCandidate.tipo_programa = programaCandidate.tipo_programa || 'TITULADO';
            programaCandidate.version = programaCandidate.version || '1';
            programaCandidate.duracion_total_programa = programaCandidate.duracion_total_programa || 0;

            try {
              const saveRes: any = await this.guardarProgramaFormativo(programaCandidate);
              if (saveRes && saveRes.id_programa) {
                detectedProgramaId = saveRes.id_programa;
                console.log(`✅ Programa detectado/creado con id_programa=${detectedProgramaId}`);
              }
            } catch (err) {
              console.warn('⚠️ No se pudo guardar programa_formativo con información básica:', err);
            }
          }
        } catch (err) {
          console.warn('⚠️ Error preparando programa desde proyecto:', err);
        }
      }

      // 4️⃣ ⭐ ACTUALIZAR RESULTADOS DE APRENDIZAJE DESDE PROYECTO ⭐
      let resultadoActualizacion = null;
      if (fasesResultados.length > 0) {
        try {
          resultadoActualizacion = await this.actualizarResultadosDesdeProyecto(
            fasesResultados,
            detectedProgramaId || idPrograma
          );

          if (resultadoActualizacion && resultadoActualizacion.success) {
            console.log(`\n✅ Resultados actualizados correctamente`);
            console.log(`   📊 ${resultadoActualizacion.actualizados} de ${resultadoActualizacion.total} resultados actualizados`);
            console.log(`   📊 ${resultadoActualizacion.fasesActualizadas} fases actualizadas`);
            if (resultadoActualizacion.noEncontrados && resultadoActualizacion.noEncontrados > 0) {
              console.log(`   ⚠️ ${resultadoActualizacion.noEncontrados} resultados no encontrados`);
            }
          } else if (resultadoActualizacion && !resultadoActualizacion.success) {
            console.warn(`\n⚠️ Error al actualizar resultados:`, resultadoActualizacion.error);
          }
        } catch (err) {
          console.warn('\n⚠️ No se pudieron actualizar los resultados desde el proyecto:', err);
        }
      } else {
        console.log(`\n⚠️ No se encontraron resultados con nombre en el PDF del proyecto`);
      }

      // 5️⃣ ⭐ ACTUALIZAR FASES DE COMPETENCIAS ⭐ (mantener compatibilidad)
      let resultadoFases = null;
      if (fasesCompetencias.length > 0) {
        try {
          console.log(`\n🔄 ================================`);
          console.log(`🔄 ACTUALIZANDO FASES DE COMPETENCIAS`);
          console.log(`🔄 ================================`);

          resultadoFases = await this.actualizarFasesCompetencias(fasesCompetencias, detectedProgramaId || idPrograma);

          if (resultadoFases && resultadoFases.success) {
            console.log(`\n✅ Fases actualizadas correctamente`);
            console.log(`   📊 ${resultadoFases.actualizadas} de ${resultadoFases.total} competencias actualizadas`);
            if (resultadoFases.noEncontradas && resultadoFases.noEncontradas > 0) {
              console.log(`   ⚠️ ${resultadoFases.noEncontradas} competencias no encontradas`);
            }
          } else if (resultadoFases && !resultadoFases.success) {
            console.warn(`\n⚠️ Error al actualizar fases:`, resultadoFases.error);
          }
        } catch (err) {
          console.warn('\n⚠️ No se pudieron actualizar las fases de competencias:', err);
        }
      } else {
        console.log(`\n⚠️ No se encontraron fases de competencias en el PDF del proyecto`);
      }

      // 6️⃣ Actualizar información del proyecto en DB
      const result = await this.actualizarInfoProyecto(proyectoInfo, detectedProgramaId || idPrograma);

      // 7️⃣ Limpiar archivo temporal
      try {
        fs.unlinkSync(filePath);
        console.log("\n🗑️ Archivo temporal eliminado");
      } catch (err) {
        console.warn("⚠️ No se pudo eliminar el archivo temporal:", err);
      }

      console.log("\n✅ ================================");
      console.log("✅ PROCESAMIENTO COMPLETADO");
      console.log("✅ ================================\n");

      return {
        ...result,
        fasesActualizadas: resultadoFases,
        resultadosActualizados: resultadoActualizacion
      };
    } catch (error: any) {
      console.error("\n❌ Error procesando PDF de proyecto:", error);
      return {
        success: false,
        error: "Error general al procesar el PDF de proyecto",
        details: error.message,
      };
    }
  },
  // 2️⃣ Actualizar la interfaz FaseCompetencia

  /**
   * 🔄 Actualiza resultados de aprendizaje con códigos y fases desde el Proyecto
   * Busca resultados por nombre normalizado, actualiza el código y registra la fase
   */
  async actualizarResultadosDesdeProyecto(
    resultados: ResultadoProyecto[],
    idPrograma: number
  ) {
    const conn = await pool.getConnection();

    try {
      // Agregar campo codigo a resultado_de_aprendizaje si no existe
      try {
        await conn.query(`
          ALTER TABLE resultado_de_aprendizaje 
          ADD COLUMN codigo VARCHAR(20) DEFAULT NULL 
          AFTER nombre_resultado;
        `);
        console.log('   ✅ Campo codigo agregado a resultado_de_aprendizaje');
      } catch (err: any) {
        // Si el campo ya existe, ignorar el error
        if (!err.message?.includes('Duplicate column name')) {
          console.warn('   ⚠️ Error al agregar campo codigo:', err.message);
        }
      }

      // Agregar campos fase_base y fase_vista a resultado_de_aprendizaje si no existen
      try {
        await conn.query(`
          ALTER TABLE resultado_de_aprendizaje 
          ADD COLUMN fase_base VARCHAR(50) DEFAULT NULL;
        `);
        console.log('   ✅ Campo fase_base agregado a resultado_de_aprendizaje');
      } catch (err: any) {
        if (!err.message?.includes('Duplicate column name')) {
          console.warn('   ⚠️ Error al agregar campo fase_base:', err.message);
        }
      }

      try {
        await conn.query(`
          ALTER TABLE resultado_de_aprendizaje 
          ADD COLUMN fase_vista VARCHAR(50) DEFAULT NULL;
        `);
        console.log('   ✅ Campo fase_vista agregado a resultado_de_aprendizaje');
      } catch (err: any) {
        if (!err.message?.includes('Duplicate column name')) {
          console.warn('   ⚠️ Error al agregar campo fase_vista:', err.message);
        }
      }

      await conn.beginTransaction();

      let actualizados = 0;
      let fasesActualizadas = 0;
      let noEncontrados: Array<{ nombre: string; codigo: string }> = [];
      let errores: Array<{ nombre: string; error: string }> = [];

      console.log(`\n🔄 ================================`);
      console.log(`🔄 ACTUALIZANDO RESULTADOS DESDE PROYECTO`);
      console.log(`🔄 Total de resultados a procesar: ${resultados.length}`);
      console.log(`🔄 ID Programa: ${idPrograma}`);
      console.log(`🔄 ================================\n`);

      for (const resultado of resultados) {
        try {
          // Validar datos mínimos
          if (!resultado.nombre_resultado || !resultado.fase) {
            console.log(`   ⚠️ Datos incompletos - Nombre: '${resultado.nombre_resultado}', Fase: '${resultado.fase}'`);
            continue;
          }

          // Normalizar el nombre del resultado para búsqueda
          const nombreNormalizado = normalize(resultado.nombre_resultado);

          // Extraer palabras clave del nombre (primeras 5-10 palabras) para búsqueda más flexible
          const palabrasClave = nombreNormalizado.split(/\s+/).slice(0, 8).join(' ');

          // Buscar el resultado en la base de datos por nombre normalizado
          // Necesitamos normalizar también en la consulta SQL
          const [existentes]: any = await conn.query(`
            SELECT r.id_resultado, r.nombre_resultado, 
                   COALESCE(r.codigo, '') as codigo
            FROM resultado_de_aprendizaje r
            INNER JOIN competencias c ON r.id_competencia = c.id_competencia
            WHERE c.id_programa = ?
          `, [idPrograma]);

          // Buscar coincidencia exacta después de normalizar
          let resultadoEncontrado = null;
          let mejorCoincidencia = null;
          let mejorScore = 0;

          for (const existente of existentes) {
            const nombreExistenteNormalizado = normalize(existente.nombre_resultado || "");

            // Coincidencia exacta
            if (nombreExistenteNormalizado === nombreNormalizado) {
              resultadoEncontrado = existente;
              break;
            }

            // Coincidencia parcial: verificar si el nombre del proyecto está contenido en el nombre de la BD
            // o viceversa (al menos 50% de las palabras clave deben coincidir)
            if (nombreExistenteNormalizado.includes(nombreNormalizado) || nombreNormalizado.includes(nombreExistenteNormalizado)) {
              const palabrasExistentes = nombreExistenteNormalizado.split(/\s+/);
              const palabrasProyecto = nombreNormalizado.split(/\s+/);
              const palabrasComunes = palabrasProyecto.filter(p => palabrasExistentes.includes(p) || palabrasExistentes.some(e => e.includes(p) || p.includes(e)));
              const score = palabrasComunes.length / Math.max(palabrasProyecto.length, palabrasExistentes.length);

              if (score > mejorScore && score >= 0.5) { // Al menos 50% de coincidencia
                mejorScore = score;
                mejorCoincidencia = existente;
              }
            }

            // También buscar por palabras clave (primeras palabras)
            if (palabrasClave && palabrasClave.length > 10) {
              if (nombreExistenteNormalizado.startsWith(palabrasClave) || nombreExistenteNormalizado.includes(palabrasClave)) {
                if (!mejorCoincidencia || mejorScore < 0.7) {
                  mejorScore = 0.7;
                  mejorCoincidencia = existente;
                }
              }
            }
          }

          // Si no hay coincidencia exacta, usar la mejor coincidencia parcial
          if (!resultadoEncontrado && mejorCoincidencia) {
            resultadoEncontrado = mejorCoincidencia;
            console.log(`   🔍 Coincidencia parcial encontrada (score: ${(mejorScore * 100).toFixed(0)}%):`);
            console.log(`      Proyecto: '${resultado.nombre_resultado.substring(0, 60)}...'`);
            console.log(`      BD: '${mejorCoincidencia.nombre_resultado.substring(0, 60)}...'`);
          }

          if (!resultadoEncontrado) {
            noEncontrados.push({
              nombre: resultado.nombre_resultado,
              codigo: resultado.codigo_completo
            });
            console.log(`   ⚠️ Resultado NO encontrado: '${resultado.nombre_resultado.substring(0, 60)}...'`);
            continue;
          }

          const idResultado = resultadoEncontrado.id_resultado;

          // Extraer código corto (solo el número después del guion)
          // Ejemplo: de "593343 - 01" extraer "01"
          let codigoCorto = resultado.codigo_corto;
          if (!codigoCorto && resultado.codigo_completo) {
            const match = resultado.codigo_completo.match(/-\s*(\d+)/);
            if (match) {
              codigoCorto = match[1];
            }
          }

          // Normalizar la fase
          const faseNormalizada = resultado.fase.trim().toLowerCase();

          // Actualizar el código y la fase en resultado_de_aprendizaje
          // Actualizamos codigo, fase_base y fase_vista en una sola consulta
          const updateFields: string[] = [];
          const updateValues: any[] = [];

          if (codigoCorto) {
            updateFields.push('codigo = ?');
            updateValues.push(codigoCorto);
          }

          if (faseNormalizada) {
            updateFields.push('fase_base = ?');
            updateFields.push('fase_vista = ?');
            updateValues.push(faseNormalizada);
            updateValues.push(faseNormalizada);
          }

          if (updateFields.length > 0) {
            updateValues.push(idResultado);
            const [updateResult]: any = await conn.query(`
              UPDATE resultado_de_aprendizaje
              SET ${updateFields.join(', ')}
              WHERE id_resultado = ?
            `, updateValues);

            if (updateResult.affectedRows > 0) {
              if (codigoCorto) {
                console.log(`   ✅ Código actualizado: '${codigoCorto}' para resultado ID ${idResultado}`);
              }
              if (faseNormalizada) {
                fasesActualizadas++;
                console.log(`   ✅ Fase actualizada: '${faseNormalizada}' en fase_base y fase_vista para resultado ID ${idResultado}`);
              }
            }
          }

          actualizados++;

        } catch (err: any) {
          errores.push({
            nombre: resultado.nombre_resultado || "Sin nombre",
            error: err.message || String(err)
          });
          console.error(`   ❌ Error procesando resultado '${resultado.nombre_resultado?.substring(0, 50)}...':`, err);
        }
      }

      await conn.commit();

      console.log(`\n📊 ================================`);
      console.log(`📊 RESUMEN DE ACTUALIZACIÓN`);
      console.log(`📊 ================================`);
      console.log(`   ✅ Resultados actualizados: ${actualizados}/${resultados.length}`);
      console.log(`   ✅ Fases actualizadas: ${fasesActualizadas}`);
      console.log(`   ⚠️ No encontrados: ${noEncontrados.length}`);
      console.log(`   ❌ Errores: ${errores.length}`);

      if (noEncontrados.length > 0 && noEncontrados.length <= 10) {
        console.log(`\n   📋 Resultados no encontrados (primeros 10):`);
        noEncontrados.slice(0, 10).forEach((item, idx) => {
          console.log(`      ${idx + 1}. ${item.nombre.substring(0, 60)}... (Código: ${item.codigo})`);
        });
      }

      if (errores.length > 0 && errores.length <= 5) {
        console.log(`\n   ❌ Errores encontrados (primeros 5):`);
        errores.slice(0, 5).forEach((item, idx) => {
          console.log(`      ${idx + 1}. ${item.nombre.substring(0, 50)}...: ${item.error}`);
        });
      }

      return {
        success: true,
        actualizados,
        fasesActualizadas,
        total: resultados.length,
        noEncontrados: noEncontrados.length,
        errores: errores.length,
        detallesNoEncontrados: noEncontrados,
        detallesErrores: errores
      };

    } catch (err) {
      await conn.rollback();
      console.error('❌ Error actualizando resultados desde proyecto:', err);
      return { success: false, error: err };
    } finally {
      conn.release();
    }
  },

  async actualizarFasesResultados(fases: FaseResultado[], idPrograma: number) {
    const conn = await pool.getConnection();

    try {
      let actualizadas = 0;
      let noEncontradas: string[] = [];

      console.log(`\n🔄 Iniciando actualización de fases para ${fases.length} resultados de aprendizaje...`);
      console.log(`📂 ID Programa: ${idPrograma}`);

      // Helpers locales para comparación más flexible
      function simplify(s: string) {
        return s
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      function levenshtein(a: string, b: string) {
        if (a === b) return 0;
        const al = a.length;
        const bl = b.length;
        if (al === 0) return bl;
        if (bl === 0) return al;
        const matrix: number[][] = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
        for (let i = 0; i <= al; i++) matrix[i][0] = i;
        for (let j = 0; j <= bl; j++) matrix[0][j] = j;
        for (let i = 1; i <= al; i++) {
          for (let j = 1; j <= bl; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + cost
            );
          }
        }
        return matrix[al][bl];
      }

      function similarity(a: string, b: string) {
        const maxLen = Math.max(a.length, b.length);
        if (maxLen === 0) return 1;
        const dist = levenshtein(a, b);
        return 1 - dist / maxLen;
      }

      function tokenOverlap(a: string, b: string) {
        const ta = a.split(' ').filter(Boolean);
        const tb = b.split(' ').filter(Boolean);
        if (ta.length === 0 || tb.length === 0) return 0;
        const setB = new Set(tb);
        const common = ta.filter(t => setB.has(t)).length;
        return common / Math.min(ta.length, tb.length);
      }

      for (const item of fases) {
        // Puede venir como codigo_resultado o como nombre_resultado según el origen
        const rawSearch = String(item.codigo_resultado || item.nombre || item.nombre_resultado || '').trim();
        const fase = (item.fase || '').trim().toLowerCase();

        if (!rawSearch || !fase) {
          console.log(`   ⚠️ Datos incompletos - Búsqueda: '${rawSearch}', Fase: '${fase}'`);
          continue;
        }

        const searchNorm = simplify(rawSearch);

        try {
          const [todos]: any = await conn.query(`
          SELECT r.id_resultado, r.nombre_resultado,
                 c.codigo_competencia, c.nombre_competencia, r.fase_base
          FROM resultado_de_aprendizaje r
          INNER JOIN competencias c ON r.id_competencia = c.id_competencia
          WHERE c.id_programa = ?
        `, [idPrograma]);

          let mejor = null;
          let mejorScore = 0;

          for (const row of todos) {
            const nombre = String(row.nombre_resultado || '').trim();
            if (!nombre) continue;
            const nombreNorm = simplify(nombre);

            if (!nombreNorm) continue;

            // Coincidencia exacta
            if (nombreNorm === searchNorm) {
              mejor = row;
              mejorScore = 1;
              break;
            }

            // Token overlap y similitud Levenshtein
            const overlap = tokenOverlap(nombreNorm, searchNorm);
            const sim = similarity(nombreNorm, searchNorm);
            const score = Math.max(overlap, sim);

            if (score > mejorScore) {
              mejorScore = score;
              mejor = row;
            }
          }

          // Si la mejor coincidencia tiene score suficiente la aceptamos
          if (!mejor || mejorScore < 0.6) {
            // Intentar fallback con LIKE usando el raw
            const [existentesLike]: any = await conn.query(`
            SELECT r.id_resultado, r.nombre_resultado, c.codigo_competencia, c.nombre_competencia, r.fase_base
            FROM resultado_de_aprendizaje r
            INNER JOIN competencias c ON r.id_competencia = c.id_competencia
            WHERE c.id_programa = ? AND r.nombre_resultado LIKE ?
          `, [idPrograma, `%${rawSearch}%`]);
            if (existentesLike && existentesLike.length > 0) {
              mejor = existentesLike[0];
              mejorScore = 0.5;
            }
          }

          if (!mejor) {
            noEncontradas.push(rawSearch);
            console.log(`   ⚠️ Resultado '${rawSearch}' NO encontrado en programa ${idPrograma} (mejorScore=${mejorScore.toFixed(2)})`);
            continue;
          }

          // Actualizar la fase
          const [updateResult]: any = await conn.query(`
          UPDATE resultado_de_aprendizaje 
          SET fase_base = ?, fase_vista = ?
          WHERE id_resultado = ?
        `, [fase, fase, mejor.id_resultado]);

          if (updateResult.affectedRows > 0) {
            actualizadas++;
            console.log(`   ✅ [${actualizadas}/${fases.length}] Resultado '${rawSearch}' actualizado (score=${mejorScore.toFixed(2)})`);
            console.log(`      Competencia: ${mejor.codigo_competencia} - ${mejor.nombre_competencia?.substring(0, 30)}...`);
            console.log(`      Resultado: ${mejor.nombre_resultado?.substring(0, 50)}...`);
            console.log(`      Fase anterior: ${mejor.fase_base || 'sin fase'} → Nueva fase: ${fase}`);
          }
        } catch (err) {
          console.warn(`   ❌ Error actualizando fase para resultado '${rawSearch}':`, err);
        }
      }

      console.log(`\n📊 Resumen de actualización de fases:`);
      console.log(`   ✅ Actualizadas: ${actualizadas}/${fases.length}`);
      console.log(`   ⚠️ No encontradas: ${noEncontradas.length}`);

      if (noEncontradas.length > 0 && noEncontradas.length <= 10) {
        console.log(`   📋 Resultados no encontrados:`, noEncontradas.join(', '));
      }

      return {
        success: true,
        actualizadas,
        total: fases.length,
        noEncontradas: noEncontradas.length,
        resultadosNoEncontrados: noEncontradas
      };
    } catch (err) {
      console.error('❌ Error actualizando fases de resultados:', err);
      return { success: false, error: err };
    } finally {
      conn.release();
    }
  },

  async actualizarInfoProyecto(info: ProyectoInfo, idPrograma: number) {
    const conn = await pool.getConnection();

    try {
      // Si no se extrajo información del PDF, no intentar insertar (evita errores FK)
      if (!info || (!info.codigo_proyecto_sofia && !info.nombre_proyecto && !info.tiempo_ejecucion_meses)) {
        return {
          success: true,
          proyectoInfo: info
        };
      }

      // Convertir a minúsculas
      const codigoProyecto = (info.codigo_proyecto_sofia || "").toLowerCase();
      const nombreProyecto = (info.nombre_proyecto || "").toLowerCase();
      const tiempoMeses = info.tiempo_ejecucion_meses
        ? (typeof info.tiempo_ejecucion_meses === 'number'
          ? info.tiempo_ejecucion_meses
          : parseInt(String(info.tiempo_ejecucion_meses)))
        : null;


      // Actualizar en la tabla de programas (o donde guardes esta info)
      const sql = `
      INSERT INTO proyecto_formativo (
        codigo_proyecto, nombre_proyecto, tiempo_de_ejecucion, id_programa
      ) VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nombre_proyecto = VALUES(nombre_proyecto),
        tiempo_de_ejecucion = VALUES(tiempo_de_ejecucion),
        id_programa = VALUES(id_programa)
    `;

      await conn.query(sql, [
        codigoProyecto,
        nombreProyecto,
        tiempoMeses,
        idPrograma
      ]);

      return {
        success: true,
        proyectoInfo: {
          codigo_proyecto_sofia: codigoProyecto,
          nombre_proyecto: nombreProyecto,
          tiempo_ejecucion_meses: tiempoMeses
        }
      };

    } catch (err) {
      console.error("❌ Error actualizando información del proyecto:", err);
      return { success: false, error: err };
    } finally {
      conn.release();
    }
  },

  async guardarProgramaFormativo(info: any) {
    const conn = await pool.getConnection();

    // ✅ Función de conversión de fecha inicio (DATE)
    function convertirFechaDDMMYYYYaYYYYMMDD(fecha: string | null) {
      if (!fecha) return null;

      // Si ya viene en formato YYYY-MM-DD, no la convertimos
      if (fecha.includes("-") && fecha.match(/^\d{4}-\d{2}-\d{2}/)) return fecha;

      // Intentar parsear DD/MM/YYYY
      const match = fecha.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (match) {
        const [, dia, mes, anio] = match;
        const anioCompleto = anio.length === 2 ? `20${anio}` : anio;
        return `${anioCompleto}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      }

      return null;
    }

    try {
      const codigoPrograma = info.codigo_programa || null;
      const nombrePrograma = info.nombre_programa || info.denominacion_programa || null;
      const tituloObtenido = info.titulo_obtenido || info.titulo_certificado || null;
      const tipoPrograma = info.tipo_programa || null;
      const version = info.version || info.version_programa || null;
      const duracionTotal = info.duracion_total_programa || info.duracion_total_horas || 0;
      const duracionLectiva = info.duracion_etapa_lectiva || info.etapa_lectiva_horas || null;
      const duracionProductiva = info.duracion_etapa_productiva || info.etapa_productiva_horas || null;

      // 🔥 Convertir fecha_inicio a formato DATE (YYYY-MM-DD)
      const fecha_inicio_mysql = convertirFechaDDMMYYYYaYYYYMMDD(info.fecha_inicio);

      // fecha_fin es VARCHAR, puede ser "vigente" u otra cadena, NO convertir
      const fecha_fin_mysql = info.fecha_fin || null;

      const sql = `
      INSERT INTO programa_formativo (
        codigo_programa, nombre_programa, titulo_obtenido, tipo_programa, version,
        duracion_total_programa, duracion_etapa_lectiva, duracion_etapa_productiva,
        fecha_inicio, fecha_fin
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

      console.log('🔎 guardarProgramaFormativo - parámetros:', {
        codigoPrograma,
        nombrePrograma,
        tituloObtenido,
        tipoPrograma,
        version,
        duracionTotal,
        duracionLectiva,
        duracionProductiva,
        fecha_inicio: fecha_inicio_mysql,
        fecha_fin: fecha_fin_mysql
      });

      const [res]: any = await conn.query(sql, [
        codigoPrograma,
        nombrePrograma,
        tituloObtenido,
        tipoPrograma,
        version,
        duracionTotal,
        duracionLectiva,
        duracionProductiva,
        fecha_inicio_mysql,
        fecha_fin_mysql
      ]);

      console.log('🔁 Resultado upsert programa_formativo:', res);

      // Intentar obtener el id_programa de forma determinista
      try {
        let idProgram: number | null = null;

        // 1) Si la inserción creó una fila nueva, usar insertId
        if (res && typeof res.insertId === 'number' && res.insertId > 0) {
          idProgram = res.insertId;
        }

        // 2) Si no hay insertId (posible ON DUPLICATE UPDATE), buscar por código si existe
        if (!idProgram && codigoPrograma) {
          const [rows]: any = await conn.query(`SELECT id_programa FROM programa_formativo WHERE codigo_programa = ? LIMIT 1`, [codigoPrograma]);
          if (rows && rows.length > 0) {
            idProgram = rows[0].id_programa;
            console.log('🔍 Encontrado id_programa por codigo_programa =', idProgram);
          } else {
            console.log('ℹ️ No se encontró id_programa por codigo_programa');
          }
        }

        // 3) Si aún no hay id, intentar buscar por nombre
        if (!idProgram && nombrePrograma) {
          const [rows2]: any = await conn.query(`SELECT id_programa FROM programa_formativo WHERE nombre_programa = ? LIMIT 1`, [nombrePrograma]);
          if (rows2 && rows2.length > 0) {
            idProgram = rows2[0].id_programa;
            console.log('🔍 Encontrado id_programa por nombre_programa =', idProgram);
          } else {
            console.log('ℹ️ No se encontró id_programa por nombre_programa');
          }
        }

        // 4) Si todavía no hay id_programa, intentar crear un registro mínimo (INSERT IGNORE)
        if (!idProgram) {
          try {
            if (codigoPrograma || nombrePrograma) {
              const insertMinSql = `INSERT IGNORE INTO programa_formativo (codigo_programa, nombre_programa, duracion_total_programa) VALUES (?, ?, ?)`;
              console.log('🔧 Insertando registro mínimo de programa_formativo con:', { codigoPrograma, nombrePrograma });
              const [minRes]: any = await conn.query(insertMinSql, [codigoPrograma || null, nombrePrograma || null, 0]);
              console.log('🔁 Resultado insert minimal:', minRes);

              // Buscar el id nuevamente
              if (codigoPrograma) {
                const [rows3]: any = await conn.query(`SELECT id_programa FROM programa_formativo WHERE codigo_programa = ? LIMIT 1`, [codigoPrograma]);
                if (rows3 && rows3.length > 0) idProgram = rows3[0].id_programa;
              }

              if (!idProgram && nombrePrograma) {
                const [rows4]: any = await conn.query(`SELECT id_programa FROM programa_formativo WHERE nombre_programa = ? LIMIT 1`, [nombrePrograma]);
                if (rows4 && rows4.length > 0) idProgram = rows4[0].id_programa;
              }
            }
          } catch (err) {
            console.warn('⚠️ No se pudo insertar registro mínimo de programa_formativo:', err);
          }
        }

        return { success: true, id_programa: idProgram };
      } catch (err) {
        console.warn('⚠️ No se pudo determinar id_programa tras insertar/actualizar programa:', err);
        return { success: true };
      }

    } catch (err) {
      console.error("❌ Error guardando programa_formativo:", err);
      return { success: false, error: err };
    } finally {
      conn.release();
    }
  },

  // Actualiza fases para competencias usando el código de competencia
  async actualizarFasesCompetencias(fases: FaseCompetencia[], idPrograma: number) {
    const conn = await pool.getConnection();

    try {
      let actualizadas = 0;
      let noEncontradas: string[] = [];

      console.log(`\n🔄 Iniciando actualización de fases para ${fases.length} competencias...`);
      console.log(`📂 ID Programa: ${idPrograma}`);

      for (const item of fases) {
        const codigoCompetencia = (item.codigo_competencia || '').toLowerCase().trim();
        const fase = (item.fase || '').trim().toLowerCase();

        if (!codigoCompetencia || !fase) {
          console.log(`   ⚠️ Datos incompletos - Código: '${codigoCompetencia}', Fase: '${fase}'`);
          continue;
        }

        try {
          const [rows]: any = await conn.query(`SELECT id_competencia, codigo_competencia, nombre_competencia FROM competencias WHERE id_programa = ? AND LOWER(codigo_competencia) = ? LIMIT 1`, [idPrograma, codigoCompetencia]);

          if (!rows || rows.length === 0) {
            noEncontradas.push(codigoCompetencia);
            console.log(`   ⚠️ Competencia ${codigoCompetencia} NO encontrada en programa ${idPrograma}`);
            continue;
          }

          const comp = rows[0];
          const [updateRes]: any = await conn.query(`UPDATE resultados_de_aprendizaje SET fase_base = ?, fase_vista = ? WHERE id_competencia = ?`, [fase, fase, comp.id_competencia]);

          if (updateRes.affectedRows > 0) {
            actualizadas++;
            console.log(`   ✅ [${actualizadas}/${fases.length}] Competencia ${codigoCompetencia} actualizada`);
          }
        } catch (err) {
          console.warn(`   ❌ Error actualizando fase para competencia ${codigoCompetencia}:`, err);
        }
      }

      console.log(`\n📊 Resumen de actualización de fases (competencias):`);
      console.log(`   ✅ Actualizadas: ${actualizadas}/${fases.length}`);
      console.log(`   ⚠️ No encontradas: ${noEncontradas.length}`);

      if (noEncontradas.length > 0 && noEncontradas.length <= 10) {
        console.log(`   📋 Competencias no encontradas:`, noEncontradas.join(', '));
      }

      return {
        success: true,
        actualizadas,
        total: fases.length,
        noEncontradas: noEncontradas.length,
        competenciasNoEncontradas: noEncontradas
      };
    } catch (err) {
      console.error('❌ Error actualizando fases de competencias:', err);
      return { success: false, error: err };
    } finally {
      conn.release();
    }
  }
};