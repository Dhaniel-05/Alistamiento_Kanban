/**
 * Rutas para Fases Dinámicas
 * Sistema de gestión de fases personalizables por ficha
 */

import { Router } from 'express';
import fasesController from '../controllers/fases.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router: Router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

/**
 * GET /api/fases/configuracion
 * Obtener fases de configuración por jornada
 */
router.get('/configuracion', fasesController.getFasesConfiguracion);

/**
 * POST /api/fases/configuracion
 * Crear fase de configuración (Solo SuperUsuario)
 */
router.post('/configuracion', fasesController.createFaseConfiguracion);

/**
 * GET /api/fases - Mantener compatibilidad con código existente
 * Obtener todas las fases (estados) disponibles
 */
router.get('/', async (req, res) => {
  try {
    // Retornar estados disponibles como fases (compatibilidad)
    const fases = [
      { id: 1, nombre: 'Por Asignar', descripcion: 'Por Asignar' },
      { id: 2, nombre: 'Por Iniciar', descripcion: 'Por Iniciar' },
      { id: 3, nombre: 'En Proceso', descripcion: 'En Proceso' },
      { id: 4, nombre: 'Terminado', descripcion: 'Terminado' }
    ];

    res.json({
      success: true,
      data: fases
    });
  } catch (error) {
    console.error('Error al obtener fases:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener fases'
    });
  }
});

/**
 * GET /api/fases/competencias - Mantener compatibilidad
 * Obtener solo las fases para competencias
 */
router.get('/competencias', async (req, res) => {
  try {
    const fases = [
      { id: 1, nombre: 'Por Iniciar', descripcion: 'Por Iniciar' },
      { id: 2, nombre: 'En Proceso', descripcion: 'En Proceso' },
      { id: 3, nombre: 'Terminado', descripcion: 'Terminado' }
    ];

    res.json({
      success: true,
      data: fases
    });
  } catch (error) {
    console.error('Error al obtener fases de competencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener fases'
    });
  }
});

/**
 * GET /api/fases/resultados - Mantener compatibilidad
 * Obtener solo las fases para resultados de aprendizaje
 */
router.get('/resultados', async (req, res) => {
  try {
    const fases = [
      { id: 1, nombre: 'Por Asignar', descripcion: 'Por Asignar' },
      { id: 2, nombre: 'Por Iniciar', descripcion: 'Por Iniciar' },
      { id: 3, nombre: 'En Proceso', descripcion: 'En Proceso' },
      { id: 4, nombre: 'Terminado', descripcion: 'Terminado' }
    ];

    res.json({
      success: true,
      data: fases
    });
  } catch (error) {
    console.error('Error al obtener fases de resultados:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener fases'
    });
  }
});

export default router;
