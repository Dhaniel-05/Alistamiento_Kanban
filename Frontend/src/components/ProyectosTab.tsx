import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { apiService } from '../../services/api';
import type { ProyectoFormativo } from '../types';
import { ProyectosFormModal } from './ProyectosFormModal';

export function ProyectosTab() {
    const [proyectos, setProyectos] = useState<ProyectoFormativo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedProyecto, setSelectedProyecto] = useState<ProyectoFormativo | null>(null);

    useEffect(() => {
        loadProyectos();
    }, []);

    const loadProyectos = async () => {
        setLoading(true);
        try {
            const resp = await apiService.getProyectos();
            if (resp.success && resp.data) {
                setProyectos(resp.data);
            }
        } catch (err) {
            console.error('Error cargando proyectos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedProyecto(null);
        setIsFormOpen(true);
    };

    const handleEdit = (proyecto: ProyectoFormativo) => {
        setSelectedProyecto(proyecto);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
            try {
                await apiService.deleteProyecto(id);
                loadProyectos();
            } catch (error) {
                console.error('Error al eliminar proyecto:', error);
                alert('Error al eliminar el proyecto');
            }
        }
    };

    const proyectosFiltrados = proyectos.filter((p) => {
        const query = searchQuery.toLowerCase();
        return (
            p.codigo_proyecto.toLowerCase().includes(query) ||
            p.nombre_proyecto.toLowerCase().includes(query) ||
            (p.programa_nombre && p.programa_nombre.toLowerCase().includes(query))
        );
    });

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Proyectos Formativos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E7D32] mx-auto"></div>
                        <p className="text-gray-500 mt-4">Cargando proyectos...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Proyectos Formativos</CardTitle>
                            <CardDescription>
                                Gestiona los proyectos formativos del SENA
                            </CardDescription>
                        </div>
                        <Button onClick={handleCreate} className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Proyecto
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input
                                placeholder="Buscar por código, nombre o programa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Código</th>
                                    <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Nombre</th>
                                    <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Programa</th>
                                    <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Tiempo (meses)</th>
                                    <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {proyectosFiltrados.map((proyecto) => (
                                    <tr key={proyecto.id_proyecto} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{proyecto.codigo_proyecto}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 text-center">{proyecto.nombre_proyecto}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                            {proyecto.codigo_programa} - {proyecto.programa_nombre}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{proyecto.tiempo_de_ejecucion || '-'}</td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Button variant="outline" size="sm" onClick={() => handleEdit(proyecto)} className="flex items-center gap-2">
                                                    <Edit className="w-4 h-4" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(proyecto.id_proyecto)}
                                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {proyectosFiltrados.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No se encontraron proyectos</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <ProyectosFormModal
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                proyectoToEdit={selectedProyecto}
                onSuccess={loadProyectos}
            />
        </div>
    );
}
