import { useState, useEffect } from "react";
import { ModalRolPermiso } from "../components/ui/ModalRolPermiso";
import { leerRoles } from "../services/rolService";
import { leerPermisos } from "../services/permisoService";
import {
  leerRolPermisos,
  crearRolPermiso,
  eliminarRolPermiso,
  leerPermisosDeRol,
} from "../services/rolPermisoService";
import { Layout } from "../components/layout/Layout";
import "./Pagina.css";

export const RolPermisoPagina = () => {
  const [rolPermisos, setRolPermisos] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permisos, setPermisos] = useState([]);
  const [relacionSeleccionada, setRelacionSeleccionada] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchPermisos();
    fetchRolPermisos();
  }, []);

  const fetchRoles = async () => setRoles(await leerRoles());
  const fetchPermisos = async () => setPermisos(await leerPermisos());
  const fetchRolPermisos = async () => setRolPermisos(await leerRolPermisos());

  const handleSave = async ({ id_rol, permisos }) => {
    try {
      const actuales = await leerPermisosDeRol(id_rol);
      const actualesIds = new Set(actuales.map((p) => Number(p.id_permiso)));
      const nuevosIds = new Set(permisos.map(Number));

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
      setOpenModal(false);
      setRelacionSeleccionada(null);
    } catch (error) {
      window.alert(error.message || 'Error al guardar permisos del rol');
    }
  };

  const handleEdit = async (relacion) => {
    const roleId = relacion.id_rol;
    const permisosDeRol = await leerPermisosDeRol(roleId);

    const permisosIds = [
      ...new Set(permisosDeRol.map((p) => Number(p.id_permiso))),
    ];

    setRelacionSeleccionada({
      id_rol: Number(roleId),
      permisosSeleccionados: permisosIds,
    });
    setOpenModal(true);
  };

  return (
    <Layout>
      <div className="pagina-contenedor">
        <h2 className="pagina-titulo">Asignación Rol - Permiso</h2>

        <button
          className="pagina-boton"
          onClick={() => {
            setRelacionSeleccionada(null);
            setOpenModal(true);
          }}
        >
          Asignar Permiso
        </button>

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
              {rolPermisos.map((rp) => (
                <tr key={rp.id_rol_permiso}>
                  <td className="ocultar-columna">{rp.id_rol_permiso}</td>
                  <td>{rp.rol}</td>
                  <td>{rp.permiso}</td>
                  <td className="tabla-acciones">
                    <button
                      onClick={() => handleEdit(rp)}
                      className="boton-accion boton-editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        eliminarRolPermiso(rp.id_rol_permiso).then(fetchRolPermisos)
                      }
                      className="boton-accion boton-eliminar"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {openModal && (
          <ModalRolPermiso
            onClose={() => {
              setOpenModal(false);
              setRelacionSeleccionada(null);
            }}
            onSave={handleSave}
            roles={roles}
            permisos={permisos}
            relacionSeleccionada={relacionSeleccionada}
          />
        )}
      </div>
    </Layout>
  );
};
