import { useState } from "react";
import { logger } from "../utils/logger";
import "./Pagina.css";
import { ModalFicha } from "../components/ui/ModalFicha";
import { useFichas } from "../hooks/useFichas";

export const FichasPagina = () => {
  const [fichaSeleccionada, setFichaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const {
    fichas,
    programas,
    cargarFichas,
    guardarFichaEnApi,
  } = useFichas({
    listEndpoint: "/fichas",
    loadProgramas: true,
  });

  const abrirModal = (ficha = null) => {
    setFichaSeleccionada(ficha);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setFichaSeleccionada(null);
    setMostrarModal(false);
  };

  const guardarFicha = async (data) => {
    try {
      const fichaData = {
        id_programa: data.codigoPrograma,
        codigo_ficha: data.codigoFicha,
        modalidad: data.modalidad,
        jornada: data.jornada,
        ambiente: data.ubicacion,
        fecha_inicio: data.fechaInicio,
        fecha_final: data.fechaFin,
        cantidad_trimestre: data.cantidad_trimestre,
        id_instructor: data.instructores && data.instructores.length > 0
          ? data.instructores[0]
          : null,
      };

      await guardarFichaEnApi(fichaData);
      cerrarModal();
    } catch (error) {
      logger.error(" [FRONTEND] Error guardando ficha:", error);
      alert(`Error al guardar la ficha: ${error.message}`);
    }
  };

  const toggleEstado = async () => {
    try {
      await cargarFichas();
    } catch (error) {
      logger.error("Error cambiando estado:", error);
    }
  };

  return (
    <div className="pagina-contenedor">
      <div className="pagina-header">
        <h2 className="pagina-titulo">Gestión de Fichas</h2>
        <p className="pagina-subtitulo">
          Administra las fichas asociadas a los programas de formación
        </p>
      </div>

      <div className="pagina-boton-contenedor">
        <button className="pagina-boton" type="button" onClick={() => abrirModal()}>
          + Crear Ficha
        </button>
      </div>

      <div className="lista-usuarios">
        <h3 className="lista-titulo">
          Lista de Fichas{" "}
          <span className="lista-subtexto">{fichas.length} registradas</span>
        </h3>

        {fichas.length > 0 ? (
          <div className="usuarios-contenedor">
            {fichas.map((ficha) => (
              <div key={ficha.id_ficha} className="usuario-card">
                <div className="usuario-info-contenedor">
                  <div className="usuario-info">
                    <p className="usuario-nombre">{ficha.codigo_ficha}</p>
                    <p className="usuario-email">{ficha.nombre_programa}</p>
                  </div>
                </div>
                <div className="usuario-detalles">
                  <span className="usuario-estado activo">
                    Activa
                  </span>
                  <div className="usuario-acciones">
                    <button
                      type="button"
                      className="boton-editar"
                      onClick={() => abrirModal(ficha)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="boton-estado boton-inhabilitar"
                      onClick={() => toggleEstado(ficha.id_ficha)}
                    >
                      Inhabilitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="tabla-vacia">No hay fichas registradas</p>
        )}
      </div>

      {mostrarModal && (
        <ModalFicha
          onClose={cerrarModal}
          onSave={guardarFicha}
          fichaSeleccionada={fichaSeleccionada}
          programas={programas}
        />
      )}
    </div>
  );
};
