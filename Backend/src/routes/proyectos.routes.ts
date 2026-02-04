import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import proyectosController from '../controllers/proyectos.controller';


const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);


// GET /api/proyectos - Obtener todos los proyectos
router.get('/', proyectosController.getAllProyectos);

// GET /api/proyectos/:id - Obtener un proyecto por ID
router.get('/:id', proyectosController.getProyectoById);

// POST /api/proyectos - Crear nuevo proyecto (solo SuperUsuario)
router.post('/', proyectosController.createProyecto);

// PUT /api/proyectos/:id - Actualizar proyecto (solo SuperUsuario)
router.put('/:id', proyectosController.updateProyecto);

// DELETE /api/proyectos/:id - Eliminar proyecto (solo SuperUsuario)
router.delete('/:id', proyectosController.deleteProyecto);

export default router;
