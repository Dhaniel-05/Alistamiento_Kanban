import { Router } from "express";
import { PdfController } from "../controllers/pdf.controller";
import multer from "multer";
import path from "path";
import fs from "fs";

const router: Router = Router();

// 📁 Crear carpeta uploads si no existe
const uploadsDir = path.join(process.cwd(), "python", "uploads");
console.log("📂 Carpeta de uploads:", uploadsDir);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Carpeta uploads creada");
}

// 📁 Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("📂 Multer: Guardando en", uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    console.log("📝 Multer: Nombre generado:", uniqueName);
    cb(null, uniqueName);
  },
});


const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log("🔍 Multer: Validando archivo:", file.originalname, "tipo:", file.mimetype);
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF"));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// 📤 Middleware de debug
router.use((req, res, next) => {
  console.log("=== NUEVA REQUEST ===");
  console.log("🔵 Método:", req.method);
  console.log("🔵 Path:", req.path);
  console.log("🔵 Content-Type:", req.headers["content-type"]);
  console.log("🔵 Body keys:", req.body ? Object.keys(req.body) : 'sin body');
  next();
});

// 📤 Ruta con manejo de errores de multer
router.post("/upload", (req, res, next) => {
  console.log("🎯 Entrando a /upload");
  upload.single("pdf")(req, res, (err) => {
    if (err) {
      console.error("❌ Error de multer:", err);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    console.log("✅ Multer procesó correctamente");
    console.log("📦 req.file:", req.file);
    next();
  });
}, PdfController.uploadAndProcess);

// 📤 Ruta para subir PDF de proyecto (segundo documento)
router.post("/upload-project", (req, res, next) => {
  console.log("🎯 Entrando a /upload-project");
  upload.single("pdf")(req, res, (err) => {
    if (err) {
      console.error("❌ Error de multer en proyecto:", err);
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    console.log("✅ Multer procesó PDF de proyecto correctamente");
    console.log("📦 req.file:", req.file);
    next();
  });
}, PdfController.uploadProjectPDF);

// 📥 Ruta antigua
router.post("/importar", PdfController.importarDesdeJSON);

export default router;