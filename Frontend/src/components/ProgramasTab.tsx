import { useState, useEffect } from 'react';
import { GraduationCap, Upload, Edit, Trash2, Plus, Award, FileText } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import ProjectPDFUpload from '../pages/ProjectPDFUpload';
import PDFUploadAdmin from '../pages/PDFUploadAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

import { apiService } from '../../services/api';
import type { ProgramaFormativo } from '../types';
import { ProgramasFormModal } from './ProgramasFormModal';
import { CompetenciaFormModalPrograma } from './CompetenciaFormModalPrograma';
import { ResultadoFormModalPrograma } from './ResultadoFormModalPrograma';

export function ProgramasTab() {
  const [programas, setProgramas] = useState<ProgramaFormativo[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedPrograma, setSelectedPrograma] = useState<ProgramaFormativo | null>(null);
  const [showSecondImportStep, setShowSecondImportStep] = useState(false);

  // Competencia and Resultado modal states
  const [isCompetenciaModalOpen, setIsCompetenciaModalOpen] = useState(false);
  const [isResultadoModalOpen, setIsResultadoModalOpen] = useState(false);
  const [selectedProgramaId, setSelectedProgramaId] = useState<number | null>(null);

  useEffect(() => {
    loadProgramas();
  }, []);

  const loadProgramas = async () => {
    setLoading(true);
    try {
      const resp = await apiService.getProgramas();
      if (resp.success && resp.data) {
        setProgramas(resp.data as ProgramaFormativo[]);
      }
    } catch (err) {
      console.error('Error cargando programas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedPrograma(null);
    setIsFormOpen(true);
  };

  const handleEdit = (programa: ProgramaFormativo) => {
    setSelectedPrograma(programa);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este programa? Esta acción no se puede deshacer.')) {
      try {
        await apiService.deletePrograma(id);
        loadProgramas();
      } catch (error) {
        console.error('Error al eliminar programa:', error);
        alert('Error al eliminar el programa');
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Programas Formativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E7D32] mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando programas...</p>
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
              <CardTitle>Programas Formativos</CardTitle>
              <CardDescription>
                Gestiona los programas de formación del SENA
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-[#2E7D32] text-[#2E7D32] hover:bg-green-50">
                    <Upload className="w-4 h-4 mr-2" />
                    Importar PDF
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Importar Programa desde PDF</DialogTitle>
                    <DialogDescription>
                      Carga el PDF del proyecto formativo para extraer la información automáticamente.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="mt-4 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-gray-900">1) Cargar PDF del Programa / Proyecto</h4>
                      <PDFUploadAdmin onSuccess={() => {
                        setShowSecondImportStep(true);
                        loadProgramas();
                      }} />
                    </div>

                    {showSecondImportStep && (
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold mb-3 text-gray-900">2) Revisión / Procesamiento adicional</h4>
                        <ProjectPDFUpload idPrograma={programas[0]?.id} onSuccess={() => {
                          setIsImportOpen(false);
                          loadProgramas();
                        }} />
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={handleCreate} className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Programa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Código</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Nombre</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Duración Total</th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {programas.map((programa) => (
                  <tr key={programa.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">{programa.codigo || programa.codigo_programa}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-center">{programa.nombre || programa.nombre_programa}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">{programa.tipo_programa}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">
                      {programa.duracion_total_programa || programa.duracion_total}h
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(programa)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedProgramaId(programa.id);
                            setIsCompetenciaModalOpen(true);
                          }}
                        >
                          <Award className="w-4 h-4 mr-1" />
                          Nueva Competencia
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-[#2E7D32] text-white hover:bg-[#1B5E20]"
                          onClick={() => {
                            setSelectedProgramaId(programa.id);
                            setIsResultadoModalOpen(true);
                          }}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Nuevo Resultado
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(programa.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {programas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron programas</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ProgramasFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        programaToEdit={selectedPrograma}
        onSuccess={loadProgramas}
      />

      {selectedProgramaId && (
        <>
          <CompetenciaFormModalPrograma
            open={isCompetenciaModalOpen}
            onOpenChange={setIsCompetenciaModalOpen}
            idPrograma={selectedProgramaId}
            onSuccess={() => {
              loadProgramas();
              setIsCompetenciaModalOpen(false);
            }}
          />

          <ResultadoFormModalPrograma
            open={isResultadoModalOpen}
            onOpenChange={setIsResultadoModalOpen}
            idPrograma={selectedProgramaId}
            onSuccess={() => {
              loadProgramas();
              setIsResultadoModalOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}
