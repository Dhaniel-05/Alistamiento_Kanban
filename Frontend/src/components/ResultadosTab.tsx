import { useState, useEffect } from 'react';
import { Search, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { apiService } from '../../services/api';
import type { ResultadoAprendizaje } from '../types';
import { ResultadosFormModal } from './ResultadosFormModal';

export function ResultadosTab() {
  const [resultados, setResultados] = useState<ResultadoAprendizaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResultado, setSelectedResultado] = useState<ResultadoAprendizaje | null>(null);

  useEffect(() => {
    loadResultados();
  }, []);

  const loadResultados = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getAllResultados();

      if (response.success && response.data) {
        setResultados(response.data);
      } else {
        setError(response.error || 'Error al cargar los resultados');
      }
    } catch (err) {
      console.error('Error cargando resultados:', err);
      setError('Error al cargar los resultados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedResultado(null);
    setIsModalOpen(true);
  };

  const handleEdit = (resultado: ResultadoAprendizaje) => {
    setSelectedResultado(resultado);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este resultado? Esta acción no se puede deshacer.')) {
      try {
        await apiService.deleteResultado(id);
        loadResultados();
      } catch (error) {
        console.error('Error al eliminar resultado:', error);
        alert('Error al eliminar el resultado');
      }
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Por Asignar':
        return 'bg-gray-500 text-white';
      case 'Por Iniciar':
        return 'bg-yellow-500 text-white';
      case 'En Proceso':
        return 'bg-blue-500 text-white';
      case 'Terminado':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const resultadosFiltrados = resultados.filter(resultado => {
    if (!resultado) return false;
    const nombre = (resultado.nombre || '').toLowerCase();
    const competencia = (resultado.competencia_nombre || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return nombre.includes(query) || competencia.includes(query);
  });

  if (loading && !resultados.length) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Aprendizaje</CardTitle>
            <CardDescription>
              Lista de todos los resultados de aprendizaje del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E7D32] mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando resultados...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Aprendizaje</CardTitle>
            <CardDescription>
              Lista de todos los resultados de aprendizaje del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-red-500">
              <p>Error al cargar los resultados: {error}</p>
              <button
                onClick={loadResultados}
                className="mt-4 px-4 py-2 bg-[#2E7D32] text-white rounded hover:bg-[#1B5E20]"
              >
                Reintentar
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resultados de Aprendizaje</CardTitle>
              <CardDescription>
                Lista de todos los resultados de aprendizaje del sistema ({resultados.length} total)
              </CardDescription>
            </div>
            <Button onClick={handleCreate} className="bg-[#39A900] hover:bg-[#2E7D32]">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Resultado
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por nombre de resultado o competencia..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Nombre del Resultado
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Competencia
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resultadosFiltrados.map((resultado) => (
                  <tr key={resultado.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                      {resultado.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-md text-center">
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="line-clamp-2">{resultado.nombre || 'N/A'}</span>
                      </div>
                    </td>
                    {/* Estado: columna eliminada del modelo de resultados */}
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      <div>
                        <div className="font-medium">{resultado.competencia_codigo || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{resultado.competencia_nombre || ''}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {resultado.instructor_nombre || 'Sin asignar'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(resultado)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(resultado.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {resultadosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchQuery ? 'No se encontraron resultados que coincidan con la búsqueda' : 'No hay resultados de aprendizaje registrados'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <ResultadosFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        resultadoToEdit={selectedResultado}
        onSuccess={loadResultados}
      />
    </div>
  );
}


