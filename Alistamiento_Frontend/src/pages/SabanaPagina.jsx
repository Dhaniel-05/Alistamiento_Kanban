/**
 * Página de Gestión de Sábana por Ficha - Diseño Kanban
 */

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./SabanaPagina.css";
import ColumnaTrimestre from "../components/ColumnaTrimestre";
import BandejaNoAsignados from "../components/BandejaNoAsignados";
import { useParams } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { HeaderSabana } from "../components/layout/HeaderSabana";
import { useAuthContext } from "../context/AuthContext";
import { useSabana } from "../hooks/useSabana";

const ModalInfoRAP = ({ rap, competencia, rapsAsociados, onClose }) => {
  if (!rap || !competencia) return null;

  const safeRap = {
    codigo_rap: rap.codigo_rap || rap.codigo || "N/A",
    descripcion_rap: rap.descripcion_rap || rap.descripcion || rap.nombre || "N/A",
    duracion_rap: rap.duracion_rap || rap.duracion || "N/A",
  };

  const safeCompetencia = {
    codigo_competencia: competencia.codigo_competencia || competencia.codigo || "N/A",
    nombre_competencia: competencia.nombre_competencia || competencia.nombre || "N/A",
    duracion_maxima: competencia.duracion_maxima || competencia.duracion || "N/A",
    codigo_norma: competencia.codigo_norma || competencia.norma_codigo || "N/A",
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Información Detallada del RAP</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="rap-info-section">
            <h4>RAP Seleccionado</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Código RAP:</label>
                <span className="info-value">{safeRap.codigo_rap}</span>
              </div>
              <div className="info-item">
                <label>Descripción:</label>
                <span className="info-value">{safeRap.descripcion_rap}</span>
              </div>
              <div className="info-item">
                <label>Duración RAP:</label>
                <span className="info-value">{safeRap.duracion_rap} horas</span>
              </div>
            </div>
          </div>

          <div className="competencia-info-section">
            <h4>Competencia Asociada</h4>
            <div className="info-grid">
              <div className="info-item">
                <label>Código Competencia:</label>
                <span className="info-value">{safeCompetencia.codigo_competencia}</span>
              </div>
              <div className="info-item">
                <label>Nombre Competencia:</label>
                <span className="info-value">{safeCompetencia.nombre_competencia}</span>
              </div>
              <div className="info-item">
                <label>Duración Máxima:</label>
                <span className="info-value">{safeCompetencia.duracion_maxima} horas</span>
              </div>
              <div className="info-item">
                <label>Código Norma:</label>
                <span className="info-value">{safeCompetencia.codigo_norma}</span>
              </div>
            </div>
          </div>

          <div className="raps-asociados-section">
            <h4>RAPs Asociados a esta Competencia ({rapsAsociados.length})</h4>
            {rapsAsociados.length > 0 ? (
              <div className="raps-list">
                {rapsAsociados.map((rapAsociado) => (
                  <div
                    key={rapAsociado.id_rap || rapAsociado.id}
                    className={`rap-asociado-item ${(rapAsociado.id_rap || rapAsociado.id) === rap.id_rap ? "rap-actual" : ""}`}
                  >
                    <div className="rap-codigo">{rapAsociado.codigo_rap || rapAsociado.codigo || "N/A"}</div>
                    <div className="rap-descripcion">{rapAsociado.descripcion_rap || rapAsociado.descripcion || rapAsociado.nombre || "N/A"}</div>
                    <div className="rap-duracion">{rapAsociado.duracion_rap || rapAsociado.duracion || "N/A"} horas</div>
                    {(rapAsociado.id_rap || rapAsociado.id) === rap.id_rap && <div className="rap-actual-badge">Actual</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay otros RAPs asociados a esta competencia.</p>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export const SabanaPagina = () => {
  const { idFicha } = useParams();
  const { user } = useAuthContext();

  const {
    fichaSeleccionada,
    sabana,
    cargando,
    error,
    procesando,
    infoFicha,
    infoPrograma,
    instructores,
    asignandoInstructor,
    modalAbierto,
    rapSeleccionado,
    competenciaSeleccionada,
    rapsAsociados,
    modoCopiar,
    rapsOrganizados,
    handleAsignarInstructor,
    copiarRAP,
    handleClickRAP,
    cerrarModal,
    pegarRAPEnTrimestre,
    obtenerIdTrimestre,
    handleDropRAP,
    handleDesasignarRAP,
    obtenerNumeroTrimestres,
    handleIrAlDashboard,
  } = useSabana(idFicha, user);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="sabana-layout-completo">
        <HeaderSabana ficha={infoFicha} programa={infoPrograma} gestor={user} />

        <div className="sabana-contenedor-con-sidebar">
          <Sidebar fichaInfo={infoFicha} />

          <div className="sabana-contenido-principal">
            <div className="sabana-contenedor">
              {!fichaSeleccionada && !cargando && (
                <div className="sabana-seleccion-ficha">
                  <div className="seleccion-ficha-content">
                    <h2>Selecciona una Ficha</h2>
                    <p>Para ver la sábana de una ficha, por favor selecciona una desde el dashboard del instructor.</p>
                    <button type="button" className="btn-ir-dashboard" onClick={handleIrAlDashboard}>
                      Ir al Dashboard
                    </button>
                  </div>
                </div>
              )}

              {fichaSeleccionada && (
                <>
                  <div className="sabana-header">
                    <h2 className="sabana-titulo">Gestión de Sábana</h2>
                    <p className="sabana-subtitulo">
                      Ficha ID: {fichaSeleccionada} - Asigna RAPs a trimestres usando drag & drop
                    </p>
                    <p className="sabana-instruccion">
                      💡 <strong>Tip:</strong> Haz clic en cualquier RAP para ver información detallada de su
                      competencia
                    </p>
                  </div>

                  {error && (
                    <div className="sabana-error">
                      <strong>Error:</strong> {error}
                    </div>
                  )}

                  {cargando && (
                    <div className="sabana-cargando">
                      <div className="spinner"></div>
                      Cargando información...
                    </div>
                  )}

                  {procesando.size > 0 && (
                    <div className="sabana-procesando">Procesando cambios... ({procesando.size})</div>
                  )}

                  {sabana && Array.isArray(sabana) && sabana.length > 0 ? (
                    <div className="sabana-kanban-contenedor">
                      <BandejaNoAsignados
                        raps={rapsOrganizados.noAsignados}
                        onDesasignarRAP={handleDesasignarRAP}
                        onClickRAP={handleClickRAP}
                      />

                      <div className="sabana-columnas-trimestres">
                        {Array.from({ length: obtenerNumeroTrimestres() }, (_, i) => {
                          const noTrimestre = i + 1;
                          const idTrimestre = obtenerIdTrimestre(noTrimestre);

                          if (!idTrimestre) return null;

                          const datosTrimestre = rapsOrganizados.porTrimestre[idTrimestre];
                          const rapsTrimestre = datosTrimestre ? datosTrimestre.raps : [];

                          return (
                            <ColumnaTrimestre
                              key={`trimestre-${noTrimestre}`}
                              noTrimestre={noTrimestre}
                              idTrimestre={idTrimestre}
                              raps={rapsTrimestre}
                              onDropRAP={handleDropRAP}
                              onDesasignarRAP={handleDesasignarRAP}
                              onClickRAP={handleClickRAP}
                              instructores={instructores}
                              onAsignarInstructor={handleAsignarInstructor}
                              asignandoInstructor={asignandoInstructor}
                              onCopiarRAP={copiarRAP}
                              onPegarRAP={pegarRAPEnTrimestre}
                              modoCopiar={modoCopiar}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    !cargando
                    && fichaSeleccionada && (
                      <div className="sabana-vacio">
                        <p>No hay RAPs disponibles para esta ficha.</p>
                        <p>La ficha puede no tener un programa asignado o no hay RAPs configurados.</p>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {modalAbierto && (
          <ModalInfoRAP
            rap={rapSeleccionado}
            competencia={competenciaSeleccionada}
            rapsAsociados={rapsAsociados}
            onClose={cerrarModal}
          />
        )}
      </div>
    </DndProvider>
  );
};
