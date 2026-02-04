import { useState, useEffect } from 'react';
import { Plus, FileText, Edit, Trash2, Calendar, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { apiService } from '../../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ActasViewProps {
    ficha: any;
}

export function ActasView({ ficha }: ActasViewProps) {
    const [actas, setActas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActa, setSelectedActa] = useState<any | null>(null);

    // Form state
    const [numeroActa, setNumeroActa] = useState('');
    const [fechaSesion, setFechaSesion] = useState('');
    const [asistentes, setAsistentes] = useState('');
    const [ordenDia, setOrdenDia] = useState('');
    const [desarrollo, setDesarrollo] = useState('');
    const [compromisos, setCompromisos] = useState('');

    useEffect(() => {
        if (ficha) {
            loadActas();
        }
    }, [ficha]);

    const loadActas = async () => {
        if (!ficha) return;
        setLoading(true);
        try {
            const fichaId = ficha.id_ficha || ficha.id;
            const resp = await apiService.getActasByFicha(fichaId);
            if (resp.success && resp.data) {
                setActas(resp.data);
            }
        } catch (error) {
            console.error('Error cargando actas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedActa(null);
        resetForm();
        setIsModalOpen(true);
    };

    const handleEdit = (acta: any) => {
        setSelectedActa(acta);
        setNumeroActa(acta.numero_acta || '');
        setFechaSesion(acta.fecha_sesion ? new Date(acta.fecha_sesion).toISOString().split('T')[0] : '');
        try {
            const parsed = typeof acta.asistentes === 'string' ? JSON.parse(acta.asistentes) : acta.asistentes;
            setAsistentes(Array.isArray(parsed) ? parsed.join(', ') : parsed || '');
        } catch {
            setAsistentes(acta.asistentes || '');
        }
        setOrdenDia(acta.orden_del_dia || '');
        setDesarrollo(acta.desarrollo || '');
        setCompromisos(acta.compromisos || '');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de eliminar esta acta?')) {
            try {
                await apiService.deleteActa(id);
                loadActas();
            } catch (error) {
                console.error('Error eliminando acta:', error);
            }
        }
    };

    const resetForm = () => {
        setNumeroActa('');
        setFechaSesion(new Date().toISOString().split('T')[0]);
        setAsistentes('');
        setOrdenDia('');
        setDesarrollo('');
        setCompromisos('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ficha) return;

        const fichaId = ficha.id_ficha || ficha.id;
        const payload = {
            id_ficha: fichaId,
            numero_acta: numeroActa,
            fecha_sesion: fechaSesion,
            asistentes: asistentes.split(',').map(s => s.trim()).filter(Boolean),
            orden_del_dia: ordenDia,
            desarrollo: desarrollo,
            compromisos: compromisos
        };

        try {
            if (selectedActa) {
                await apiService.updateActa(selectedActa.id_acta, payload);
            } else {
                await apiService.createActa(payload);
            }
            setIsModalOpen(false);
            loadActas();
        } catch (error) {
            console.error('Error guardando acta:', error);
        }
    };

    if (!ficha) {
        return <div className="p-6 text-center text-gray-500">Selecciona una ficha para ver sus actas.</div>;
    }

    return (
        <div className="flex-1 overflow-auto bg-[#F9F9F9] p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-[#39A900]">Sistema de Actas</h2>
                        <p className="text-gray-600">Gestión de actas para la ficha {ficha.codigo_ficha || ficha.codigo}</p>
                    </div>
                    <Button onClick={handleCreate} className="bg-[#39A900] hover:bg-[#2E7D32]">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Acta
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-8">Cargando actas...</div>
                ) : actas.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">No hay actas registradas</h3>
                        <p className="text-gray-500 mb-4">Comienza creando una nueva acta para esta ficha.</p>
                        <Button onClick={handleCreate} variant="outline" className="border-[#39A900] text-[#39A900]">
                            Crear primera acta
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {actas.map((acta) => (
                            <Card key={acta.id_acta} className="hover:shadow-md transition-shadow border-l-4 border-l-[#39A900]">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                    Acta #{acta.numero_acta}
                                                </Badge>
                                                <span className="text-xs text-gray-500 flex items-center">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {acta.fecha_sesion ? format(new Date(acta.fecha_sesion), 'PPP', { locale: es }) : 'Sin fecha'}
                                                </span>
                                            </div>
                                            <CardTitle className="text-lg font-medium">
                                                {acta.orden_del_dia ? acta.orden_del_dia.substring(0, 100) + (acta.orden_del_dia.length > 100 ? '...' : '') : 'Sin orden del día'}
                                            </CardTitle>
                                            <CardDescription className="flex items-center mt-1">
                                                <Users className="w-3 h-3 mr-1" />
                                                Creado por: {acta.nombre_creador || 'Desconocido'}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(acta)}>
                                                <Edit className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(acta.id_acta)}>
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-gray-600 line-clamp-2">
                                        {acta.desarrollo || 'Sin desarrollo registrado.'}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedActa ? 'Editar Acta' : 'Nueva Acta'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="numero">Número de Acta</Label>
                                    <Input
                                        id="numero"
                                        value={numeroActa}
                                        onChange={(e) => setNumeroActa(e.target.value)}
                                        placeholder="Ej: 001-2024"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fecha">Fecha de Sesión</Label>
                                    <Input
                                        id="fecha"
                                        type="date"
                                        value={fechaSesion}
                                        onChange={(e) => setFechaSesion(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="asistentes">Asistentes (separados por coma)</Label>
                                <Input
                                    id="asistentes"
                                    value={asistentes}
                                    onChange={(e) => setAsistentes(e.target.value)}
                                    placeholder="Juan Perez, Maria Gomez..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="orden">Orden del Día</Label>
                                <Textarea
                                    id="orden"
                                    value={ordenDia}
                                    onChange={(e) => setOrdenDia(e.target.value)}
                                    placeholder="Temas a tratar..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="desarrollo">Desarrollo de la Reunión</Label>
                                <Textarea
                                    id="desarrollo"
                                    value={desarrollo}
                                    onChange={(e) => setDesarrollo(e.target.value)}
                                    placeholder="Detalles de lo discutido..."
                                    rows={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="compromisos">Compromisos</Label>
                                <Textarea
                                    id="compromisos"
                                    value={compromisos}
                                    onChange={(e) => setCompromisos(e.target.value)}
                                    placeholder="Acuerdos y tareas pendientes..."
                                    rows={4}
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" className="bg-[#39A900] hover:bg-[#2E7D32]">
                                    Guardar Acta
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
