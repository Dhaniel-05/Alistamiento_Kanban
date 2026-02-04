import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Usuario } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { apiService } from '../../services/api';

export function UsuariosTab() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const api = await import('../../services/api');
        const resp = await api.apiService.getUsuarios();
        if (mounted && resp.success && resp.data) setUsuarios(resp.data as any);
      } catch (err) {
        console.error('Error cargando usuarios:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  const usuariosFiltrados = usuarios.filter(user =>
    (user.nombre_completo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.num_ident || '').includes(searchQuery) ||
    (user.correo || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'SuperUsuario':
        return 'bg-purple-500 text-white';
      case 'Instructor':
        return 'bg-blue-500 text-white';
      case 'Equipo Ejecutor':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // Local state for create/edit modal
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState<any>({ nom_completo: '', num_ident: '', ini_nom: '', correo: '', perfil_profesional: '', rol: 'Instructor' });

  const openCreate = () => { setEditing(null); setForm({ nom_completo: '', num_ident: '', ini_nom: '', correo: '', perfil_profesional: '', rol: 'Instructor' }); setOpen(true); };
  const openEdit = (u: Usuario) => { setEditing(u); setForm({ nom_completo: u.nombre_completo || '', num_ident: u.num_ident || '', ini_nom: u.ini_nom || '', correo: u.correo || '', perfil_profesional: u.perfil_profesional || '', rol: u.rol }); setOpen(true); };

  const [selectedFichas, setSelectedFichas] = useState<number[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);

  useEffect(() => {
    if (open && form.rol === 'Instructor' && !editing) {
      // Cargar fichas cuando se abre el modal para crear instructor
      (async () => {
        try {
          const resp = await apiService.getFichas();
          if (resp.success && resp.data) {
            setFichas(resp.data);
          }
        } catch (err) {
          console.error('Error cargando fichas:', err);
        }
      })();
    }
  }, [open, form.rol, editing]);

  const saveUser = async () => {
    try {
      if (editing) {
        const resp = await apiService.updateUsuario(editing.id, {
          nom_completo: form.nom_completo,
          num_ident: form.num_ident,
          ini_nom: form.ini_nom,
          especialidad: form.perfil_profesional,
          correo: form.correo,
          rol: form.rol
        });
        if (!resp.success) throw new Error(resp.error || 'Error actualizando usuario');
      } else {
        // Crear usuario con fichas asignadas si es instructor
        const payload: any = {
          nom_completo: form.nom_completo,
          num_ident: form.num_ident,
          ini_nom: form.ini_nom,
          especialidad: form.perfil_profesional,
          correo: form.correo,
          rol: form.rol
        };

        // Si es instructor y hay fichas seleccionadas, agregarlas
        if (form.rol === 'Instructor' && selectedFichas.length > 0) {
          payload.id_fichas = selectedFichas;
        }

        const resp = await apiService.createUsuario(payload);
        if (!resp.success) throw new Error(resp.error || 'Error creando usuario');
        
        // Si es instructor, mostrar la contraseña generada
        if (form.rol === 'Instructor' && resp.data?.contrasena) {
          alert(`Instructor creado exitosamente.\n\nContraseña temporal: ${resp.data.contrasena}\n\nSe ha enviado un correo con las credenciales al instructor.`);
        }
      }
      // refresh
      const all = await apiService.getUsuarios();
      if (all.success && all.data) setUsuarios(all.data as any);
      setOpen(false);
      setSelectedFichas([]);
    } catch (err:any) {
      alert(err.message || 'Error guardando usuario');
    }
  };

  const deleteUser = async (u: Usuario) => {
    if (!confirm(`Eliminar usuario ${u.nombre_completo}?`)) return;
    const resp = await apiService.deleteUsuario(u.id);
    if (!resp.success) return alert('Error eliminando usuario: ' + (resp.error||''));
    const all = await apiService.getUsuarios();
    if (all.success && all.data) setUsuarios(all.data as any);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administra los usuarios del sistema de alistamiento
              </CardDescription>
            </div>
            <Button onClick={openCreate} className="bg-[#2E7D32] hover:bg-[#1B5E20]">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading && (
            <div className="text-center py-6 text-sm text-gray-500">Cargando usuarios...</div>
          )}

          {/* Create / Edit Dialog */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? 'Editar usuario' : 'Crear usuario'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <Input placeholder="Nombre completo *" value={form.nom_completo} onChange={(e:any)=>setForm({...form, nom_completo: e.target.value})} required />
                <Input placeholder="Número de identificación *" value={form.num_ident} onChange={(e:any)=>setForm({...form, num_ident: e.target.value})} required />
                <Input placeholder="Iniciales *" value={form.ini_nom} onChange={(e:any)=>setForm({...form, ini_nom: e.target.value})} required />
                <Input type="email" placeholder="Correo electrónico *" value={form.correo} onChange={(e:any)=>setForm({...form, correo: e.target.value})} required={form.rol === 'Instructor'} />
                <Input placeholder="Perfil profesional / Especialidad" value={form.perfil_profesional} onChange={(e:any)=>setForm({...form, perfil_profesional: e.target.value})} />

                <Select onValueChange={(v)=>setForm({...form, rol: v})} value={form.rol}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Rol *" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SuperUsuario">SuperUsuario</SelectItem>
                    <SelectItem value="Instructor">Instructor</SelectItem>
                  </SelectContent>
                </Select>

                {/* Si es instructor y no está editando, mostrar selector de fichas */}
                {form.rol === 'Instructor' && !editing && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fichas a asignar (opcional):</label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                      {fichas.map((ficha: any) => {
                        const fichaId = ficha.id_ficha || ficha.id;
                        return (
                          <label key={fichaId} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={selectedFichas.includes(fichaId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFichas([...selectedFichas, fichaId]);
                                } else {
                                  setSelectedFichas(selectedFichas.filter(id => id !== fichaId));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">
                              {ficha.codigo_ficha || ficha.codigo} - {ficha.nombre_ficha || ficha.nombre}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {fichas.length === 0 && (
                      <p className="text-xs text-gray-500">No hay fichas disponibles</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" onClick={()=>{setOpen(false); setSelectedFichas([]);}}>Cancelar</Button>
                  <Button onClick={saveUser}>{editing ? 'Guardar cambios' : 'Crear'}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Lista de usuarios */}
          <div className="space-y-4">
            {usuariosFiltrados.map((usuario) => (
              <div
                key={usuario.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2E7D32] rounded-full flex items-center justify-center">
                    <span className="text-white">{usuario.ini_nom}</span>
                  </div>
                  <div>
                    <h3 className="text-sm text-gray-900">{usuario.nombre_completo}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                      <span>📄 {usuario.num_ident}</span>
                      <span>📧 {usuario.correo}</span>
                        <span>🎓 {usuario.perfil_profesional}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getRolColor(usuario.rol)}>
                    {usuario.rol}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={()=>openEdit(usuario)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={()=>deleteUser(usuario)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {usuariosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron usuarios</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
