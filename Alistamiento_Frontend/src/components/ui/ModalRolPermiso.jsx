import { useState, useEffect } from "react";
import './ModalRolPermiso.css';

export const ModalRolPermiso = ({
  onClose,
  onSave,
  roles = [],
  permisos = [],
  relacionSeleccionada,
}) => {
  const [idRol, setIdRol] = useState("");
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([]);

  useEffect(() => {
    if (relacionSeleccionada) {
      setIdRol(Number(relacionSeleccionada.id_rol || relacionSeleccionada.idRol || ""));
      setPermisosSeleccionados(
        (relacionSeleccionada.permisosSeleccionados || []).map(x => Number(x))
      );
    } else {
      setIdRol("");
      setPermisosSeleccionados([]);
    }
  }, [relacionSeleccionada]);

  const handleCheck = (idPermiso) => {
    const id = Number(idPermiso);
    setPermisosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!idRol) {
      alert("Seleccione un rol.");
      return;
    }
    onSave({ id_rol: Number(idRol), permisos: permisosSeleccionados });
  };

  return (
    <div className="modal-fondo">
      <div className="modal-contenedor">
        <h2 className="modal-titulo">
          {relacionSeleccionada
            ? "Editar permisos del Rol"
            : "Asignar permisos a Rol"}
        </h2>

        <form className="modal-formulario" onSubmit={handleSubmit}>
          <select
            className="modal-select"
            value={idRol || ""}
            onChange={(e) => setIdRol(Number(e.target.value))}
            required
            disabled={!!relacionSeleccionada}
          >
            <option value="">Seleccionar Rol</option>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.id_rol}>
                {r.nombre}
              </option>
            ))}
          </select>

          <div className="modal-seccion">
            <label className="modal-etiqueta">Permisos:</label>
            <div className="modal-lista-permisos">
              {permisos.map((p) => {
                const pid = Number(
                  p.id_permiso ?? p.id ?? p.permiso_id ?? p.permisoId
                );
                return (
                  <label key={pid} className="modal-item-permiso">
                    <input
                      type="checkbox"
                      checked={permisosSeleccionados.includes(pid)}
                      onChange={() => handleCheck(pid)}
                      className="modal-checkbox"
                    />
                    {p.nombre}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="modal-acciones">
            <button
              type="button"
              className="modal-boton-cancelar"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-boton-guardar"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
