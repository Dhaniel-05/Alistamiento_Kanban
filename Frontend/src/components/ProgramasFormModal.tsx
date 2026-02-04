import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { apiService } from '../../services/api';
import type { ProgramaFormativo } from '../types';

interface ProgramasFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    programaToEdit?: ProgramaFormativo | null;
    onSuccess: () => void;
}

export function ProgramasFormModal({
    open,
    onOpenChange,
    programaToEdit,
    onSuccess
}: ProgramasFormModalProps) {
    const [loading, setLoading] = useState(false);

    // Form state
    const [codigo, setCodigo] = useState('');
    const [nombre, setNombre] = useState('');
    const [titulo, setTitulo] = useState('');
    const [tipo, setTipo] = useState('Tecnólogo');
    const [version, setVersion] = useState('1');
    const [duracionTotal, setDuracionTotal] = useState(0);
    const [duracionLectiva, setDuracionLectiva] = useState(0);
    const [duracionProductiva, setDuracionProductiva] = useState(0);
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    // Load initial data
    useEffect(() => {
        if (open) {
            if (programaToEdit) {
                setCodigo(programaToEdit.codigo || '');
                setNombre(programaToEdit.nombre_programa || programaToEdit.nombre || ''); // Handle possible field names
                setTitulo(programaToEdit.titulo_obtenido || '');
                setTipo(programaToEdit.tipo_programa || 'Tecnólogo');
                setVersion(programaToEdit.version || '1');
                setDuracionTotal(programaToEdit.duracion_total || 0);
                setDuracionLectiva(programaToEdit.duracion_lectiva || 0);
                setDuracionProductiva(programaToEdit.duracion_productiva || 0);
                setFechaInicio(programaToEdit.fecha_inicio || '');
                setFechaFin(programaToEdit.fecha_fin || '');
            } else {
                resetForm();
            }
        }
    }, [open, programaToEdit]);

    const resetForm = () => {
        setCodigo('');
        setNombre('');
        setTitulo('');
        setTipo('Tecnólogo');
        setVersion('1');
        setDuracionTotal(0);
        setDuracionLectiva(0);
        setDuracionProductiva(0);
        setFechaInicio('');
        setFechaFin('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                codigo_programa: codigo,
                nombre_programa: nombre,
                titulo_obtenido: titulo,
                tipo_programa: tipo,
                version,
                duracion_total_programa: duracionTotal,
                duracion_etapa_lectiva: duracionLectiva,
                duracion_etapa_productiva: duracionProductiva,
                fecha_inicio: fechaInicio || null,
                fecha_fin: fechaFin || null
            };

            if (programaToEdit) {
                await apiService.updatePrograma(programaToEdit.id, payload);
            } else {
                await apiService.createPrograma(payload);
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving programa:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{programaToEdit ? 'Editar Programa' : 'Nuevo Programa'}</DialogTitle>
                    <DialogDescription>
                        {programaToEdit ? 'Modifica los datos del programa formativo' : 'Completa los campos para crear un nuevo programa formativo'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="codigo">Código</Label>
                            <Input
                                id="codigo"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value)}
                                placeholder="Ej: 228118"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="version">Versión</Label>
                            <Input
                                id="version"
                                value={version}
                                onChange={(e) => setVersion(e.target.value)}
                                placeholder="Ej: 1"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre del Programa</Label>
                        <Input
                            id="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Análisis y Desarrollo de Software"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="titulo">Título Obtenido</Label>
                        <Input
                            id="titulo"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            placeholder="Ej: Tecnólogo en Análisis y Desarrollo de Software"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipo">Nivel de Formación</Label>
                        <Select value={tipo} onValueChange={setTipo}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar nivel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Tecnólogo">Tecnólogo</SelectItem>
                                <SelectItem value="Técnico">Técnico</SelectItem>
                                <SelectItem value="Operario">Operario</SelectItem>
                                <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                                <SelectItem value="Especialización">Especialización</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="duracionTotal">Total Horas</Label>
                            <Input
                                id="duracionTotal"
                                type="number"
                                value={duracionTotal}
                                onChange={(e) => setDuracionTotal(parseInt(e.target.value) || 0)}
                                min={0}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duracionLectiva">Etapa Lectiva</Label>
                            <Input
                                id="duracionLectiva"
                                type="number"
                                value={duracionLectiva}
                                onChange={(e) => setDuracionLectiva(parseInt(e.target.value) || 0)}
                                min={0}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duracionProductiva">Etapa Productiva</Label>
                            <Input
                                id="duracionProductiva"
                                type="number"
                                value={duracionProductiva}
                                onChange={(e) => setDuracionProductiva(parseInt(e.target.value) || 0)}
                                min={0}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                            <Input
                                id="fechaInicio"
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fechaFin">Fecha Fin</Label>
                            <Input
                                id="fechaFin"
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </div>
                    </div>

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
