import { useEffect, useMemo, useState } from 'react';
import { Loader2, UserMinus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { apiService } from '../../services/api';
import type { Ficha, Usuario } from '../types';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface GestionInstructoresModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ficha: Ficha | null;
}

interface InstructorAsignado {
  id: number;
  id_usuario: number;
  usuario_nombre: string;
  usuario_correo: string;
  usuario_identificacion: string;
  usuario_rol: string;
  rol_ficha?: string | null;
}

export function GestionInstructoresModal({ open, onOpenChange, ficha }: GestionInstructoresModalProps) {
  const [assigned, setAssigned] = useState<InstructorAsignado[]>([]);
  const [allInstructors, setAllInstructors] = useState<Usuario[]>([]);
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<number[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const ROLE_OPTIONS = ['Instructor', 'Equipo Ejecutor'];

  useEffect(() => {
    if (open) {
      loadAvailableInstructors();
    }
  }, [open]);

  useEffect(() => {
    if (open && ficha?.id_ficha) {
      loadAssignedInstructors();
      setSelectedInstructorIds([]);
      setSelectedRoles({});
    } else if (!ficha) {
      setAssigned([]);
      setSelectedInstructorIds([]);
      setSelectedRoles({});
    }
  }, [open, ficha?.id_ficha]);

  const loadAvailableInstructors = async () => {
    try {
      setLoadingInstructors(true);
      const resp = await apiService.getUsuarios();
      if (resp.success && resp.data) {
        const withoutSuperUsers = resp.data.filter((usr: Usuario) => (usr.rol || '').toLowerCase() !== 'superusuario'.toLowerCase());
        setAllInstructors(withoutSuperUsers);
      }
    } catch (error) {
      console.error('Error cargando instructores disponibles:', error);
      toast.error('No se pudieron cargar los instructores disponibles');
    } finally {
      setLoadingInstructors(false);
    }
  };

  const loadAssignedInstructors = async () => {
    if (!ficha?.id_ficha) return;
    try {
      setLoadingAssigned(true);
      const resp = await apiService.getUsuariosAsignadosAFicha(ficha.id_ficha);
      if (resp.success && resp.data) {
        const mapped: InstructorAsignado[] = resp.data.map((item: any) => ({
          id: item.id,
          id_usuario: item.id_usuario,
          usuario_nombre: item.usuario_nombre,
          usuario_correo: item.usuario_correo,
          usuario_identificacion: item.usuario_identificacion,
          usuario_rol: item.usuario_rol,
          rol_ficha: item.rol_ficha,
        }));
        setAssigned(mapped);
      } else {
        setAssigned([]);
      }
    } catch (error) {
      console.error('Error obteniendo instructores asignados:', error);
      toast.error('No se pudieron obtener los instructores asignados');
    } finally {
      setLoadingAssigned(false);
    }
  };

  const assignedIds = useMemo(
    () => new Set(assigned.map((inst) => Number(inst.id_usuario))),
    [assigned]
  );

  const selectableInstructors = useMemo(
    () => allInstructors.filter((inst) => !assignedIds.has(Number(inst.id || inst.id_usuario))),
    [allInstructors, assignedIds]
  );

  const toggleInstructorSelection = (instructorId: number) => {
    setSelectedInstructorIds((prev) => {
      if (prev.includes(instructorId)) {
        setSelectedRoles((roles) => {
          const updated = { ...roles };
          delete updated[instructorId];
          return updated;
        });
        return prev.filter((id) => id !== instructorId);
      }
      setSelectedRoles((roles) => ({
        ...roles,
        [instructorId]: roles[instructorId] || 'Instructor',
      }));
      return [...prev, instructorId];
    });
  };

  const handleRoleChange = (instructorId: number, role: string) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [instructorId]: role,
    }));
  };

  const handleRemoveAssignment = async (inst: InstructorAsignado) => {
    if (!window.confirm(`¿Deseas desasignar a ${inst.usuario_nombre} de esta ficha?`)) {
      return;
    }
    try {
      const resp = await apiService.eliminarAsignacion(inst.id);
      if (resp.success) {
        toast.success('Instructor desasignado correctamente');
        await loadAssignedInstructors();
      } else {
        toast.error(resp.error || 'No se pudo desasignar el instructor');
      }
    } catch (error) {
      console.error('Error desasignando instructor:', error);
      toast.error('Error al desasignar instructor');
    }
  };

  const handleAssignInstructors = async () => {
    if (!ficha?.id_ficha) {
      toast.error('Selecciona una ficha antes de asignar instructores');
      return;
    }
    if (selectedInstructorIds.length === 0) {
      toast.error('Selecciona al menos un instructor');
      return;
    }

    if (!window.confirm(`¿Confirmas asignar ${selectedInstructorIds.length === 1 ? 'este instructor' : 'estos instructores'} a la ficha ${ficha.codigo_ficha}?`)) {
      return;
    }

    try {
      setAssigning(true);
      for (const instructorId of selectedInstructorIds) {
        const rolFicha = selectedRoles[instructorId] || 'Instructor';
        await apiService.asignarFichaAUsuario(instructorId, ficha.id_ficha, rolFicha);
      }
      toast.success('Instructores asignados correctamente');
      setSelectedInstructorIds([]);
      setSelectedRoles({});
      await loadAssignedInstructors();
    } catch (error) {
      console.error('Error asignando instructores:', error);
      toast.error('No se pudieron asignar los instructores seleccionados');
    } finally {
      setAssigning(false);
    }
  };

  const getInitials = (fullName?: string) => {
    if (!fullName) return '—';
    return fullName
      .split(' ')
      .filter(Boolean)
      .map((name) => name[0])
      .slice(0, 3)
      .join('')
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onOpenChange(false)}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1200px] xl:max-w-[1400px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gestión de Instructores</DialogTitle>
          <DialogDescription>
            Consulta y asigna instructores a la ficha seleccionada.
          </DialogDescription>
        </DialogHeader>

        {!ficha ? (
          <div className="py-12 text-center text-gray-500">
            Selecciona una ficha para gestionar sus instructores asignados.
          </div>
        ) : (
          <div className="space-y-6 overflow-y-auto pr-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Ficha seleccionada</p>
              <p className="text-lg font-semibold text-gray-900">
                {ficha.codigo_ficha} · {ficha.nombre_ficha}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Jornada {ficha.jornada || 'N/D'} · Modalidad {ficha.modalidad_formacion || ficha.modalidad || 'N/D'}
              </p>
            </div>

            <section className="space-y-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Instructores asignados</h3>
                <p className="text-sm text-gray-500">
                  Visualiza los instructores que ya están trabajando con esta ficha.
                </p>
              </div>

              {loadingAssigned ? (
                <div className="flex items-center justify-center py-10 text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cargando instructores asignados...
                </div>
              ) : assigned.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  Esta ficha aún no tiene instructores asignados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[80px]">Iniciales</TableHead>
                        <TableHead className="min-w-[180px]">Nombre</TableHead>
                        <TableHead className="min-w-[120px]">Identificación</TableHead>
                        <TableHead className="min-w-[140px]">Rol en la ficha</TableHead>
                        <TableHead className="text-right min-w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assigned.map((inst) => (
                        <TableRow key={inst.id}>
                          <TableCell className="font-medium">{getInitials(inst.usuario_nombre)}</TableCell>
                          <TableCell>{inst.usuario_nombre}</TableCell>
                          <TableCell>{inst.usuario_identificacion}</TableCell>
                          <TableCell>{inst.rol_ficha || 'Instructor'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleRemoveAssignment(inst)}
                            >
                              <UserMinus className="w-4 h-4 mr-1" />
                              Desasignar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Asignar instructores</h3>
                <p className="text-sm text-gray-500">
                  Selecciona uno o varios instructores para agregarlos a esta ficha.
                </p>
              </div>

              {loadingInstructors ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Cargando lista de instructores...
                </div>
              ) : selectableInstructors.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                  No hay instructores disponibles para asignar.
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200 divide-y divide-gray-100">
                  {selectableInstructors.map((instr) => {
                    const instructorId = Number(instr.id || (instr as any).id_usuario);
                    const nombre = (instr.nombre_completo || (instr as any).nom_completo || 'Instructor').trim();
                    const correo = (instr as any).correo || (instr as any).usuario_correo || '';
                    const isSelected = selectedInstructorIds.includes(instructorId);

                    return (
                      <div key={instructorId} className="p-3 space-y-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleInstructorSelection(instructorId)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{nombre}</p>
                            {correo && <p className="text-xs text-gray-500">{correo}</p>}
                          </div>
                        </label>
                        <div className="pl-7 pr-3 flex items-center gap-3 text-xs text-gray-600">
                          <span>Rol en ficha:</span>
                          <Select
                            value={selectedRoles[instructorId] || 'Instructor'}
                            onValueChange={(value) => handleRoleChange(instructorId, value)}
                            disabled={!isSelected}
                          >
                            <SelectTrigger className="h-8 w-40 text-xs">
                              <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleAssignInstructors}
                  disabled={assigning || selectedInstructorIds.length === 0 || !ficha}
                  className="bg-[#2E7D32] hover:bg-[#1B5E20]"
                >
                  {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Asignar Instructores
                </Button>
              </div>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

