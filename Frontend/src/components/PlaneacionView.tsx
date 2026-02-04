import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { apiService } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlaneacionViewProps {
    ficha: any;
}

export function PlaneacionView({ ficha }: PlaneacionViewProps) {
    const [planeacion, setPlaneacion] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    // Form state
    const [faseProyecto, setFaseProyecto] = useState('');
    const [actividadProyecto, setActividadProyecto] = useState('');
    const [idResultado, setIdResultado] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [horas, setHoras] = useState('');
    const [idInstructor, setIdInstructor] = useState('');
    const [observaciones, setObservaciones] = useState('');

    // Lists for dropdowns
    const [resultados, setResultados] = useState<any[]>([]);
    const [fases, setFases] = useState<any[]>([]);
    const [selectedFaseId, setSelectedFaseId] = useState<number | null>(null);
    const [instructores, setInstructores] = useState<any[]>([]);

    useEffect(() => {
        if (ficha) {
            loadPlaneacion();
            loadResultados();
            loadFases();
            loadInstructores();
        }
    }, [ficha]);

    const loadFases = async () => {
        if (!ficha) return;
        try {
            const fichaId = ficha.id_ficha || ficha.id;
            const resp = await apiService.getKanbanFasesByFicha(fichaId);
            if (resp.success && resp.data) {
                setFases(resp.data || []);
                // Default to first fase if none selected
                if (resp.data && resp.data.length > 0 && selectedFaseId === null) {
                    setSelectedFaseId(resp.data[0].id);
                }
            }
        } catch (error) {
            console.error('Error cargando fases:', error);
        }
    };

    const loadPlaneacion = async () => {
        if (!ficha) return;
        setLoading(true);
        try {
            const fichaId = ficha.id_ficha || ficha.id;
            const resp = await apiService.getPlaneacion(fichaId);
            if (resp.success && resp.data) {
                setPlaneacion(resp.data);
            }
        } catch (error) {
            console.error('Error cargando planeación:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadResultados = async () => {
        if (!ficha) return;
        try {
            const fichaId = ficha.id_ficha || ficha.id;
            const resp = await apiService.getResultadosByFicha(fichaId);
            if (resp.success && resp.data) {
                setResultados(resp.data);
            }
        } catch (error) {
            console.error('Error cargando resultados:', error);
        }
    };

    // Resultados filtrados por la fase seleccionada (por defecto mostrar todos si no hay fase seleccionada)
    const resultadosFiltradosPorFase = (): any[] => {
        if (selectedFaseId === null) return resultados;
        if (selectedFaseId === 999) {
            // Sin asignar -> fase_id null
            return resultados.filter(r => !r.fase_id);
        }
        return resultados.filter(r => Number(r.fase_id) === Number(selectedFaseId));
    };

    const loadInstructores = async () => {
        try {
            const resp = await apiService.getUsuarios();
            if (resp.success && resp.data) {
                setInstructores(resp.data.filter((u: any) => u.rol === 'Instructor'));
            }
        } catch (error) {
            console.error('Error cargando instructores:', error);
        }
    };

    const handleCreate = () => {
        setSelectedItem(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (item: any) => {
        setSelectedItem(item);
        setFaseProyecto(item.fase_proyecto || '');
        setActividadProyecto(item.actividad_proyecto || '');
        setIdResultado(item.id_resultado?.toString() || '');
        setFechaInicio(item.fecha_inicio ? new Date(item.fecha_inicio).toISOString().split('T')[0] : '');
        setFechaFin(item.fecha_fin ? new Date(item.fecha_fin).toISOString().split('T')[0] : '');
        setHoras(item.horas?.toString() || '');
        setIdInstructor(item.id_instructor?.toString() || '');
        setObservaciones(item.observaciones || '');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de eliminar esta entrada de planeación?')) {
            try {
                await apiService.deletePlaneacion(id);
                loadPlaneacion();
            } catch (error) {
                console.error('Error eliminando planeación:', error);
            }
        }
    };

    const resetForm = () => {
        setFaseProyecto('');
        setActividadProyecto('');
        setIdResultado('');
        setFechaInicio('');
        setFechaFin('');
        setHoras('');
        setIdInstructor('');
        setObservaciones('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ficha) return;

        const fichaId = ficha.id_ficha || ficha.id;
        const payload = {
            id_ficha: fichaId,
            fase_proyecto: faseProyecto,
            actividad_proyecto: actividadProyecto,
            id_resultado: idResultado ? parseInt(idResultado) : null,
            fecha_inicio: fechaInicio || null,
            fecha_fin: fechaFin || null,
            horas: horas ? parseInt(horas) : null,
            id_instructor: idInstructor ? parseInt(idInstructor) : null,
            observaciones: observaciones
        };

        try {
            if (selectedItem) {
                await apiService.updatePlaneacion(selectedItem.id_planeacion, payload);
            } else {
                await apiService.createPlaneacion(payload);
            }
            setIsModalOpen(false);
            loadPlaneacion();
        } catch (error) {
            console.error('Error guardando planeación:', error);
        }
    };

    if (!ficha) {
        return <div className="p-6 text-center text-gray-500">Selecciona una ficha para ver su planeación pedagógica.</div>;
    }

    return (
        <div className="flex-1 overflow-auto bg-[#F9F9F9] p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#39A900]">Planeación Pedagógica</h2>
                        <p className="text-gray-600">Gestión de actividades para la ficha {ficha.codigo_ficha || ficha.codigo}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedFaseId ?? ''}
                            onChange={(e) => setSelectedFaseId(e.target.value === '' ? null : Number(e.target.value))}
                            className="px-3 py-2 border rounded-md text-sm"
                        >
                            <option value="">Todas las fases</option>
                            {fases.map((f) => (
                                <option key={f.id} value={f.id}>{f.nombre}</option>
                            ))}
                        </select>
                        <Button onClick={handleCreate} className="bg-[#39A900] hover:bg-[#2E7D32]">
                            <Plus className="w-4 h-4 mr-2" />
                            Nueva Actividad
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8">Cargando planeación...</div>
                ) : planeacion.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent className="pt-6">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No hay actividades planificadas</h3>
                            <p className="text-gray-500 mb-4">Comienza agregando una nueva actividad a la planeación.</p>
                            <Button onClick={handleCreate} variant="outline" className="border-[#39A900] text-[#39A900]">
                                Crear primera actividad
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Actividades Planificadas ({planeacion.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fase</TableHead>
                                            <TableHead>Actividad</TableHead>
                                            <TableHead>Resultado</TableHead>
                                            <TableHead>Fechas</TableHead>
                                            <TableHead>Horas</TableHead>
                                            <TableHead>Instructor</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {planeacion.map((item) => (
                                            <TableRow key={item.id_planeacion}>
                                                <TableCell className="font-medium">
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                        {item.fase_proyecto || 'N/A'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {item.actividad_proyecto || 'Sin descripción'}
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {item.resultado_nombre || item.resultado_codigo || '-'}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <Calendar className="w-3 h-3" />
                                                        {item.fecha_inicio && item.fecha_fin ? (
                                                            <span>
                                                                {format(new Date(item.fecha_inicio), 'dd/MM/yy', { locale: es })} - {format(new Date(item.fecha_fin), 'dd/MM/yy', { locale: es })}
                                                            </span>
                                                        ) : '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3 text-gray-500" />
                                                        <span>{item.horas || 0}h</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-gray-600">
                                                    {item.instructor_nombre || '-'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                            <Edit className="w-4 h-4 text-green-600" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id_planeacion)}>
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedItem ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fase">Fase del Proyecto</Label>
                                    <Input
                                        id="fase"
                                        value={faseProyecto}
                                        onChange={(e) => setFaseProyecto(e.target.value)}
                                        placeholder="Ej: Análisis, Planeación..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="horas">Horas</Label>
                                    <Input
                                        id="horas"
                                        type="number"
                                        value={horas}
                                        onChange={(e) => setHoras(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="actividad">Actividad del Proyecto</Label>
                                <Textarea
                                    id="actividad"
                                    value={actividadProyecto}
                                    onChange={(e) => setActividadProyecto(e.target.value)}
                                    placeholder="Descripción de la actividad..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resultado">Resultado de Aprendizaje</Label>
                                {resultadosFiltradosPorFase().length === 0 ? (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">No hay resultados de aprendizaje en la fase seleccionada.</div>
                                ) : (
                                    <select
                                        id="resultado"
                                        value={idResultado}
                                        onChange={(e) => setIdResultado(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#39A900]"
                                    >
                                        <option value="">Seleccionar resultado...</option>
                                        {resultadosFiltradosPorFase().map((r) => (
                                            <option key={r.id_resultado_aprendizaje || r.id} value={r.id_resultado_aprendizaje || r.id}>
                                                {r.nombre_resultado || r.nombre}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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

                            <div className="space-y-2">
                                <Label htmlFor="instructor">Instructor Asignado</Label>
                                <select
                                    id="instructor"
                                    value={idInstructor}
                                    onChange={(e) => setIdInstructor(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#39A900]"
                                >
                                    <option value="">Seleccionar instructor...</option>
                                    {instructores.map((i) => (
                                        <option key={i.id_usuario || i.id} value={i.id_usuario || i.id}>
                                            {i.nombre_completo || i.nombres + ' ' + i.apellidos}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="observaciones">Observaciones</Label>
                                <Textarea
                                    id="observaciones"
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    placeholder="Notas adicionales..."
                                    rows={3}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-[#39A900] hover:bg-[#2E7D32]">
                                    Guardar Actividad
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
