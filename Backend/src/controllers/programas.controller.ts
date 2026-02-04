import { Request, Response } from 'express';
import programasService from '../services/programas.service';

/**
 * GET /api/programas
 * Obtener todos los programas formativos
 */
export async function getAllProgramas(req: Request, res: Response) {
    try {
        const programas = await programasService.getAllProgramas();
        res.json({ success: true, data: programas });
    } catch (error: any) {
        console.error('Error al obtener programas:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/programas/:id
 * Obtener un programa por ID
 */
export async function getProgramaById(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const programa = await programasService.getProgramaById(parseInt(id));

        if (!programa) {
            return res.status(404).json({ success: false, error: 'Programa no encontrado' });
        }

        res.json({ success: true, data: programa });
    } catch (error: any) {
        console.error('Error al obtener programa:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * GET /api/programas/:id/competencias
 * Obtener competencias de un programa
 */
export async function getCompetenciasByPrograma(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const competencias = await programasService.getCompetenciasByPrograma(parseInt(id));

        res.json({ success: true, data: competencias });
    } catch (error: any) {
        console.error('Error al obtener competencias:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * POST /api/programas
 * Crear un nuevo programa formativo
 */
export async function createPrograma(req: Request, res: Response) {
    try {
        const user = (req as any).user;

        // Solo SuperUsuario puede crear programas
        if (user?.rol !== 'SuperUsuario') {
            return res.status(403).json({
                success: false,
                error: 'No autorizado. Solo SuperUsuario puede crear programas'
            });
        }

        const programaData = req.body;

        if (!programaData.codigo_programa || !programaData.nombre_programa || !programaData.titulo_obtenido) {
            return res.status(400).json({
                success: false,
                error: 'Faltan campos requeridos: codigo_programa, nombre_programa, titulo_obtenido'
            });
        }

        const id = await programasService.createPrograma(programaData);

        res.status(201).json({
            success: true,
            data: { id_programa: id },
            message: 'Programa creado exitosamente'
        });
    } catch (error: any) {
        console.error('Error al crear programa:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: 'Ya existe un programa con ese código'
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * PUT /api/programas/:id
 * Actualizar un programa
 */
export async function updatePrograma(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const { id } = req.params;

        if (user?.rol !== 'SuperUsuario') {
            return res.status(403).json({ success: false, error: 'No autorizado' });
        }

        await programasService.updatePrograma(parseInt(id), req.body);

        res.json({ success: true, message: 'Programa actualizado exitosamente' });
    } catch (error: any) {
        console.error('Error al actualizar programa:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

/**
 * DELETE /api/programas/:id
 * Eliminar un programa
 */
export async function deletePrograma(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const { id } = req.params;

        if (user?.rol !== 'SuperUsuario') {
            return res.status(403).json({ success: false, error: 'No autorizado' });
        }

        await programasService.deletePrograma(parseInt(id));

        res.json({ success: true, message: 'Programa eliminado exitosamente' });
    } catch (error: any) {
        console.error('Error al eliminar programa:', error);

        if (error.message.includes('fichas asociadas')) {
            return res.status(400).json({ success: false, error: error.message });
        }

        res.status(500).json({ success: false, error: error.message });
    }
}

export default {
    getAllProgramas,
    getProgramaById,
    getCompetenciasByPrograma,
    createPrograma,
    updatePrograma,
    deletePrograma
};
