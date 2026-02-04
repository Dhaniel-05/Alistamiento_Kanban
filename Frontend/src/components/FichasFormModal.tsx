import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { apiService } from '../../services/api';

interface FichasFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fichaToEdit?: any | null;
    onSuccess: () => void;
}

export function FichasFormModal({ open, onOpenChange, fichaToEdit, onSuccess }: FichasFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [programas, setProgramas] = useState<any[]>([]);

    // Form state
    const [codigoFicha, setCodigoFicha] = useState('');
    const [nombreFicha, setNombreFicha] = useState('');
    const [modalidadFormacion, setModalidadFormacion] = useState('');
    const [jornada, setJornada] = useState('');
    const [ambiente, setAmbiente] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [idPrograma, setIdPrograma] = useState('');
    const [estado, setEstado] = useState('Por Iniciar');

    useEffect(() => {
        loadProgramas();
    }, []);

    useEffect(() => {
        if (fichaToEdit) {
            setCodigoFicha(fichaToEdit.codigo_ficha || '');
            setNombreFicha(fichaToEdit.nombre_ficha || '');
            setModalidadFormacion(fichaToEdit.modalidad_formacion || '');
            setJornada(fichaToEdit.jornada || '');
            setAmbiente(fichaToEdit.ambiente || '');
            setFechaInicio(fichaToEdit.fecha_inicio ? new Date(fichaToEdit.fecha_inicio).toISOString().split('T')[0] : '');
            setFechaFin(fichaToEdit.fecha_fin ? new Date(fichaToEdit.fecha_fin).toISOString().split('T')[0] : '');
            setIdPrograma(fichaToEdit.id_programa?.toString() || '');
            setEstado(fichaToEdit.estado || 'Por Iniciar');
        } else {
            resetForm();
        }
    }, [fichaToEdit, open]);

    const loadProgramas = async () => {
        try {
            const resp = await apiService.getProgramas();
            if (resp.success && resp.data) {
                setProgramas(resp.data);
            }
        } catch (error) {
            console.error('Error cargando programas:', error);
        }
    };

    const resetForm = () => {
        setCodigoFicha('');
        setNombreFicha('');
        setModalidadFormacion('');
        setJornada('');
        setAmbiente('');
        setFechaInicio('');
        setFechaFin('');
        setIdPrograma('');
        setEstado('Por Iniciar');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            codigo_ficha: codigoFicha,
            nombre_ficha: nombreFicha,
            modalidad_formacion: modalidadFormacion || null,
            jornada: jornada || null,
            ambiente: ambiente || null,
            fecha_inicio: fechaInicio || null,
            fecha_fin: fechaFin || null,
            id_programa: idPrograma ? parseInt(idPrograma) : null,
            estado: estado
        };

        try {
            if (fichaToEdit) {
                await apiService.updateFicha(fichaToEdit.id_ficha, payload);
            } else {
                await apiService.createFicha(payload);
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error guardando ficha:', error);
            alert('Error al guardar la ficha');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{fichaToEdit ? 'Editar Ficha' : 'Nueva Ficha'}</DialogTitle>
                    <DialogDescription>
                        {fichaToEdit ? 'Modifica los datos de la ficha de formación' : 'Completa los campos para crear una nueva ficha de formación'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="codigo">Código de Ficha *</Label>
                            <Input
                                id="codigo"
                                value={codigoFicha}
                                onChange={(e) => setCodigoFicha(e.target.value)}
                                placeholder="Ej: 2928088"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jornada">Jornada</Label>
                            <select
                                id="jornada"
                                value={jornada}
                                onChange={(e) => setJornada(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#39A900]"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Diurna">Diurna</option>
                                <option value="Nocturna">Nocturna</option>
                                <option value="Mixta">Mixta</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nombre">Nombre de la Ficha *</Label>
                        <Input
                            id="nombre"
                            value={nombreFicha}
                            onChange={(e) => setNombreFicha(e.target.value)}
                            placeholder="Ej: ADSO - Análisis y Desarrollo de Software"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="programa">Programa Formativo</Label>
                            <select
                                id="programa"
                                value={idPrograma}
                                onChange={(e) => setIdPrograma(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#39A900]"
                            >
                                <option value="">Seleccionar programa...</option>
                                {programas.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.codigo} - {p.titulo_obtenido}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="modalidad">Modalidad</Label>
                            <select
                                id="modalidad"
                                value={modalidadFormacion}
                                onChange={(e) => setModalidadFormacion(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#39A900]"
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Presencial">Presencial</option>
                                <option value="Virtual">Virtual</option>
                                <option value="Mixta">Mixta</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ambiente">Ambiente</Label>
                            <Input
                                id="ambiente"
                                value={ambiente}
                                onChange={(e) => setAmbiente(e.target.value)}
                                placeholder="Ej: Aula 101"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="estado">Estado</Label>
                            <select
                                id="estado"
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#39A900]"
                            >
                                <option value="Por Iniciar">Por Iniciar</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Finalizada">Finalizada</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fechaInicio">Fecha de Inicio</Label>
                            <Input
                                id="fechaInicio"
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fechaFin">Fecha de Fin</Label>
                            <Input
                                id="fechaFin"
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-[#39A900] hover:bg-[#2E7D32]" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Ficha'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
