import { useState, useEffect } from 'react';
import { Plus, Search, Users, Trash2, Edit, FileText, Award } from 'lucide-react';
import { Button } from './ui/button';
// single import for Input already at top
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useFichas } from '../hooks/useFichas';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { apiService } from '../../services/api';
import PDFUploadAdmin from '../pages/PDFUploadAdmin';
import { FichasFormModal } from './FichasFormModal';
// type import removed - not used directly

export function FichasTab() {
  const { fichas, loading, error, refetch } = useFichas();
  const [open, setOpen] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openAsignar, setOpenAsignar] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [fichaToEdit, setFichaToEdit] = useState<any | null>(null);
  const [selectedFichaId, setSelectedFichaId] = useState<number | null>(null);
  const [form, setForm] = useState<any>({ codigo_ficha: '', nombre_ficha: '', modalidad_formacion: 'Presencial', jornada: 'Diurna', ambiente: '', fecha_inicio: '', fecha_fin: '', id_programa: null });
  const [programas, setProgramas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosAsignados, setUsuariosAsignados] = useState<any[]>([]);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | null>(null);
  const [openNuevoResultado, setOpenNuevoResultado] = useState(false);
  const [resultadoForm, setResultadoForm] = useState<any>({
    nombre_resultado: '',
    id_competencia: null,
    fase_vista: '',
    fase_base: '',

  });
  const [competenciasFicha, setCompetenciasFicha] = useState<any[]>([]);

  // States for New Competence Modal
  const [openNuevaCompetencia, setOpenNuevaCompetencia] = useState(false);
  const [competenciaForm, setCompetenciaForm] = useState<any>({
    norma_competencia: '',
    codigo_competencia: '',
    nombre_competencia: '',
    duracion_competencia: 0,
    id_programa: null
  });



  useEffect(() => {
    (async () => {
      try {
        const resp = await apiService.getProgramas();
        if (resp.success && resp.data) setProgramas(resp.data);
      } catch (err) {
        console.error('Error cargando programas para crear ficha:', err);
      }
    })();
  }, []);

  // Cargar usuarios cuando se abre el diálogo de asignación
  useEffect(() => {
    if (openAsignar && selectedFichaId) {
      loadUsuarios();
      loadUsuariosAsignados();
    }
  }, [openAsignar, selectedFichaId]);

  const loadUsuarios = async () => {
    try {
      const resp = await apiService.getUsuarios();
      if (resp.success && resp.data) {
        // Filtrar solo usuarios con rol de Instructor (legacy: aceptar Equipo Ejecutor)
        const usuariosFiltrados = resp.data.filter((u: any) => {
          const rol = (u.rol || '').toLowerCase();
          return rol === 'instructor' || rol === 'equipo ejecutor';
        });
        console.log('Usuarios cargados y filtrados:', usuariosFiltrados);
        setUsuarios(usuariosFiltrados);
      }
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    }
  };

  const loadCompetenciasByFicha = async (id: number) => {
    setCompetenciasFicha([]);
    try {
      const resp = await apiService.getCompetenciasByFicha(id);
      if (resp.success && resp.data) {
        setCompetenciasFicha(resp.data);
      }
    } catch (err) {
      console.error('Error cargando competencias:', err);
    }
  };





  const loadUsuariosAsignados = async () => {
    if (!selectedFichaId) return;
    try {
      const resp = await apiService.getUsuariosAsignadosAFicha(selectedFichaId);
      if (resp.success && resp.data) {
        setUsuariosAsignados(resp.data);
      }
    } catch (err) {
      console.error('Error cargando usuarios asignados:', err);
    }
  };
  const [searchQuery, setSearchQuery] = useState('');

  const fichasFiltradas = (fichas || []).filter(ficha => {
    if (!ficha) return false;
    const f = ficha as any;
    const codigo = (f.codigo_ficha || f.codigo || '').toLowerCase();
    const nombre = (f.nombre_ficha || f.nombre || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return codigo.includes(query) || nombre.includes(query);
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Por Iniciar':
        return 'bg-gray-500 text-white';
      case 'En Progreso':
        return 'bg-orange-300 text-white';
      case 'Finalizada':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getEstadoFicha = (ficha: any): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (ficha.fecha_fin) {
      const fechaFin = new Date(ficha.fecha_fin);
      fechaFin.setHours(0, 0, 0, 0);
      if (fechaFin <= today) {
        return 'Finalizada';
      }
    }

    if (ficha.fecha_inicio) {
      const fechaInicio = new Date(ficha.fecha_inicio);
      fechaInicio.setHours(0, 0, 0, 0);
      if (fechaInicio <= today) {
        return 'En Progreso';
      }
    }

    return 'Por Iniciar';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Fichas</CardTitle>
            <CardDescription>
              Administra las fichas de formación del programa ADSO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E7D32] mx-auto"></div>
              <p className="text-gray-500 mt-4">Cargando fichas...</p>
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
            <CardTitle>Gestión de Fichas</CardTitle>
            <CardDescription>
              Administra las fichas de formación del programa ADSO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-red-500">
              <p>Error al cargar las fichas: {error}</p>
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
              <CardTitle>Gestión de Fichas</CardTitle>
              <CardDescription>
                Administra las fichas de formación del programa ADSO
              </CardDescription>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Ficha
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear nueva ficha</DialogTitle>
                  <DialogDescription>
                    Complete los campos obligatorios para crear una nueva ficha de formación
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <Input
                    placeholder="Código de ficha *"
                    value={form.codigo_ficha}
                    onChange={(e: any) => setForm({ ...form, codigo_ficha: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Nombre de ficha *"
                    value={form.nombre_ficha}
                    onChange={(e: any) => setForm({ ...form, nombre_ficha: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Ambiente de formación"
                    value={form.ambiente}
                    onChange={(e: any) => setForm({ ...form, ambiente: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      placeholder="Fecha inicio *"
                      value={form.fecha_inicio}
                      onChange={(e: any) => setForm({ ...form, fecha_inicio: e.target.value })}
                      required
                    />
                    <Input
                      type="date"
                      placeholder="Fecha fin *"
                      value={form.fecha_fin}
                      onChange={(e: any) => setForm({ ...form, fecha_fin: e.target.value })}
                      required
                    />
                  </div>

                  <Select onValueChange={(val) => setForm({ ...form, modalidad_formacion: val })} value={form.modalidad_formacion}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Modalidad de formación *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="Presencial" value="Presencial">Presencial</SelectItem>
                      <SelectItem key="Virtual" value="Virtual">Virtual</SelectItem>
                      <SelectItem key="Mixta" value="Mixta">Mixta</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select onValueChange={(val) => setForm({ ...form, jornada: val })} value={form.jornada}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Jornada *" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="Diurna" value="Diurna">Diurna</SelectItem>
                      <SelectItem key="Nocturna" value="Nocturna">Nocturna</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select onValueChange={(val) => setForm({ ...form, id_programa: val === 'none' ? null : Number(val) })} value={form.id_programa ? String(form.id_programa) : 'none'}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Programa (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem key="none" value="none">Sin programa</SelectItem>
                      {programas.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.codigo} - {p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={async () => {
                      try {
                        // Validar campos obligatorios
                        if (!form.codigo_ficha || !form.nombre_ficha || !form.modalidad_formacion || !form.jornada || !form.fecha_inicio || !form.fecha_fin) {
                          alert('Por favor complete todos los campos obligatorios (*)');
                          return;
                        }

                        const resp = await apiService.createFicha(form);
                        if (resp.success) {
                          setOpen(false);
                          // Resetear formulario
                          setForm({ codigo_ficha: '', nombre_ficha: '', modalidad_formacion: 'Presencial', jornada: 'Diurna', ambiente: '', fecha_inicio: '', fecha_fin: '', id_programa: null });
                          refetch();
                        } else {
                          alert('Error creando ficha: ' + (resp.error || ''));
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Error al crear ficha');
                      }
                    }}>Crear</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar por código o nombre de ficha..."
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
                    Código
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Jornada
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Ambiente
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-4 py-3 text-center text-xs text-gray-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fichasFiltradas.map((ficha) => {
                  const f = ficha as any;
                  const fichaId = f.id_ficha || f.id;
                  return (
                    <tr key={fichaId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {f.codigo_ficha || f.codigo || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {f.nombre_ficha || f.nombre || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {ficha.jornada}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {ficha.ambiente}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <Badge className={`${getEstadoColor(getEstadoFicha(ficha))} text-xs px-2 py-1 inline-block`}>
                          {getEstadoFicha(ficha)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 text-center">
                        <div>{ficha.fecha_inicio ? new Date(ficha.fecha_inicio).toLocaleDateString() : 'N/A'}</div>
                        <div>{ficha.fecha_fin ? new Date(ficha.fecha_fin).toLocaleDateString() : 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFichaToEdit(ficha);
                              setOpenEdit(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFichaId(fichaId);
                              setOpenAsignar(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Users className="w-4 h-4" />
                            Asignar Instructor
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const fichaNombre = f.nombre_ficha || f.nombre || f.codigo_ficha || f.codigo || 'esta ficha';

                              if (!confirm(`¿Está seguro de que desea eliminar la ficha "${fichaNombre}"?\n\nEsta acción eliminará también todas las competencias, resultados de aprendizaje y asignaciones relacionadas.\n\nEsta acción no se puede deshacer.`)) {
                                return;
                              }

                              try {
                                const resp = await apiService.deleteFicha(fichaId);
                                if (resp.success) {
                                  alert('Ficha eliminada correctamente');
                                  refetch();
                                } else {
                                  alert('Error al eliminar ficha: ' + (resp.error || ''));
                                }
                              } catch (err) {
                                console.error(err);
                                alert('Error al eliminar ficha: ' + (err instanceof Error ? err.message : String(err)));
                              }
                            }}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {fichasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron fichas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para cargar PDF del programa */}
      <Dialog open={openUpload} onOpenChange={setOpenUpload}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cargar PDF del Programa</DialogTitle>
            <DialogDescription>
              Seleccione el archivo PDF del programa formativo para cargar las competencias y resultados de aprendizaje a esta ficha.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {selectedFichaId && (
              <PDFUploadAdmin
                idFicha={selectedFichaId}
                onSuccess={() => {
                  setOpenUpload(false);
                  setSelectedFichaId(null);
                  refetch(); // Refrescar la lista de fichas
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para asignar usuarios a la ficha */}
      <Dialog open={openAsignar} onOpenChange={setOpenAsignar}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asignar Usuarios a la Ficha</DialogTitle>
            <DialogDescription>
              Seleccione los instructores que desea asignar a esta ficha y defina su rol por ficha.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {/* Lista de usuarios asignados */}
            {usuariosAsignados.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Usuarios Asignados</h4>
                <div className="space-y-2">
                  {usuariosAsignados.map((asignacion) => (
                    <div key={asignacion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{asignacion.usuario_nombre}</p>
                        <p className="text-xs text-gray-600">{asignacion.usuario_identificacion} - {asignacion.usuario_rol}</p>
                        {asignacion.rol_ficha && (
                          <p className="text-xs text-gray-500">Rol: {asignacion.rol_ficha}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            const resp = await apiService.eliminarAsignacion(asignacion.id);
                            if (resp.success) {
                              loadUsuariosAsignados();
                            } else {
                              alert('Error al eliminar asignación: ' + (resp.error || ''));
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Error al eliminar asignación');
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Formulario para asignar nuevo instructor */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Asignar Nuevo Instructor</h4>
              <div className="space-y-3">
                <Select onValueChange={(val) => {
                  console.log('Select value changed:', val, 'type:', typeof val);
                  const newId = val === 'none' ? null : Number(val);
                  console.log('Setting selectedUsuarioId to:', newId);
                  setSelectedUsuarioId(newId);
                }} value={selectedUsuarioId ? String(selectedUsuarioId) : 'none'}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="none" value="none">Seleccionar instructor...</SelectItem>
                    {usuarios
                      .filter(u => {
                        const rol = (u.rol || '').toLowerCase();
                        const yaAsignado = usuariosAsignados.some(ua => ua.id_usuario === u.id);
                        return !yaAsignado && (rol === 'instructor' || rol === 'equipo ejecutor');
                      })
                      .map(u => {
                        console.log('Usuario disponible:', u.nombre_completo || u.nom_completo, 'ID:', u.id, 'Rol:', u.rol);
                        return (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.nombre_completo || u.nom_completo} - {u.rol} ({u.num_ident || u.num_identificacion})
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>

                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => {
                    setOpenAsignar(false);
                    setSelectedFichaId(null);
                    setSelectedUsuarioId(null);
                  }}>
                    Cerrar
                  </Button>
                  <Button
                    onClick={async () => {
                      console.log('Botón clickeado. selectedUsuarioId:', selectedUsuarioId, 'selectedFichaId:', selectedFichaId);
                      if (!selectedUsuarioId || !selectedFichaId) {
                        alert('Por favor seleccione un usuario');
                        return;
                      }
                      try {
                        // Asignar siempre con rol "Equipo Ejecutor"
                        const resp = await apiService.asignarFichaAUsuario(selectedUsuarioId, selectedFichaId, 'Equipo Ejecutor');
                        if (resp.success) {
                          alert('Instructor asignado correctamente como Equipo Ejecutor');
                          setSelectedUsuarioId(null);
                          loadUsuariosAsignados();
                        } else {
                          alert('Error al asignar usuario: ' + (resp.error || ''));
                        }
                      } catch (err) {
                        console.error(err);
                        alert('Error al asignar usuario');
                      }
                    }}
                    disabled={!selectedUsuarioId}
                  >
                    Asignar Usuario
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para crear nuevo resultado de aprendizaje */}
      <Dialog open={openNuevoResultado} onOpenChange={setOpenNuevoResultado}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Resultado de Aprendizaje</DialogTitle>
            <DialogDescription>
              Complete todos los campos para crear un nuevo resultado de aprendizaje para esta ficha.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Resultado *
              </label>
              <Input
                placeholder="Nombre del resultado de aprendizaje"
                value={resultadoForm.nombre_resultado}
                onChange={(e) => setResultadoForm({ ...resultadoForm, nombre_resultado: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Competencia *
              </label>
              <Select
                onValueChange={(val) => setResultadoForm({ ...resultadoForm, id_competencia: val === 'none' ? null : Number(val) })}
                value={resultadoForm.id_competencia ? String(resultadoForm.id_competencia) : 'none'}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar competencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="none" value="none">Seleccionar competencia...</SelectItem>
                  {competenciasFicha.map(c => (
                    <SelectItem key={c.id_competencia || c.id} value={String(c.id_competencia || c.id)}>
                      {c.norma_competencia || c.nombre_competencia || c.nombre || 'Sin nombre'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fase *
              </label>
              <Select
                onValueChange={(val) => {
                  setResultadoForm({
                    ...resultadoForm,
                    fase_vista: val === 'none' ? '' : val,
                    fase_base: val === 'none' ? '' : val
                  });
                }}
                value={resultadoForm.fase_vista || 'none'}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="none" value="none">Seleccionar fase...</SelectItem>
                  <SelectItem value="Análisis">Análisis</SelectItem>
                  <SelectItem value="Planeación">Planeación</SelectItem>
                  <SelectItem value="Ejecución">Ejecución</SelectItem>
                  <SelectItem value="Evaluación">Evaluación</SelectItem>
                </SelectContent>
              </Select>
            </div>



            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenNuevoResultado(false);
                  setSelectedFichaId(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (!resultadoForm.nombre_resultado || !resultadoForm.id_competencia) {
                    alert('Por favor complete los campos obligatorios (*)');
                    return;
                  }

                  try {
                    const payload = {
                      nombre: resultadoForm.nombre_resultado,
                      idCompetencia: resultadoForm.id_competencia,
                      faseBase: resultadoForm.fase_base,
                      faseVista: resultadoForm.fase_vista,

                      idFicha: selectedFichaId
                    };

                    const resp = await apiService.createResultado(payload);
                    if (resp.success) {

                      alert('Resultado de aprendizaje creado correctamente');
                      setOpenNuevoResultado(false);
                      setSelectedFichaId(null);
                      setResultadoForm({
                        nombre_resultado: '',
                        id_competencia: null,
                        fase_vista: '',
                        fase_base: '',

                      });
                      refetch();
                    } else {
                      alert('Error creando resultado: ' + (resp.error || ''));
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Error al crear resultado de aprendizaje');
                  }
                }}
                className="bg-[#2E7D32] hover:bg-[#1B5E20]"
              >
                Crear Resultado
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Nueva Competencia */}
      <Dialog open={openNuevaCompetencia} onOpenChange={setOpenNuevaCompetencia}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Competencia</DialogTitle>
            <DialogDescription>
              Crea una nueva competencia asociada a esta ficha y/o programa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="comp-select-programa">Programa</label>
              <Select
                value={competenciaForm.id_programa ? String(competenciaForm.id_programa) : ''}
                onValueChange={(val) => setCompetenciaForm({ ...competenciaForm, id_programa: parseInt(val) })}
              >
                <SelectTrigger id="comp-select-programa">
                  <SelectValue placeholder="Seleccione programa..." />
                </SelectTrigger>
                <SelectContent>
                  {programas.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="norma_competencia">Norma de Competencia</label>
              <Input
                id="norma_competencia"
                type="text"
                value={competenciaForm.norma_competencia}
                onChange={(e) => setCompetenciaForm({ ...competenciaForm, norma_competencia: e.target.value })}
                placeholder="Nombre de la norma (texto)"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="codigo_competencia">Código</label>
              <Input
                id="codigo_competencia"
                value={competenciaForm.codigo_competencia}
                onChange={(e) => setCompetenciaForm({ ...competenciaForm, codigo_competencia: e.target.value })}
                placeholder="Ej: 220501046"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="nombre_competencia">Nombre</label>
              <Input
                id="nombre_competencia"
                value={competenciaForm.nombre_competencia}
                onChange={(e) => setCompetenciaForm({ ...competenciaForm, nombre_competencia: e.target.value })}
                placeholder="Nombre de la competencia"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="duracion_competencia">Duración (Horas)</label>
              <Input
                id="duracion_competencia"
                type="number"
                value={competenciaForm.duracion_competencia}
                onChange={(e) => setCompetenciaForm({ ...competenciaForm, duracion_competencia: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpenNuevaCompetencia(false)}>
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const payload = {
                      ...competenciaForm,
                      codigo: competenciaForm.codigo_competencia,
                      nombre: competenciaForm.nombre_competencia,
                      horas: competenciaForm.duracion_competencia,
                      idPrograma: competenciaForm.id_programa,
                      normaCompetencia: competenciaForm.norma_competencia,
                      idFicha: selectedFichaId
                    };

                    const resp = await apiService.createCompetencia(payload);
                    if (resp.success) {
                      alert('Competencia creada exitosamente');
                      setOpenNuevaCompetencia(false);
                      if (selectedFichaId) {
                        await loadCompetenciasByFicha(selectedFichaId);
                      }
                      refetch();
                    } else {
                      alert('Error: ' + (resp.error || 'No se pudo crear'));
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Error al crear competencia');
                  }
                }}
                className="bg-[#39A900] hover:bg-[#2E7D32] text-white"
              >
                Crear Competencia
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de edición de ficha */}
      <FichasFormModal
        open={openEdit}
        onOpenChange={setOpenEdit}
        fichaToEdit={fichaToEdit}
        onSuccess={() => {
          setOpenEdit(false);
          setFichaToEdit(null);
          refetch();
        }}
      />
    </div>
  );
}
