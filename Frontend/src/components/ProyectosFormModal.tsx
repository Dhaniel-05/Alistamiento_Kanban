import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiService } from '../../services/api';
import type { ProyectoFormativo, ProgramaFormativo } from '../types';

interface ProyectosFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proyectoToEdit: ProyectoFormativo | null;
    onSuccess: () => void;
}

export function ProyectosFormModal({ open, onOpenChange, proyectoToEdit, onSuccess }: ProyectosFormModalProps) {
    const [programas, setProgramas] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        codigo_proyecto: '',
        nombre_proyecto: '',
        tiempo_de_ejecucion: '',
        info_adicional: '',
        id_programa: '',
    });

    useEffect(() => {
        loadProgramas();
    }, []);

    useEffect(() => {
        if (proyectoToEdit) {
            setFormData({
                codigo_proyecto: proyectoToEdit.codigo_proyecto || '',
                nombre_proyecto: proyectoToEdit.nombre_proyecto || '',
                tiempo_de_ejecucion: proyectoToEdit.tiempo_de_ejecucion?.toString() || '',
                info_adicional: proyectoToEdit.info_adicional || '',
                id_programa: proyectoToEdit.id_programa?.toString() || '',
            });
        } else {
            setFormData({
                codigo_proyecto: '',
                nombre_proyecto: '',
                tiempo_de_ejecucion: '',
                info_adicional: '',
                id_programa: '',
            });
        }
    }, [proyectoToEdit, open]);

    const loadProgramas = async () => {
        try {
            const resp = await apiService.getProgramas();
            if (resp.success && resp.data) {
                setProgramas(resp.data);
            }
        } catch (err) {
            console.error('Error cargando programas:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.codigo_proyecto || !formData.nombre_proyecto || !formData.id_programa) {
            alert('Por favor complete los campos obligatorios');
            return;
        }

        const payload = {
            codigo_proyecto: formData.codigo_proyecto,
            nombre_proyecto: formData.nombre_proyecto,
            tiempo_de_ejecucion: formData.tiempo_de_ejecucion ? Number(formData.tiempo_de_ejecucion) : null,
            info_adicional: formData.info_adicional || null,
            id_programa: Number(formData.id_programa),
        };

        try {
            if (proyectoToEdit) {
                await apiService.updateProyecto(proyectoToEdit.id_proyecto, payload);
            } else {
                await apiService.createProyecto(payload);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error al guardar proyecto:', error);
            alert('Error al guardar el proyecto');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{proyectoToEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}</DialogTitle>
                    <DialogDescription>
                        {proyectoToEdit ? 'Modifica los datos del proyecto formativo' : 'Crea un nuevo proyecto formativo'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="codigo_proyecto">Código del Proyecto *</Label>
                            <Input
                                id="codigo_proyecto"
                                value={formData.codigo_proyecto}
                                onChange={(e) => setFormData({ ...formData, codigo_proyecto: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nombre_proyecto">Nombre del Proyecto *</Label>
                            <Input
                                id="nombre_proyecto"
                                value={formData.nombre_proyecto}
                                onChange={(e) => setFormData({ ...formData, nombre_proyecto: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="id_programa">Programa *</Label>
                            <Select
                                value={formData.id_programa}
                                onValueChange={(value) => setFormData({ ...formData, id_programa: value })}
                                required
                            >
                                <SelectTrigger id="id_programa">
                                    <SelectValue placeholder="Seleccionar programa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {programas.map((programa) => (
                                        <SelectItem key={programa.id_programa || programa.id} value={String(programa.id_programa || programa.id)}>
                                            {programa.codigo_programa || programa.codigo} - {programa.nombre_programa || programa.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="tiempo_de_ejecucion">Tiempo de Ejecución (meses)</Label>
                            <Input
                                id="tiempo_de_ejecucion"
                                type="number"
                                value={formData.tiempo_de_ejecucion}
                                onChange={(e) => setFormData({ ...formData, tiempo_de_ejecucion: e.target.value })}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="info_adicional">Información Adicional</Label>
                            <Textarea
                                id="info_adicional"
                                rows={4}
                                value={formData.info_adicional}
                                onChange={(e) => setFormData({ ...formData, info_adicional: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                            {proyectoToEdit ? 'Actualizar' : 'Crear'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
