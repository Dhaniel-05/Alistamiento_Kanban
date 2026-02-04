import { Request, Response } from 'express';
import proyectosService from '../services/proyectos.service';

/**
 * GET /api/proyectos
 * Obtener todos los proyectos formativos
 */
export async function getAllProyectos(req: Request, res: Response) {
    try {
        const proyectos = await proyectosService.getAllProyectos();
        res.json({ success: true, data: proyectos });
    } catch (error: any) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/proyectos/:id
 * Obtener un proyecto por ID
 */
export async function getProyectoById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const proyecto = await proyectosService.getProyectoById(parseInt(id));

        if (!proyecto) {
            return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
        }

        res.json({ success: true, data: proyecto });
    } catch (error: any) {
        console.error('Error al obtener proyecto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/proyectos
 * Crear un nuevo proyecto formativo
 */
export async function createProyecto(req: Request, res: Response) {
    try {
        const user = (req as any).user;

        // Solo SuperUsuario puede crear proyectos
        if (user?.rol !== 'SuperUsuario') {
            return res.status(403).json({
                success: false,
                error: 'No autorizado. Solo SuperUsuario puede crear proyectos'
            });
        }

        const proyectoData = req.body;

        if (!proyectoData.codigo_proyecto || !proyectoData.nombre_proyecto || !proyectoData.id_programa) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: codigo_proyecto, nombre_proyecto, id_programa'
            });
        }

        const id = await proyectosService.createProyecto(proyectoData);

        res.status(201).json({
            success: true,
            data: { id_proyecto: id },
            message: 'Proyecto creado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al crear proyecto:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: 'Ya existe un proyecto con ese código'
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * PUT /api/proyectos/:id
 * Actualizar un proyecto
 */
export async function updateProyecto(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const { id } = req.params;

        if (user?.rol !== 'SuperUsuario') {
            return res.status(403).json({ success: false, error: 'No autorizado' });
        }

        await proyectosService.updateProyecto(parseInt(id), req.body);

        res.json({ success: true, message: 'Proyecto actualizado exitosamente' });
    } catch (error: any) {
        console.error('Error al actualizar proyecto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * DELETE /api/proyectos/:id
 * Eliminar un proyecto
 */
export async function deleteProyecto(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const { id } = req.params;

        if (user?.rol !== 'SuperUsuario') {
            return res.status(403).json({ success: false, error: 'No autorizado' });
        }

        await proyectosService.deleteProyecto(parseInt(id));

        res.json({ success: true, message: 'Proyecto eliminado exitosamente' });
    } catch (error: any) {
        console.error('Error al eliminar proyecto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getAllProyectos,
    getProyectoById,
    createProyecto,
    updateProyecto,
    deleteProyecto
};
