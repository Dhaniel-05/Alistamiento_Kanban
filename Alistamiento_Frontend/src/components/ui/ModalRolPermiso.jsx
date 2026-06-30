import { useState, useEffect } from 'react';
import { leerPermisosDeRol } from '../../services/rolPermisoService';
import './ModalRolPermiso.css';

const resolverIdPermiso = (permiso) =>
  Number(permiso.id_permiso ?? permiso.id ?? permiso.permiso_id ?? permiso.permisoId);

export const ModalRolPermiso = ({
  onClose,
  onSave,
  roles = [],
  permisos = [],
  relacionSeleccionada,
}) => {
  const [idRol, setIdRol] = useState('');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);
  const [cargandoPermisos, setCargandoPermisos] = useState(false);

  const cargarPermisosDelRol = async (roleId) => {
    if (!roleId) {
      setPermisosSeleccionados([]);
      return;
    }

    setCargandoPermisos(true);
    try {
      const permisosDeRol = await leerPermisosDeRol(roleId);
      const ids = [...new Set(permisosDeRol.map((p) => Number(p.id_permiso)))];
      setPermisosSeleccionados(ids);
    } catch {
      setPermisosSeleccionados([]);
    } finally {
      setCargandoPermisos(false);
    }
  };

  useEffect(() => {
    if (relacionSeleccionada) {
      const roleId = Number(relacionSeleccionada.id_rol || relacionSeleccionada.idRol || '');
      setIdRol(roleId);
      setPermisosSeleccionados(
        (relacionSeleccionada.permisosSeleccionados || []).map((id) => Number(id)),
      );
      return;
    }

    setIdRol('');
    setPermisosSeleccionados([]);
  }, [relacionSeleccionada]);

  const handleRolChange = async (e) => {
    const nuevoRol = Number(e.target.value);
    setIdRol(nuevoRol || '');
    await cargarPermisosDelRol(nuevoRol || null);
  };

  const handleCheck = (idPermiso) => {
    const id = Number(idPermiso);
    setPermisosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idRol) {
      alert('Seleccione un rol.');
      return;
    }
    onSave({ id_rol: Number(idRol), permisos: permisosSeleccionados });
  };

  const modoEdicion = Boolean(relacionSeleccionada);

  return (
    <div className="modal-fondo">
      <div className="modal-contenedor modal-rol-permiso">
        <h2 className="modal-titulo">
          {modoEdicion ? 'Editar permisos del Rol' : 'Asignar permisos a Rol'}
        </h2>

        <form className="modal-formulario" onSubmit={handleSubmit}>
          <select
            className="modal-select"
            value={idRol || ''}
            onChange={handleRolChange}
            required
            disabled={modoEdicion}
          >
            <option value="">Seleccionar Rol</option>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre}
              </option>
            ))}
          </select>

          <div className="modal-seccion">
            <div className="modal-seccion-header">
              <label className="modal-etiqueta">Permisos asignados al rol</label>
              {idRol && (
                <span className="modal-permisos-contador">
                  {cargandoPermisos
                    ? 'Cargando...'
                    : `${permisosSeleccionados.length} de ${permisos.length} seleccionados`}
                </span>
              )}
            </div>

            <div className="modal-lista-permisos modal-lista-permisos--dos-columnas">
              {permisos.map((p) => {
                const pid = resolverIdPermiso(p);
                return (
                  <label key={pid} className="modal-item-permiso">
                    <input
                      type="checkbox"
                      checked={permisosSeleccionados.includes(pid)}
                      onChange={() => handleCheck(pid)}
                      className="modal-checkbox"
                      disabled={cargandoPermisos || !idRol}
                    />
                    <span>
                      {p.descripcion?.trim() ? (
                        <>
                          <span className="modal-permiso-nombre">{p.nombre}</span>
                          <span className="modal-permiso-descripcion">{p.descripcion}</span>
                        </>
                      ) : (
                        p.nombre
                      )}
                    </span>
                  </label>
                );
              })}
            </div>

            {!idRol && (
              <p className="modal-ayuda-rol">Seleccione un rol para ver y editar sus permisos.</p>
            )}
          </div>

          <div className="modal-acciones">
            <button type="button" className="modal-boton-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="modal-boton-guardar" disabled={cargandoPermisos || !idRol}>
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
