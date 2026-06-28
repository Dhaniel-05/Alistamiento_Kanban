import { useState, useEffect } from "react";
import ModalRol from "../components/ui/ModalRol";
import { leerRoles, crearRol, actualizarRol, eliminarRol } from "../services/rolService";
import Layout from "../components/layout/Layout";
import "./Pagina.css";

export const RolesPagina = () => {
  const [roles, setRoles] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => setRoles(await leerRoles());

  const handleSaveRol = async (rolData) => {
    if (rolSeleccionado) {
      await actualizarRol(rolData.id_rol, rolData);
    } else {
      await crearRol(rolData);
    }
    await fetchRoles();
    setOpenModal(false);
    setRolSeleccionado(null);
  };

  return (
    <Layout>
      <div className="pagina-contenedor">
        <h2 className="pagina-titulo">Gestión de Roles</h2>

        <button
          className="pagina-boton"
          onClick={() => {
            setRolSeleccionado(null);
            setOpenModal(true);
          }}
        >
          Crear Rol
        </button>

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
              {roles.map((r) => (
                <tr key={r.id_rol}>
                  <td className="ocultar-columna">{r.id_rol}</td>
                  <td>{r.nombre}</td>
                  <td className="tabla-acciones">
                    <button
                      onClick={() => {
                        setRolSeleccionado(r);
                        setOpenModal(true);
                      }}
                      className="boton-accion boton-editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => eliminarRol(r.id_rol).then(fetchRoles)}
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
          <ModalRol
            onClose={() => {
              setOpenModal(false);
              setRolSeleccionado(null);
            }}
            onSave={handleSaveRol}
            rolSeleccionado={rolSeleccionado}
          />
        )}
      </div>
    </Layout>
  );
};
