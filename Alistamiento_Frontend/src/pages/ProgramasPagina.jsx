import { useState, useEffect } from "react";
import { logger } from "../utils/logger";
import { ModalPrograma } from "../components/ui/ModalPrograma";
import { ModalConfirmacion } from "../components/ui/ModalConfirmacion";
import "./Pagina.css";
import { programaService } from "../services/programaService";

export const ProgramasPagina = () => {
  const [programas, setProgramas] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
  const [programaAEliminar, setProgramaAEliminar] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Cargar programas desde la API
  useEffect(() => {
    cargarProgramas();
  }, []);

  const cargarProgramas = async () => {
    try {
      setCargando(true);
      setError(null);
      
      logger.debug("🔄 Cargando programas...");
      const datos = await programaService.obtenerProgramas();
      setProgramas(datos);
      logger.debug(`✅ Programas cargados: ${datos.length}`);
      
    } catch (error) {
      logger.error("❌ Error cargando programas:", error);
      setError("Error al cargar programas. " + error.message);
      setProgramas([]);
    } finally {
      setCargando(false);
    }
  };

  const handleAddPrograma = (nuevoPrograma) => {
    // Para mantener consistencia mientras no implementas la API completa
    setProgramas((prev) => [...prev, {
      ...nuevoPrograma,
      id_programa: Date.now(), // ID temporal
      total_fichas: 0
    }]);
    setOpenModal(false);
  };

  const abrirConfirmacionEliminar = (programa) => {
    setProgramaAEliminar(programa);
    setModalConfirmOpen(true);
  };

  const handleDeletePrograma = async () => {
    if (!programaAEliminar) return;

    try {
      setCargando(true);
      setError(null);
      
      const programaId = programaAEliminar.id_programa;
      logger.debug(`🗑️ Eliminando programa ID: ${programaId}`);
      
      // Llamar al servicio que elimina programa y fichas
      const resultado = await programaService.eliminarPrograma(programaId);
      
      logger.debug("✅ Resultado de eliminación:", resultado);
      
      // Actualizar lista
      setProgramas(prev => 
        prev.filter(p => p.id_programa !== programaId)
      );
      
      // Mostrar mensaje de éxito con detalles
      alert(`✅ ${resultado.mensaje}\n\nFichas eliminadas: ${resultado.fichasEliminadas || 0}\nPrograma: ${resultado.programa || programaAEliminar.nombre_programa}`);
      
      // Cerrar modal
      setModalConfirmOpen(false);
      setProgramaAEliminar(null);
      
    } catch (error) {
      logger.error("❌ Error eliminando programa:", error);
      setError("Error al eliminar programa: " + error.message);
      alert("❌ Error al eliminar el programa:\n" + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Formatear número de fichas
  const formatearFichas = (total) => {
    if (total === 0) return "Sin fichas";
    if (total === 1) return "1 ficha";
    return `${total} fichas`;
  };

  return (
    <div className="pagina-contenedor">
      {/* Encabezado */}
      <div className="pagina-header">
        <h2 className="pagina-titulo">Gestión de Programas</h2>
        <p className="pagina-subtitulo">
          Administrar programas de formación y sus fichas asociadas
        </p>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mensaje-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Botón Crear */}
      <div className="pagina-boton-contenedor">
        <button 
          className="pagina-boton" 
          onClick={() => setOpenModal(true)}
          disabled={cargando}
        >
          {cargando ? "Cargando..." : "+ Crear Programa"}
        </button>
        
        <button 
          className="pagina-boton-secundario" 
          onClick={cargarProgramas}
          disabled={cargando}
        >
          {cargando ? "Actualizando..." : "🔄 Actualizar"}
        </button>
      </div>

      {/* Lista de Programas */}
      <div className="lista-usuarios">
        <h3 className="lista-titulo">
          Lista de Programas{" "}
          <span className="lista-subtexto">
            {programas.length} {programas.length === 1 ? 'programa' : 'programas'} registrados
          </span>
        </h3>

        {cargando && programas.length === 0 ? (
          <div className="cargando-contenedor">
            <div className="spinner"></div>
            <p className="cargando-texto">Cargando programas...</p>
          </div>
        ) : programas.length > 0 ? (
          <div className="usuarios-contenedor">
            {programas.map((programa) => (
              <div key={programa.id_programa} className="usuario-card">
                <div className="usuario-info-contenedor">
                  <div className="usuario-info">
                    <p className="usuario-nombre">
                      {programa.nombre_programa}
                    </p>
                    <p className="usuario-email">
                      <strong>Código:</strong> {programa.codigo_programa}<br />
                      <strong>Fichas asociadas:</strong> {formatearFichas(programa.total_fichas)}
                    </p>
                  </div>
                </div>
                <div className="usuario-detalles">
                  <div className="usuario-acciones">
                    <button
                      className="boton-editar"
                      onClick={() => {
                        // Implementar edición si necesitas
                        alert("Funcionalidad de edición pendiente");
                      }}
                      disabled={cargando}
                    >
                      Editar
                    </button>
                    <button
                      className="boton-eliminar"
                      onClick={() => abrirConfirmacionEliminar(programa)}
                      disabled={cargando}
                      title={programa.total_fichas > 0 ? 
                        `Eliminar programa y ${programa.total_fichas} fichas asociadas` : 
                        "Eliminar programa"}
                    >
                      {cargando ? "..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="sin-datos">
            <p className="tabla-vacia">No hay programas registrados</p>
            <button 
              className="btn-recargar" 
              onClick={cargarProgramas}
              disabled={cargando}
            >
              {cargando ? "Cargando..." : "Recargar datos"}
            </button>
          </div>
        )}
      </div>

      {/* Modal Crear Programa */}
      {openModal && (
        <ModalPrograma 
          onClose={() => setOpenModal(false)} 
          onSave={handleAddPrograma} 
        />
      )}

      {/* Modal de Confirmación para Eliminar */}
      {modalConfirmOpen && programaAEliminar && (
        <ModalConfirmacion
          onClose={() => {
            setModalConfirmOpen(false);
            setProgramaAEliminar(null);
          }}
          onConfirm={handleDeletePrograma}
          titulo="Eliminar Programa"
          mensaje={
            <div>
              <p>
                ¿Está seguro de eliminar el programa 
                <strong> "{programaAEliminar.nombre_programa}"</strong>?
              </p>
              
              {programaAEliminar.total_fichas > 0 && (
                <div className="advertencia-importante">
                  <p><strong>⚠️ ADVERTENCIA IMPORTANTE:</strong></p>
                  <p>Esta acción también eliminará <strong>{programaAEliminar.total_fichas} fichas</strong> asociadas a este programa, incluyendo:</p>
                  <ul>
                    <li>Todas las fichas del programa</li>
                    <li>Todos los trimestres de esas fichas</li>
                    <li>Todas las asignaciones de RAPs a trimestres</li>
                    <li>Las asignaciones de instructores a esas fichas</li>
                    <li>Todos los RAPs y competencias del programa</li>
                  </ul>
                  <p className="texto-rojo"><strong>⚠️ Esta acción NO se puede deshacer.</strong></p>
                </div>
              )}
              
              <p className="texto-advertencia">
                <small>Si el programa no tiene fichas asociadas, solo se eliminará el programa.</small>
              </p>
            </div>
          }
          textoConfirmar={cargando ? "Eliminando..." : "Sí, eliminar todo"}
          textoCancelar="Cancelar"
          tipo="peligro"
        />
      )}
    </div>
  );
};