import { useState, useEffect, useCallback } from 'react';
import ModalRol from '../ui/ModalRol';
import { ModalPermiso } from '../ui/ModalPermiso';
import { ModalRolPermiso } from '../ui/ModalRolPermiso';
import { ModalError } from '../ui/ModalError';
import { ModalExito } from '../ui/ModalExito';
import { ModalConfirmacion } from '../ui/ModalConfirmacion';
import { leerRoles, crearRol, actualizarRol, eliminarRol } from '../../services/rolService';
import {
  leerPermisos,
  crearPermiso,
  actualizarPermiso,
  eliminarPermiso,
} from '../../services/permisoService';
import {
  leerRolPermisos,
  crearRolPermiso,
  eliminarRolPermiso,
  leerPermisosDeRol,
} from '../../services/rolPermisoService';

const SUB_SECCIONES = [
  { id: 'roles', label: 'Roles', icon: 'fa-user-shield' },
  { id: 'permisos', label: 'Permisos', icon: 'fa-key' },
  { id: 'asignaciones', label: 'Asignaciones', icon: 'fa-link' },
];

export const GestionPermisosPanel = () => {
  const [subSeccion, setSubSeccion] = useState('roles');
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [rolPermisos, setRolPermisos] = useState([]);

  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
  const [relacionSeleccionada, setRelacionSeleccionada] = useState(null);

  const [modalRolAbierto, setModalRolAbierto] = useState(false);
  const [modalPermisoAbierto, setModalPermisoAbierto] = useState(false);
  const [modalAsignacionAbierto, setModalAsignacionAbierto] = useState(false);

  const [mostrarExito, setMostrarExito] = useState(false);
  const [mostrarError, setMostrarError] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');
  const [accionConfirmar, setAccionConfirmar] = useState(null);

  const notificarExito = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarExito(true);
  };

  const notificarError = (mensaje) => {
    setMensajeModal(mensaje);
    setMostrarError(true);
  };

  const fetchRoles = useCallback(async () => {
    setRoles(await leerRoles());
  }, []);

  const fetchPermisos = useCallback(async () => {
    setPermisos(await leerPermisos());
  }, []);

  const fetchRolPermisos = useCallback(async () => {
    setRolPermisos(await leerRolPermisos());
  }, []);

  useEffect(() => {
    fetchRoles().catch((e) => notificarError(e.message || 'Error al cargar roles'));
    fetchPermisos().catch((e) => notificarError(e.message || 'Error al cargar permisos'));
    fetchRolPermisos().catch((e) => notificarError(e.message || 'Error al cargar asignaciones'));
  }, [fetchRoles, fetchPermisos, fetchRolPermisos]);

  const handleSaveRol = async (rolData) => {
    try {
      if (rolSeleccionado) {
        await actualizarRol(rolData.id_rol, rolData);
        notificarExito('Rol actualizado correctamente');
      } else {
        await crearRol(rolData);
        notificarExito('Rol creado correctamente');
      }
      await fetchRoles();
      setModalRolAbierto(false);
      setRolSeleccionado(null);
    } catch (error) {
      notificarError(error.message || 'Error al guardar el rol');
    }
  };

  const handleSavePermiso = async (permisoData) => {
    try {
      if (permisoSeleccionado) {
        await actualizarPermiso(permisoData.id_permiso, permisoData);
        notificarExito('Permiso actualizado correctamente');
      } else {
        await crearPermiso(permisoData);
        notificarExito('Permiso creado correctamente');
      }
      await fetchPermisos();
      setModalPermisoAbierto(false);
      setPermisoSeleccionado(null);
    } catch (error) {
      notificarError(error.message || 'Error al guardar el permiso');
    }
  };

  const handleSaveAsignacion = async ({ id_rol, permisos: permisosIds }) => {
    try {
      const actuales = await leerPermisosDeRol(id_rol);
      const actualesIds = new Set(actuales.map((p) => Number(p.id_permiso)));
      const nuevosIds = new Set(permisosIds.map(Number));

      for (const relacion of actuales) {
        if (!nuevosIds.has(Number(relacion.id_permiso))) {
          await eliminarRolPermiso(relacion.id_rol_permiso);
        }
      }

      for (const permisoId of nuevosIds) {
        if (!actualesIds.has(permisoId)) {
          await crearRolPermiso(id_rol, permisoId);
        }
      }

      await fetchRolPermisos();
      notificarExito('Permisos del rol actualizados correctamente');
      setModalAsignacionAbierto(false);
      setRelacionSeleccionada(null);
    } catch (error) {
      notificarError(error.message || 'Error al guardar permisos del rol');
    }
  };

  const handleEditAsignacion = async (relacion) => {
    const roleId = relacion.id_rol;
    const permisosDeRol = await leerPermisosDeRol(roleId);
    const permisosIds = [...new Set(permisosDeRol.map((p) => Number(p.id_permiso)))];

    setRelacionSeleccionada({
      id_rol: Number(roleId),
      permisosSeleccionados: permisosIds,
    });
    setModalAsignacionAbierto(true);
  };

  const solicitarEliminar = (mensaje, accion) => {
    setMensajeModal(mensaje);
    setAccionConfirmar(() => accion);
    setMostrarConfirmacion(true);
  };

  const ejecutarConfirmacion = async () => {
    try {
      if (accionConfirmar) await accionConfirmar();
    } catch (error) {
      notificarError(error.message || 'Error al ejecutar la acción');
    } finally {
      setMostrarConfirmacion(false);
      setAccionConfirmar(null);
    }
  };

  const titulos = {
    roles: 'Roles del sistema',
    permisos: 'Catálogo de permisos',
    asignaciones: 'Asignación rol → permiso',
  };

  const subtitulos = {
    roles: 'Define los roles disponibles para los usuarios.',
    permisos: 'Administra las claves de permiso usadas por el RBAC.',
    asignaciones: 'Asigna permisos a cada rol mediante checkboxes.',
  };

  return (
    <div className="panel-seccion">
      <div className="sub-menu-secciones">
        {SUB_SECCIONES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sub-tab ${subSeccion === item.id ? 'activo' : ''}`}
            onClick={() => setSubSeccion(item.id)}
          >
            <i className={`fas ${item.icon}`} aria-hidden />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="usuarios-header">
        <div>
          <h2 className="titulo-seccion">{titulos[subSeccion]}</h2>
          <p className="subtitulo">{subtitulos[subSeccion]}</p>
        </div>

        {subSeccion === 'roles' && (
          <button
            type="button"
            className="btn-crear"
            onClick={() => {
              setRolSeleccionado(null);
              setModalRolAbierto(true);
            }}
          >
            <i className="fas fa-plus" aria-hidden />
            Crear Rol
          </button>
        )}

        {subSeccion === 'permisos' && (
          <button
            type="button"
            className="btn-crear"
            onClick={() => {
              setPermisoSeleccionado(null);
              setModalPermisoAbierto(true);
            }}
          >
            <i className="fas fa-plus" aria-hidden />
            Crear Permiso
          </button>
        )}

        {subSeccion === 'asignaciones' && (
          <button
            type="button"
            className="btn-crear"
            onClick={() => {
              setRelacionSeleccionada(null);
              setModalAsignacionAbierto(true);
            }}
          >
            <i className="fas fa-link" aria-hidden />
            Asignar permisos a rol
          </button>
        )}
      </div>

      {subSeccion === 'roles' && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th className="ocultar-columna">ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={3}>No hay roles registrados.</td>
                </tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.id_rol}>
                    <td className="ocultar-columna">{r.id_rol}</td>
                    <td>{r.nombre}</td>
                    <td>
                      <div className="tabla-acciones">
                        <button
                          type="button"
                          className="btn-editar"
                          title="Editar rol"
                          onClick={() => {
                            setRolSeleccionado(r);
                            setModalRolAbierto(true);
                          }}
                        >
                          <i className="fas fa-pen" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="btn-eliminar"
                          title="Eliminar rol"
                          onClick={() => solicitarEliminar(
                            `¿Eliminar el rol "${r.nombre}"?`,
                            async () => {
                              await eliminarRol(r.id_rol);
                              await fetchRoles();
                              notificarExito('Rol eliminado correctamente');
                            },
                          )}
                        >
                          <i className="fas fa-trash" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {subSeccion === 'permisos' && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th className="ocultar-columna">ID</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {permisos.length === 0 ? (
                <tr>
                  <td colSpan={4}>No hay permisos registrados.</td>
                </tr>
              ) : (
                permisos.map((p) => (
                  <tr key={p.id_permiso}>
                    <td className="ocultar-columna">{p.id_permiso}</td>
                    <td>{p.nombre}</td>
                    <td>{p.descripcion?.trim() || '—'}</td>
                    <td>
                      <div className="tabla-acciones">
                        <button
                          type="button"
                          className="btn-editar"
                          title="Editar permiso"
                          onClick={() => {
                            setPermisoSeleccionado(p);
                            setModalPermisoAbierto(true);
                          }}
                        >
                          <i className="fas fa-pen" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="btn-eliminar"
                          title="Eliminar permiso"
                          onClick={() => solicitarEliminar(
                            `¿Eliminar el permiso "${p.nombre}"?`,
                            async () => {
                              await eliminarPermiso(p.id_permiso);
                              await fetchPermisos();
                              notificarExito('Permiso eliminado correctamente');
                            },
                          )}
                        >
                          <i className="fas fa-trash" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {subSeccion === 'asignaciones' && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th className="ocultar-columna">ID</th>
                <th>Rol</th>
                <th>Permiso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rolPermisos.length === 0 ? (
                <tr>
                  <td colSpan={4}>No hay asignaciones registradas.</td>
                </tr>
              ) : (
                rolPermisos.map((rp) => (
                  <tr key={rp.id_rol_permiso}>
                    <td className="ocultar-columna">{rp.id_rol_permiso}</td>
                    <td>{rp.rol}</td>
                    <td>{rp.permiso}</td>
                    <td>
                      <div className="tabla-acciones">
                        <button
                          type="button"
                          className="btn-editar"
                          title="Editar asignación del rol"
                          onClick={() => handleEditAsignacion(rp)}
                        >
                          <i className="fas fa-pen" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="btn-eliminar"
                          title="Eliminar asignación"
                          onClick={() => solicitarEliminar(
                            `¿Eliminar la asignación "${rp.rol} → ${rp.permiso}"?`,
                            async () => {
                              await eliminarRolPermiso(rp.id_rol_permiso);
                              await fetchRolPermisos();
                              notificarExito('Asignación eliminada correctamente');
                            },
                          )}
                        >
                          <i className="fas fa-trash" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalRolAbierto && (
        <ModalRol
          onClose={() => {
            setModalRolAbierto(false);
            setRolSeleccionado(null);
          }}
          onSave={handleSaveRol}
          rolSeleccionado={rolSeleccionado}
        />
      )}

      {modalPermisoAbierto && (
        <ModalPermiso
          onClose={() => {
            setModalPermisoAbierto(false);
            setPermisoSeleccionado(null);
          }}
          onSave={handleSavePermiso}
          permisoSeleccionado={permisoSeleccionado}
        />
      )}

      {modalAsignacionAbierto && (
        <ModalRolPermiso
          onClose={() => {
            setModalAsignacionAbierto(false);
            setRelacionSeleccionada(null);
          }}
          onSave={handleSaveAsignacion}
          roles={roles}
          permisos={permisos}
          relacionSeleccionada={relacionSeleccionada}
        />
      )}

      {mostrarExito && (
        <ModalExito
          onClose={() => setMostrarExito(false)}
          titulo="¡Operación exitosa!"
          mensaje={mensajeModal}
          textoBoton="Continuar"
        />
      )}

      {mostrarError && (
        <ModalError
          onClose={() => setMostrarError(false)}
          titulo="Error"
          mensaje={mensajeModal}
          textoBoton="Entendido"
        />
      )}

      {mostrarConfirmacion && (
        <ModalConfirmacion
          onClose={() => {
            setMostrarConfirmacion(false);
            setAccionConfirmar(null);
          }}
          onConfirm={ejecutarConfirmacion}
          titulo="Confirmar eliminación"
          mensaje={mensajeModal}
          textoConfirmar="Eliminar"
          textoCancelar="Cancelar"
        />
      )}
    </div>
  );
};
