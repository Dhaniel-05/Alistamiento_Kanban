import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PdfServices } from "../services/pdf.service";

interface ProcessResult {
  success: boolean;
  error?: string;
  details?: string;
  insertedCompetencias?: number;
  insertedResultados?: number;
  proyectoInfo?: any;
}

// ⚙️ Solución para __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PdfController = {
  /**
   * 📤 Endpoint principal: recibe PDF, lo procesa e inserta en DB
   */
  async uploadAndProcess(req: Request, res: Response) {
    try {
      // Verificar que se subió un archivo
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No se recibió ningún archivo PDF"
        });
      }

      console.log("📄 Archivo recibido:", req.file.originalname);
      console.log("📂 Guardado en:", req.file.path);

      // Obtener id_ficha del body o query (opcional - se crea automáticamente si no se proporciona)
      const idFicha = req.body.id_ficha || req.query.id_ficha;
      
      console.log("🆔 ID Ficha:", idFicha || "No proporcionado (se creará automáticamente)");

      // Procesar el PDF (idFicha es opcional)
      const result = await PdfServices.procesarPDFSubido(req.file.path, 1, idFicha ? Number(idFicha) : undefined);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || "Error desconocido",
          details: (result as any).details || "Sin detalles"
        });
      }

      // Respuesta exitosa - Extraer los valores con type assertion
      const { insertedCompetencias = 0, insertedResultados = 0 } = result as {
        success: boolean;
        insertedCompetencias?: number;
        insertedResultados?: number;
      };

      res.json({
        success: true,
        message: "✅ PDF procesado e insertado correctamente",
        total_registros: insertedCompetencias,
        resultados_aprendizaje: insertedResultados,
        archivo_procesado: req.file.originalname,
        id_ficha: (result as any).id_ficha || idFicha // Devolver el id_ficha creado o usado
      });

    } catch (err) {
      console.error("❌ Error en uploadAndProcess:", err);
      res.status(500).json({
        success: false,
        error: "Error al procesar el archivo",
        details: String(err)
      });
    }
  },
  async uploadProjectPDF(req: Request, res: Response) {
    try {
      console.log("🎯 uploadProjectPDF llamado");
      console.log("📋 req.file:", req.file);
      console.log("📋 req.body:", req.body);

      // Verificar que se subió un archivo
      if (!req.file) {
        console.error("❌ No se recibió archivo de proyecto");
        return res.status(400).json({
          success: false,
          error: "No se recibió ningún archivo PDF de proyecto"
        });
      }

      // Obtener el ID del programa desde el body o query
      const idPrograma = req.body.id_programa || req.query.id_programa || 1;

      console.log("📄 Archivo de proyecto recibido:", req.file.originalname);
      console.log("📂 Guardado en:", req.file.path);
      console.log("🆔 ID Programa:", idPrograma);

      // Procesar el PDF de proyecto
      const result = await PdfServices.procesarPDFProyecto(req.file.path, Number(idPrograma));

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || "Error desconocido",
          details: (result as any).details || "Sin detalles"
        });
      }

      // Respuesta exitosa
      res.json({
        success: true,
        message: "✅ PDF de proyecto procesado correctamente",
        proyecto_info: (result as ProcessResult).proyectoInfo,
        archivo_procesado: req.file.originalname
      });

    } catch (err) {
      console.error("❌ Error en uploadProjectPDF:", err);
      res.status(500).json({
        success: false,
        error: "Error al procesar el archivo de proyecto",
        details: String(err)
      });
    }
  },

  /**
   * 📥 Endpoint alternativo: importar desde JSON ya generado
   */
  async importarDesdeJSON(req: Request, res: Response) {
    try {
      console.log("🚀 Importando desde JSON existente...");

      const jsonPath = path.resolve(__dirname, "../../python/output.json");
      console.log("📂 Buscando JSON en:", jsonPath);

      if (!fs.existsSync(jsonPath)) {
        return res.status(404).json({
          success: false,
          error: "Archivo JSON no encontrado",
          path: jsonPath
        });
      }

      const rawData = fs.readFileSync(jsonPath, "utf-8");
      const competencias = JSON.parse(rawData);

      if (!Array.isArray(competencias)) {
        return res.status(400).json({
          success: false,
          error: "El JSON no contiene un arreglo de competencias"
        });
      }

      console.log(`📊 Se encontraron ${competencias.length} competencias`);

      // Obtener id_ficha del body o query (opcional - se crea automáticamente si no se proporciona)
      const idFicha = req.body.id_ficha || req.query.id_ficha;
      
      console.log("🆔 ID Ficha:", idFicha || "No proporcionado (se creará automáticamente)");

      const result = await PdfServices.insertarCompetencias(competencias, 1, idFicha ? Number(idFicha) : undefined);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: "Error al insertar competencias",
          details: result.error
        });
      }

      res.json({
        ...result,
        message: "✅ Competencias importadas correctamente"
      });

    } catch (err) {
      console.error("❌ Error en importarDesdeJSON:", err);
      res.status(500).json({
        success: false,
        error: "Error al procesar el archivo",
        details: String(err)
      });
    }
  },
};