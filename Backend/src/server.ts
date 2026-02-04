/**
 * Servidor Express principal
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';

// Importar rutas
import fichasRoutes from './routes/fichas.routes.js';
import competenciasRoutes from './routes/competencias.routes.js';
import resultadosRoutes from './routes/resultados.routes.js';
import fasesRoutes from './routes/fases.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
import authRoutes from './routes/auth.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import programasRoutes from './routes/programas.routes.js';
import proyectosRoutes from './routes/proyectos.routes.js';
import asignacionesRoutes from './routes/asignaciones.routes.js';
import actasRoutes from './routes/actas.routes.js';
import planeacionRoutes from './routes/planeacion.routes.js';

dotenv.config();

const app: express.Application = express();
const PORT = Number(process.env.PORT) || 3000;

// ============================================================
// MIDDLEWARES - ⚠️ EL ORDEN ES CRÍTICO
// ============================================================

// 1️⃣ CORS primero
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2️⃣ Logging ANTES de las rutas para ver todas las peticiones
app.use((req, res, next) => {
  console.log(`\\n=== ${new Date().toISOString()} ===`);
  console.log(`${req.method} ${req.path}`);
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Body keys:', req.body ? Object.keys(req.body) : 'sin body');
  next();
});

// 3️⃣ Rutas de PDF ANTES de express.json() (porque usa multer)
app.use('/api/pdf', pdfRoutes);

// 4️⃣ Ahora sí los parsers de body para otras rutas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// RUTAS
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SENA Alistamiento API está funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/fichas', fichasRoutes);
app.use('/api/competencias', competenciasRoutes);
app.use('/api/resultados', resultadosRoutes);
app.use('/api/fases', fasesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/programas', programasRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/asignaciones', asignacionesRoutes);
app.use('/api/actas', actasRoutes);
app.use('/api/planeacion', planeacionRoutes);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada'
  });
});

// ============================================================
// MANEJO DE ERRORES GLOBAL
// ============================================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================

async function startServer() {
  try {
    // Verificar conexión a la base de datos
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('❌ No se pudo conectar a la base de datos');
      process.exit(1);
    }
    // Iniciar servidor y manejar errores del socket (p.ej. EADDRINUSE)
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════════╗');
      console.log('║   🚀 SENA Alistamiento API                      ║');
      console.log('╟──────────────────────────────────────────────────╢');
      console.log(`║   Servidor: http://localhost:${PORT}              ║`);
      console.log(`║   Entorno:  ${process.env.NODE_ENV || 'development'}                   ║`);
      console.log(`║   Database: ${process.env.DB_NAME}          ║`);
      console.log('╚══════════════════════════════════════════════════╝');
      console.log('');
      console.log('📚 Endpoints disponibles:');
      console.log('   GET  /health');
      console.log('   GET  /api/fichas');
      console.log('   GET  /api/fichas/:id/competencias');
      console.log('   GET  /api/fichas/:id/resultados');
      console.log('   PUT  /api/competencias/:id/fase');
      console.log('   PUT  /api/resultados/:id/fase');
      console.log('   GET  /api/fases');
      console.log('   POST /api/pdf/importar');
      console.log('   POST /api/pdf/upload');
      console.log('   GET  /api/programas');
      console.log('');
    });

    server.on('error', (err: any) => {
      console.error('❌ Error en el servidor HTTP:', err);
      if (err && err.code === 'EADDRINUSE') {
        console.error(`El puerto ${PORT} está en uso. Cambia el puerto o cierra el proceso que lo usa.`);
      }
      // Si quieres terminar en caso de error crítico, descomenta la siguiente línea
      // process.exit(1);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\\nSIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

// Manejo global para errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

// Iniciar
startServer();

export default app;