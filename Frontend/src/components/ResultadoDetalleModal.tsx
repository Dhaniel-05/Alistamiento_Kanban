import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { apiService } from '../../services/api';
import { toast } from 'sonner';
import type { ResultadoAprendizaje } from '../types';

interface ResultadoDetalleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resultado: ResultadoAprendizaje | null;
  onSuccess?: () => void;
  readOnly?: boolean;
  readOnlyReason?: string;
}

/**
 * Modal para editar los detalles de un resultado de aprendizaje
 * Permite editar:
 * - Saberes de conceptos y principios
 * - Saberes de proceso
 * - Criterios de evaluacion
 * - Actividad de aprendizaje a desarrollar
 * - Descripcion de la evidencia de aprendizaje
 */
export function ResultadoDetalleModal({
  open,
  onOpenChange,
  resultado,
  onSuccess,
  readOnly = false,
  readOnlyReason,
}: ResultadoDetalleModalProps) {
  const [loading, setLoading] = useState(false);

  // Estados del formulario
  const [actividadProyecto, setActividadProyecto] = useState('');
  const [saberesConceptos, setSaberesConceptos] = useState('');
  const [saberesProceso, setSaberesProceso] = useState('');
  const [criteriosEvaluacion, setCriteriosEvaluacion] = useState('');
  const [actividadAprendizaje, setActividadAprendizaje] = useState('');
  const [estrategiasDidacticas, setEstrategiasDidacticas] = useState('');
  const [materialesFormacion, setMaterialesFormacion] = useState('');


  // Cargar datos completos del resultado cuando se abre el modal
  useEffect(() => {
    const loadResultadoData = async () => {
      if (open && resultado) {
        try {
          // Obtener los datos completos del resultado desde la API usando fetch directamente
          const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
          const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL)
            ? (import.meta as any).env.VITE_API_BASE_URL
            : 'http://localhost:3000/api';

          const response = await fetch(`${API_BASE_URL}/resultados/${resultado.id}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });

          if (response.ok) {
            const data = await response.json();
            const resultadoCompleto = data.data || data;

            setActividadProyecto(resultadoCompleto.actividad_proyecto || '');
            setSaberesConceptos(resultadoCompleto.conocimientos_saber || '');
            setSaberesProceso(resultadoCompleto.conocimientos_proceso || '');
            setCriteriosEvaluacion(resultadoCompleto.criterios_evaluacion || '');
            setActividadAprendizaje(resultadoCompleto.actividad_aprendizaje || '');
            setEstrategiasDidacticas(resultadoCompleto.estrategias_didacticas || '');
            setMaterialesFormacion(resultadoCompleto.materiales_formacion || '');
          } else {
            // Fallback a los datos que ya vienen en el resultado
            setActividadProyecto(resultado.actividad_proyecto || '');
            setSaberesConceptos(resultado.conocimientos_saber || '');
            setSaberesProceso(resultado.conocimientos_proceso || '');
            setCriteriosEvaluacion(resultado.criterios_evaluacion || '');
            setActividadAprendizaje(resultado.actividad_aprendizaje || '');
            setEstrategiasDidacticas(resultado.estrategias_didacticas || '');
            setMaterialesFormacion(resultado.materiales_formacion || '');
          }
        } catch (error) {
          console.error('Error cargando datos del resultado:', error);
          // Fallback a los datos que ya vienen en el resultado
          setActividadProyecto(resultado.actividad_proyecto || '');
          setSaberesConceptos(resultado.conocimientos_saber || '');
          setSaberesProceso(resultado.conocimientos_proceso || '');
          setCriteriosEvaluacion(resultado.criterios_evaluacion || '');
          setActividadAprendizaje(resultado.actividad_aprendizaje || '');
          setEstrategiasDidacticas(resultado.estrategias_didacticas || '');
          setMaterialesFormacion(resultado.materiales_formacion || '');
        }
      } else if (!open) {
        // Limpiar formulario al cerrar
        setActividadProyecto('');
        setSaberesConceptos('');
        setSaberesProceso('');
        setCriteriosEvaluacion('');
        setActividadAprendizaje('');
        setEstrategiasDidacticas('');
        setMaterialesFormacion('');
      }
    };

    loadResultadoData();
  }, [open, resultado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultado || readOnly) return;

    setLoading(true);
    try {
      // Actualizar el resultado con los nuevos datos
      await apiService.updateResultado(resultado.id, {
        actividad_proyecto: actividadProyecto,
        conocimientos_saber: saberesConceptos,
        conocimientos_proceso: saberesProceso,
        criterios_evaluacion: criteriosEvaluacion,
        actividad_aprendizaje: actividadAprendizaje,
        estrategias_didacticas: estrategiasDidacticas,
        materiales_formacion: materialesFormacion
      });

      toast.success('Datos guardados correctamente');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error guardando detalles del resultado:', error);
      toast.error('Error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (!resultado) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Detalles del Resultado de Aprendizaje
            {readOnly && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (Solo lectura - {readOnlyReason || 'Fase inhabilitada'})
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {resultado.nombre || 'Resultado de aprendizaje'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* 1. Actividad del proyecto */}
          <div className="space-y-2">
            <Label htmlFor="actividad-proyecto">
              1. Actividad del proyecto
            </Label>
            <Textarea
              id="actividad-proyecto"
              value={actividadProyecto}
              onChange={(e) => setActividadProyecto(e.target.value)}
              placeholder="Ingrese la actividad del proyecto..."
              rows={4}
              className="resize-y"
              disabled={readOnly}
            />
          </div>

          {/* 2. Saberes de conceptos y principios (conocimientos_saber) */}
          <div className="space-y-2">
            <Label htmlFor="saberes-conceptos">
              2. Saberes de conceptos y principios
            </Label>
            <Textarea
              id="saberes-conceptos"
              value={saberesConceptos}
              onChange={(e) => setSaberesConceptos(e.target.value)}
              placeholder="Ingrese los saberes de conceptos y principios..."
              rows={4}
              className="resize-y"
              disabled={readOnly}
            />
          </div>

          {/* 3. Saberes de proceso (conocimientos_proceso) */}
          <div className="space-y-2">
            <Label htmlFor="saberes-proceso">
              3. Saberes de proceso
            </Label>
            <Textarea
              id="saberes-proceso"
              value={saberesProceso}
              onChange={(e) => setSaberesProceso(e.target.value)}
              placeholder="Ingrese los saberes de proceso..."
              rows={4}
              className="resize-y"
              disabled={readOnly}
            />
          </div>

          {/* 4. Criterios de evaluación */}
          <div className="space-y-2">
            <Label htmlFor="criterios-evaluacion">
              4. Criterios de evaluación
            </Label>
            <Textarea
              id="criterios-evaluacion"
              value={criteriosEvaluacion}
              onChange={(e) => setCriteriosEvaluacion(e.target.value)}
              placeholder="Ingrese los criterios de evaluación..."
              rows={4}
              className="resize-y"
              disabled={readOnly}
            />
          </div>

          {/* 5. Actividad de aprendizaje */}
          <div className="space-y-2">
            <Label htmlFor="actividad-aprendizaje">
              5. Actividad de aprendizaje
            </Label>
            <Textarea
              id="actividad-aprendizaje"
              value={actividadAprendizaje}
              onChange={(e) => setActividadAprendizaje(e.target.value)}
              placeholder="Ingrese la actividad de aprendizaje..."
              rows={4}
              className="resize-y"
              disabled={readOnly}
            />
          </div>

          {/* 6. Estrategias didácticas */}
          <div className="space-y-2">
            <Label htmlFor="estrategias-didacticas">
              6. Estrategias didácticas
            </Label>
            <Textarea
              id="estrategias-didacticas"
              value={estrategiasDidacticas}
              onChange={(e) => setEstrategiasDidacticas(e.target.value)}
              placeholder="Ingrese las estrategias didácticas..."
              rows={4}
              className="resize-y"
              disabled={readOnly}
            />
          </div>

          {/* 7. Materiales de formación */}
          <div className="space-y-2">
            <Label htmlFor="materiales-formacion">
              7. Materiales de formación
            </Label>
            <Textarea
              id="materiales-formacion"
              value={materialesFormacion}
              onChange={(e) => setMaterialesFormacion(e.target.value)}
              placeholder="Ingrese los materiales de formación..."
              rows={4}
              className="resize-y"
              disabled={readOnly}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {readOnly ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!readOnly && (
              <Button type="submit" className="bg-[#39A900] hover:bg-[#2E7D32]" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

