import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { apiService } from '../../services/api';

interface CompetenciaFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    idPrograma: number;
    onSuccess: () => void;
}

export function CompetenciaFormModalPrograma({
    open,
    onOpenChange,
    idPrograma,
    onSuccess
}: CompetenciaFormModalProps) {
    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        horas: '',
        normaCompetencia: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) {
            // Reset form when modal closes
            setFormData({
                codigo: '',
                nombre: '',
                horas: '',
                normaCompetencia: ''
            });
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.codigo || !formData.nombre || !formData.horas) {
            alert('Por favor complete los campos obligatorios');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                codigo: formData.codigo,
                nombre: formData.nombre,
                horas: parseInt(formData.horas),
                idPrograma: idPrograma,
                normaCompetencia: formData.normaCompetencia || null,
                idFicha: null // Explicitly set to null for program-level competencia
            };

            const resp = await apiService.createCompetencia(payload);

            if (resp.success) {
                onSuccess();
                onOpenChange(false);
            } else {
                alert('Error al crear competencia: ' + (resp.error || ''));
            }
        } catch (error) {
            console.error('Error creating competencia:', error);
            alert('Error al crear la competencia');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nueva Competencia</DialogTitle>
                    <DialogDescription>
                        Crear una nueva competencia para este programa (sin asociarla a una ficha específica)
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="codigo">Código de Competencia *</Label>
                            <Input
                                id="codigo"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                placeholder="Ej: 220501001"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="nombre">Nombre de Competencia *</Label>
                            <Input
                                id="nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Implementar la estructura de la base de datos"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="horas">Duración (horas) *</Label>
                            <Input
                                id="horas"
                                type="number"
                                value={formData.horas}
                                onChange={(e) => setFormData({ ...formData, horas: e.target.value })}
                                placeholder="Ej: 320"
                                min="0"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="normaCompetencia">Norma de Competencia</Label>
                            <Textarea
                                id="normaCompetencia"
                                rows={3}
                                value={formData.normaCompetencia}
                                onChange={(e) => setFormData({ ...formData, normaCompetencia: e.target.value })}
                                placeholder="Opcional: Descripción de la norma"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#2E7D32] hover:bg-[#1B5E20]"
                            disabled={loading}
                        >
                            {loading ? 'Creando...' : 'Crear Competencia'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
