import { Request, Response } from 'express';
import fasesService from '../services/fases.service';

/**
 * GET /api/fases/configuracion
 * Obtener fases de configuración por jornada
 */
export async function getFasesConfiguracion(req: Request, res: Response) {
    try {
        const { jornada } = req.query;

        const fases = await fasesService.getFasesConfiguracion(
            jornada as 'Diurna' | 'Nocturna' | 'Personalizada' | undefined
        );

        res.json({ success: true, data: fases });
    } catch (error: any) {
        console.error('Error al obtener fases de configuración:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/fases/configuracion
 * Crear fase personalizada en configuración (Solo SuperUsuario)
 */
export async function createFaseConfiguracion(req: Request, res: Response) {
    try {
        const user = (req as any).user;

        // Solo SuperUsuario puede crear fases de configuración
        if (user?.rol !== 'SuperUsuario') {
            return res.status(403).json({
                success: false,
                error: 'No autorizado. Solo SuperUsuario puede crear fases de configuración'
            });
        }

        const faseData = req.body;

        if (!faseData.jornada || !faseData.nombre_fase || faseData.orden === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: jornada, nombre_fase, orden'
            });
        }

        const id = await fasesService.createFaseConfiguracion(faseData);

        res.status(201).json({
            success: true,
            data: { id_fase_config: id },
            message: 'Fase de configuración creada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al crear fase de configuración:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/fichas/:id_ficha/fases
 * Agregar fase personalizada a una ficha (Equipo Ejecutor)
 */
export async function addFaseToFicha(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const { id_ficha } = req.params;

        // Solo Equipo Ejecutor y SuperUsuario pueden agregar fases
        if (user?.rol !== 'Equipo Ejecutor' && user?.rol !== 'SuperUsuario') {
            return res.status(403).json({
                success: false,
                error: 'No autorizado. Solo Equipo Ejecutor puede gestionar fases'
            });
        }

        const faseData = req.body;

        if (!faseData.nombre_fase || faseData.orden === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: nombre_fase, orden'
            });
        }

        const id = await fasesService.addFaseToFicha(parseInt(id_ficha), faseData);

        res.status(201).json({
            success: true,
            data: { id_ficha_fase: id },
            message: 'Fase agregada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al agregar fase:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: 'Ya existe una fase con ese nombre en esta ficha'
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * PUT /api/fichas/:id_ficha/fases/:id_fase
 * Actualizar fase de una ficha (Equipo Ejecutor)
 */
export async function updateFaseFicha(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const { id_ficha, id_fase } = req.params;

        if (user?.rol !== 'Equipo Ejecutor' && user?.rol !== 'SuperUsuario') {
            return res.status(403).json({
                success: false,
                error: 'No autorizado'
            });
        }

        const faseData = req.body;

        await fasesService.updateFaseFicha(parseInt(id_ficha), parseInt(id_fase), faseData);

        res.json({
            success: true,
            message: 'Fase actualizada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al actualizar fase:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * DELETE /api/fichas/:id_ficha/fases/:id_fase
 * Eliminar fase de una ficha (Equipo Ejecutor)
 */
export async function deleteFaseFicha(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const { id_ficha, id_fase } = req.params;

        if (user?.rol !== 'Equipo Ejecutor' && user?.rol !== 'SuperUsuario') {
            return res.status(403).json({
                success: false,
                error: 'No autorizado'
            });
        }

        await fasesService.deleteFaseFicha(parseInt(id_ficha), parseInt(id_fase));

        res.json({
            success: true,
            message: 'Fase eliminada exitosamente. Los resultados fueron movidos a otra fase.'
        });
    } catch (error: any) {
        console.error('Error al eliminar fase:', error);

        if (error.message === 'No se puede eliminar la última fase activa') {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * PATCH /api/fichas/:id_ficha/fases/reorder
 * Reordenar fases de una ficha (Equipo Ejecutor)
 */
export async function reorderFasesFicha(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const { id_ficha } = req.params;
        const { fases } = req.body; // Array de { id_ficha_fase, orden }

        if (user?.rol !== 'Equipo Ejecutor' && user?.rol !== 'SuperUsuario') {
            return res.status(403).json({
                success: false,
                error: 'No autorizado'
            });
        }

        if (!Array.isArray(fases)) {
            return res.status(400).json({
                success: false,
                error: 'Se requiere un array de fases con id_ficha_fase y orden'
            });
        }

        await fasesService.reorderFasesFicha(parseInt(id_ficha), fases);

        res.json({
            success: true,
            message: 'Fases reordenadas exitosamente'
        });
    } catch (error: any) {
        console.error('Error al reordenar fases:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getFasesConfiguracion,
    createFaseConfiguracion,
    addFaseToFicha,
    updateFaseFicha,
    deleteFaseFicha,
    reorderFasesFicha
};
