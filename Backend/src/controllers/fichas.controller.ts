import { Request, Response } from 'express';
import fichasService from '../services/fichas.service';

/**
 * GET /api/fichas
 * Obtener todas las fichas
 */
export async function getAllFichas(req: Request, res: Response) {
    try {
        const fichas = await fichasService.getAllFichas();
        res.json({ success: true, data: fichas });
    } catch (error: any) {
        console.error('Error al obtener fichas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/fichas/:id
 * Obtener una ficha por ID
 */
export async function getFichaById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const ficha = await fichasService.getFichaById(parseInt(id));

        if (!ficha) {
            return res.status(404).json({ success: false, error: 'Ficha no encontrada' });
        }

        res.json({ success: true, data: ficha });
    } catch (error: any) {
        console.error('Error al obtener ficha:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/fichas
 * Crear una nueva ficha
 */
export async function createFicha(req: Request, res: Response) {
    try {
        const fichaData = req.body;

        // Validaciones
        if (!fichaData.codigo_ficha || !fichaData.nombre_ficha || !fichaData.id_programa) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: codigo_ficha, nombre_ficha, id_programa'
            });
        }

        if (!['Diurna', 'Nocturna'].includes(fichaData.jornada)) {
            return res.status(400).json({
                success: false,
                error: 'Jornada debe ser Diurna o Nocturna'
            });
        }

        const id_ficha = await fichasService.createFicha(fichaData);

        res.status(201).json({
            success: true,
            data: { id_ficha },
            message: 'Ficha creada exitosamente con sus competencias y resultados'
        });
    } catch (error: any) {
        console.error('Error al crear ficha:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: 'Ya existe una ficha con ese código'
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * PUT /api/fichas/:id
 * Actualizar una ficha
 */
export async function updateFicha(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const fichaData = req.body;

        await fichasService.updateFicha(parseInt(id), fichaData);

        res.json({
            success: true,
            message: 'Ficha actualizada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al actualizar ficha:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * DELETE /api/fichas/:id
 * Eliminar una ficha
 */
export async function deleteFicha(req: Request, res: Response) {
    try {
        const { id } = req.params;

        await fichasService.deleteFicha(parseInt(id));

        res.json({
            success: true,
            message: 'Ficha eliminada exitosamente'
        });
    } catch (error: any) {
        console.error('Error al eliminar ficha:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/fichas/:id/resultados
 * Obtener resultados de una ficha
 */
export async function getResultadosByFicha(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const resultados = await fichasService.getResultadosByFicha(parseInt(id));

        res.json({ success: true, data: resultados });
    } catch (error: any) {
        console.error('Error al obtener resultados:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/fichas/:id/fases
 * Obtener fases de una ficha
 */
export async function getFasesByFicha(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const fases = await fichasService.getFasesByFicha(parseInt(id));

        res.json({ success: true, data: fases });
    } catch (error: any) {
        console.error('Error al obtener fases:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/fichas/:id/progreso
 * Obtener progreso de una ficha
 */
export async function getProgresoFicha(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const progreso = await fichasService.getProgresoFicha(parseInt(id));

        res.json({ success: true, data: progreso });
    } catch (error: any) {
        console.error('Error al obtener progreso:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getAllFichas,
    getFichaById,
    createFicha,
    updateFicha,
    deleteFicha,
    getResultadosByFicha,
    getFasesByFicha,
    getProgresoFicha
};
