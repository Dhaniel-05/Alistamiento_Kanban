import { useState, useEffect } from "react";
import { ModalPermiso } from "../components/ui/ModalPermiso";
import {
  leerPermisos,
  crearPermiso,
  actualizarPermiso,
  eliminarPermiso,
} from "../services/permisoService";
import { Layout } from "../components/layout/Layout";
import "./Pagina.css";

export const PermisosPagina = () => {
  const [permisos, setPermisos] = useState([]);
  const [permisoSeleccionado, setPermisoSeleccionado] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchPermisos();
  }, []);

  const fetchPermisos = async () => setPermisos(await leerPermisos());

  const handleSavePermiso = async (permisoData) => {
    if (permisoSeleccionado) {
      await actualizarPermiso(permisoData.id_permiso, permisoData);
    } else {
      await crearPermiso(permisoData);
    }
    await fetchPermisos();
    setOpenModal(false);
    setPermisoSeleccionado(null);
  };

  return (
    <Layout>
      <div className="pagina-contenedor">
        <h2 className="pagina-titulo">Gestión de Permisos</h2>

        <button
          className="pagina-boton"
          onClick={() => {
            setPermisoSeleccionado(null);
            setOpenModal(true);
          }}
        >
          Crear Permiso
        </button>

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
              {permisos.map((p) => (
                <tr key={p.id_permiso}>
                  <td className="ocultar-columna">{p.id_permiso}</td>
                  <td>{p.nombre}</td>
                  <td>{p.descripcion}</td>
                  <td className="tabla-acciones">
                    <button
                      onClick={() => {
                        setPermisoSeleccionado(p);
                        setOpenModal(true);
                      }}
                      className="boton-accion boton-editar"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() =>
                        eliminarPermiso(p.id_permiso).then(fetchPermisos)
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
          <ModalPermiso
            onClose={() => {
              setOpenModal(false);
              setPermisoSeleccionado(null);
            }}
            onSave={handleSavePermiso}
            permisoSeleccionado={permisoSeleccionado}
          />
        )}
      </div>
    </Layout>
  );
};
