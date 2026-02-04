import { useState, useEffect } from 'react';
import { Plus, Mail, UserPlus, LogOut, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { apiService } from '../../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Usuario } from '../types';

export function EquipoEjecutorPanel() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [instructores, setInstructores] = useState<Usuario[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openAsignar, setOpenAsignar] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Usuario | null>(null);
  const [form, setForm] = useState<any>({
    nom_completo: '',
    num_ident: '',
    ini_nom: '',
    correo: '',
    especialidad: '',
    id_fichas: []
  });

  useEffect(() => {
    loadInstructores();
    loadFichas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInstructores = async () => {
    try {
      const resp = await apiService.getUsuarios();
      if (resp.success && resp.data) {
        const instructoresFiltrados = resp.data.filter((u: Usuario) => u.rol === 'Instructor');
        setInstructores(instructoresFiltrados);
      }
    } catch (err) {
      console.error('Error cargando instructores:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFichas = async () => {
    try {
      const resp = await apiService.getFichas();
      if (resp.success && resp.data) {
        setFichas(resp.data);
      }
    } catch (err) {
      console.error('Error cargando fichas:', err);
    }
  };

  const handleCreateInstructor = async () => {
    if (!form.nom_completo || !form.num_ident || !form.ini_nom || !form.correo) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      const payload = {
        nom_completo: form.nom_completo,
        num_ident: form.num_ident,
        ini_nom: form.ini_nom,
        correo: form.correo,
        especialidad: form.especialidad || null,
        rol: 'Instructor',
        id_fichas: form.id_fichas || []
      };

      const resp = await apiService.createUsuario(payload);
      if (resp.success) {
        alert(`Instructor creado exitosamente.\n\nContraseña temporal: ${resp.data?.contrasena || 'N/A'}\n\nSe ha enviado un correo con las credenciales al instructor.`);
        setOpenCreate(false);
        setForm({ nom_completo: '', num_ident: '', ini_nom: '', correo: '', especialidad: '', id_fichas: [] });
        loadInstructores();
      } else {
        alert('Error creando instructor: ' + (resp.error || ''));
      }
    } catch (err) {
      console.error(err);
      alert('Error al crear instructor');
    }
  };

  const handleAsignarFichas = async () => {
    if (!selectedInstructor || form.id_fichas.length === 0) {
      alert('Por favor seleccione al menos una ficha');
      return;
    }

    try {
      for (const idFicha of form.id_fichas) {
        await apiService.asignarFichaAUsuario(selectedInstructor.id, idFicha);
      }
      alert('Fichas asignadas correctamente');
      setOpenAsignar(false);
      setSelectedInstructor(null);
      setForm({ ...form, id_fichas: [] });
      loadInstructores();
    } catch (err) {
      console.error(err);
      alert('Error al asignar fichas');
    }
  };

  const getFichasAsignadas = async (instructorId: number) => {
    try {
      const resp = await apiService.getFichasAsignadasAUsuario(instructorId);
      if (resp.success && resp.data) {
        return resp.data;
      }
      return [];
    } catch (err) {
      console.error('Error obteniendo fichas asignadas:', err);
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="h-6 w-px bg-gray-300" />
          <div>
            <h1 className="text-gray-900">Panel de Equipo Ejecutor</h1>
            <p className="text-sm text-gray-600">Gestión de Instructores y Asignaciones</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          <button
            className="flex items-center gap-3 bg-gray-100 rounded px-4 py-2 cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="w-10 h-10 bg-[#2E7D32] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.ini_nom || (user?.nombre_completo || user?.nom_completo || 'E').charAt(0)}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-900 font-medium">{user?.nombre_completo || user?.nom_completo || 'Usuario'}</p>
              <p className="text-xs text-gray-600">{user?.rol}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-700 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
              <button
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-md"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
              >
                <LogOut className="w-4 h-4 inline mr-2" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Gestión de Instructores</CardTitle>
                <CardDescription>
                  Crea y gestiona instructores para asignarlos a fichas y resultados de aprendizaje
                </CardDescription>
              </div>
              <Button onClick={() => setOpenCreate(true)} className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                <Plus className="w-4 h-4 mr-2" />
                Crear Instructor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E7D32] mx-auto"></div>
                <p className="text-gray-500 mt-4">Cargando instructores...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {instructores.map((instructor) => (
                  <Card key={instructor.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-[#2E7D32] rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {instructor.ini_nom || (instructor.nombre_completo || instructor.nom_completo || 'I').charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{instructor.nombre_completo || instructor.nom_completo}</h3>
                              <p className="text-sm text-gray-600">{instructor.correo}</p>
                              <p className="text-xs text-gray-500">ID: {instructor.num_ident}</p>
                            </div>
                          </div>
                          {instructor.especialidad && (
                            <p className="text-sm text-gray-600 mb-2">Especialidad: {instructor.especialidad}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setSelectedInstructor(instructor);
                              const fichasAsignadas = await getFichasAsignadas(instructor.id);
                              setForm({ ...form, id_fichas: fichasAsignadas.map((f: any) => f.id_ficha || f.id) });
                              setOpenAsignar(true);
                            }}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Asignar Fichas
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {instructores.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No hay instructores registrados</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para crear instructor */}
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Instructor</DialogTitle>
              <DialogDescription>
                Complete los datos del instructor. Se le enviará un correo con sus credenciales de acceso.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Nombre completo *" value={form.nom_completo} onChange={(e) => setForm({ ...form, nom_completo: e.target.value })} required />
              <Input placeholder="Número de identificación *" value={form.num_ident} onChange={(e) => setForm({ ...form, num_ident: e.target.value })} required />
              <Input placeholder="Iniciales *" value={form.ini_nom} onChange={(e) => setForm({ ...form, ini_nom: e.target.value })} required />
              <Input type="email" placeholder="Correo electrónico *" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
              <Input placeholder="Especialidad / Perfil profesional" value={form.especialidad} onChange={(e) => setForm({ ...form, especialidad: e.target.value })} />

              <div className="space-y-2">
                <label className="text-sm font-medium">Fichas a asignar (opcional):</label>
                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                  {fichas.map((ficha: any) => {
                    const fichaId = ficha.id_ficha || ficha.id;
                    return (
                      <label key={fichaId} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={form.id_fichas.includes(fichaId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, id_fichas: [...form.id_fichas, fichaId] });
                            } else {
                              setForm({ ...form, id_fichas: form.id_fichas.filter((id: number) => id !== fichaId) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{ficha.codigo_ficha || ficha.codigo} - {ficha.nombre_ficha || ficha.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => {
                  setOpenCreate(false);
                  setForm({ nom_completo: '', num_ident: '', ini_nom: '', correo: '', especialidad: '', id_fichas: [] });
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateInstructor} className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                  <Mail className="w-4 h-4 mr-2" />
                  Crear y Enviar Correo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog para asignar fichas a instructor existente */}
        <Dialog open={openAsignar} onOpenChange={setOpenAsignar}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asignar Fichas a Instructor</DialogTitle>
              <DialogDescription>
                Seleccione las fichas que desea asignar a {selectedInstructor?.nombre_completo || selectedInstructor?.nom_completo}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto border rounded p-2 space-y-2">
                {fichas.map((ficha: any) => {
                  const fichaId = ficha.id_ficha || ficha.id;
                  return (
                    <label key={fichaId} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={form.id_fichas.includes(fichaId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, id_fichas: [...form.id_fichas, fichaId] });
                          } else {
                            setForm({ ...form, id_fichas: form.id_fichas.filter((id: number) => id !== fichaId) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{ficha.codigo_ficha || ficha.codigo} - {ficha.nombre_ficha || ficha.nombre}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => {
                  setOpenAsignar(false);
                  setSelectedInstructor(null);
                  setForm({ ...form, id_fichas: [] });
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleAsignarFichas} className="bg-[#2E7D32] hover:bg-[#1B5E20]">
                  Asignar Fichas
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default EquipoEjecutorPanel;