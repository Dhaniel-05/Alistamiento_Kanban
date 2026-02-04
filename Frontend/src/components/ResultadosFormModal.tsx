import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiService } from '../../services/api';
import type { ResultadoAprendizaje, Usuario } from '../types';

interface ResultadosFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    resultadoToEdit?: ResultadoAprendizaje | null;
    onSuccess: () => void;
}

export function ResultadosFormModal({
    open,
    onOpenChange,
    resultadoToEdit,
    onSuccess
}: ResultadosFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [instructores, setInstructores] = useState<Usuario[]>([]);

    // Form state
    const [nombre, setNombre] = useState('');
    const [competenciaId, setCompetenciaId] = useState<string>('');

    // Load initial data
    useEffect(() => {
        if (open) {
            loadDependencies();
            if (resultadoToEdit) {
                setNombre(resultadoToEdit.nombre || '');
                setCompetenciaId(resultadoToEdit.competencia_id?.toString() || '');
            } else {
                resetForm();
            }
        }
    }, [open, resultadoToEdit]);

    const resetForm = () => {
        setNombre('');
        setCompetenciaId('');
    };

    const loadDependencies = async () => {
        try {
            const usersResp = await apiService.getUsuarios();
            if (usersResp.success && usersResp.data) {
                setInstructores(usersResp.data.filter(u => u.rol === 'Instructor' || u.rol === 'SuperUsuario'));
            }
        } catch (error) {
            console.error('Error loading dependencies:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                nombre,
                idCompetencia: parseInt(competenciaId),
            };

            if (resultadoToEdit) {
                // Update general info
                await apiService.updateResultado(resultadoToEdit.id, {
                    nombre,
                    id_competencia: parseInt(competenciaId)
                });

            } else {
                // Create
                await apiService.createResultado(payload);
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving resultado:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{resultadoToEdit ? 'Editar Resultado' : 'Nuevo Resultado'}</DialogTitle>
                    <DialogDescription>
                        {resultadoToEdit ? 'Modifica los datos del resultado de aprendizaje' : 'Completa los campos para crear un nuevo resultado de aprendizaje'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Resultado</Label>
                        <Input
                            id="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Analizar requisitos del cliente..."
                            required
                        />
                    </div>

                    {/* Campos de horas/estado/instructor eliminados porque ya no existen en el modelo */}

                    <div className="space-y-2">
                        <Label htmlFor="competencia">ID Competencia (Temporal)</Label>
                        <Input
                            id="competencia"
                            type="number"
                            value={competenciaId}
                            onChange={(e) => setCompetenciaId(e.target.value)}
                            placeholder="ID de la competencia"
                            required
                        />
                        <p className="text-xs text-gray-500">
                            * En el futuro implementaremos un buscador de competencias
                        </p>
                    </div>

                    {/* La asignación de instructor se realiza desde el panel de instructores o la tarjeta de resultado. */}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-[#39A900] hover:bg-[#2E7D32]" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
