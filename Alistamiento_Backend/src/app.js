// src/app.js - VERSIÓN COMPLETA Y FUNCIONAL
const config = require('./config/env');
const {
  PLANEACIONES_LIMIT,
  DEFAULT_LIMIT,
  isPlaneacionesApiPath,
} = require('./config/bodyLimits');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const validarToken = require('./middleware/validarToken');

const app = express();

const jsonPlaneaciones = express.json({ limit: PLANEACIONES_LIMIT });
const urlencodedPlaneaciones = express.urlencoded({
  extended: true,
  limit: PLANEACIONES_LIMIT,
});
const jsonDefault = express.json({ limit: DEFAULT_LIMIT });
const urlencodedDefault = express.urlencoded({
  extended: true,
  limit: DEFAULT_LIMIT,
});

/** Aplica json 1mb a todas las rutas excepto /api/planeaciones (límite 20mb arriba). */
function applyDefaultJsonParser(req, res, next) {
  if (isPlaneacionesApiPath(req)) {
    return next();
  }
  return jsonDefault(req, res, next);
}

/** Aplica urlencoded 1mb a todas las rutas excepto /api/planeaciones. */
function applyDefaultUrlencodedParser(req, res, next) {
  if (isPlaneacionesApiPath(req)) {
    return next();
  }
  return urlencodedDefault(req, res, next);
}

app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));

app.use('/api/planeaciones', jsonPlaneaciones);
app.use('/api/planeaciones', urlencodedPlaneaciones);

app.use(applyDefaultJsonParser);
app.use(applyDefaultUrlencodedParser);

app.get('/api/health', (req, res) => {
  res.json({
    message: '✅ Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    status: 'OK',
  });
});

// Rutas públicas (sin JWT)
app.use('/api/auth', require('./routes/auth.routes'));

// Resto de /api exige token
app.use('/api', validarToken);

app.use('/api/fases-configuracion', require('./routes/fasesConfiguracion.routes'));
app.use('/api/fichas', require('./routes/fichas.routes'));
app.use('/api/programas', require('./routes/programas.routes'));
app.use('/api/instructores', require('./routes/instructor.routes'));
app.use('/api', require('./routes/sabana.routes'));
app.use('/api/permisos', require('./routes/permisos.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/rol-permiso', require('./routes/roles_permisos.routes'));
app.use('/api/pdf', require('./routes/pdf.routes'));
app.use('/api/planeaciones', require('./routes/planeaciones.routes'));

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

app.use(notFound);
app.use(errorHandler);

module.exports = app;
