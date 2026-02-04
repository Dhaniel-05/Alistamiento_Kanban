import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiService } from '../../services/api';

interface ResultadoFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    idPrograma: number;
    onSuccess: () => void;
}

export function ResultadoFormModalPrograma({
    open,
    onOpenChange,
    idPrograma,
    onSuccess
}: ResultadoFormModalProps) {
    const [formData, setFormData] = useState({
        nombre: '',
        idCompetencia: '',
        faseBase: '',
        faseVista: '',
        conocimientosSaber: '',
        conocimientosProceso: '',
        actividadAprendizaje: '',
        evidenciaAprendizaje: ''
    });
    const [competencias, setCompetencias] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadCompetencias();
        } else {
            // Reset form when modal closes
            setFormData({
                nombre: '',
                idCompetencia: '',
                faseBase: '',
                faseVista: '',
                conocimientosSaber: '',
                conocimientosProceso: '',
                actividadAprendizaje: '',
                evidenciaAprendizaje: ''
            });
        }
    }, [open]);

    const loadCompetencias = async () => {
        try {
            // Load all competencias for this program
            const resp = await apiService.getProgramas();
            if (resp.success && resp.data) {
                // Filter competencias by program - need to call competencias endpoint
                const compResp = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/competencias`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const compData = await compResp.json();

                if (compData.success) {
                    // Filter by program
                    const programCompetencias = compData.data.filter((c: any) => c.id_programa === idPrograma);
                    setCompetencias(programCompetencias);
                }
            }
        } catch (error) {
            console.error('Error loading competencias:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nombre || !formData.idCompetencia) {
            alert('Por favor complete los campos obligatorios');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nombre: formData.nombre,
                idCompetencia: parseInt(formData.idCompetencia),
                faseBase: formData.faseBase || null,
                faseVista: formData.faseVista || null,
                conocimientosSaber: formData.conocimientosSaber || null,
                conocimientosProceso: formData.conocimientosProceso || null,
                actividadAprendizaje: formData.actividadAprendizaje || null,
                evidenciaAprendizaje: formData.evidenciaAprendizaje || null,
                idFicha: null // Explicitly set to null for program-level resultado
            };

            const resp = await apiService.createResultado(payload);

            if (resp.success) {
                onSuccess();
                onOpenChange(false);
            } else {
                alert('Error al crear resultado: ' + (resp.error || ''));
            }
        } catch (error) {
            console.error('Error creating resultado:', error);
            alert('Error al crear el resultado de aprendizaje');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nuevo Resultado de Aprendizaje</DialogTitle>
                    <DialogDescription>
                        Crear un nuevo resultado de aprendizaje para este programa (sin asociarlo a una ficha específica)
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nombre">Nombre del Resultado *</Label>
                            <Input
                                id="nombre"
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                placeholder="Ej: Aplicar buenas prácticas de desarrollo..."
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="idCompetencia">Competencia *</Label>
                            <Select
                                value={formData.idCompetencia}
                                onValueChange={(value) => setFormData({ ...formData, idCompetencia: value })}
                                required
                            >
                                <SelectTrigger id="idCompetencia">
                                    <SelectValue placeholder="Seleccionar competencia" />
                                </SelectTrigger>
                                <SelectContent>
                                    {competencias.length === 0 ? (
                                        <SelectItem value="none" disabled>No hay competencias disponibles</SelectItem>
                                    ) : (
                                        competencias.map((comp) => (
                                            <SelectItem key={comp.id} value={String(comp.id)}>
                                                {comp.codigo} - {comp.nombre}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="faseBase">Fase Base</Label>
                                <Select
                                    value={formData.faseBase}
                                    onValueChange={(value) => setFormData({ ...formData, faseBase: value })}
                                >
                                    <SelectTrigger id="faseBase">
                                        <SelectValue placeholder="Seleccionar fase" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin fase</SelectItem>
                                        <SelectItem value="analisis">Análisis</SelectItem>
                                        <SelectItem value="planeacion">Planeación</SelectItem>
                                        <SelectItem value="ejecucion">Ejecución</SelectItem>
                                        <SelectItem value="evaluacion">Evaluación</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="faseVista">Fase Vista</Label>
                                <Select
                                    value={formData.faseVista}
                                    onValueChange={(value) => setFormData({ ...formData, faseVista: value })}
                                >
                                    <SelectTrigger id="faseVista">
                                        <SelectValue placeholder="Seleccionar fase" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Sin fase</SelectItem>
                                        <SelectItem value="analisis">Análisis</SelectItem>
                                        <SelectItem value="planeacion">Planeación</SelectItem>
                                        <SelectItem value="ejecucion">Ejecución</SelectItem>
                                        <SelectItem value="evaluacion">Evaluación</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="conocimientosSaber">Conocimientos de Saber</Label>
                            <Textarea
                                id="conocimientosSaber"
                                rows={2}
                                value={formData.conocimientosSaber}
                                onChange={(e) => setFormData({ ...formData, conocimientosSaber: e.target.value })}
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="conocimientosProceso">Conocimientos de Proceso</Label>
                            <Textarea
                                id="conocimientosProceso"
                                rows={2}
                                value={formData.conocimientosProceso}
                                onChange={(e) => setFormData({ ...formData, conocimientosProceso: e.target.value })}
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="actividadAprendizaje">Actividad de Aprendizaje</Label>
                            <Textarea
                                id="actividadAprendizaje"
                                rows={2}
                                value={formData.actividadAprendizaje}
                                onChange={(e) => setFormData({ ...formData, actividadAprendizaje: e.target.value })}
                                placeholder="Opcional"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="evidenciaAprendizaje">Evidencia de Aprendizaje</Label>
                            <Textarea
                                id="evidenciaAprendizaje"
                                rows={2}
                                value={formData.evidenciaAprendizaje}
                                onChange={(e) => setFormData({ ...formData, evidenciaAprendizaje: e.target.value })}
                                placeholder="Opcional"
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
                            {loading ? 'Creando...' : 'Crear Resultado'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
