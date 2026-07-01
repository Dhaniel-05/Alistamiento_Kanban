/**
 * Componente de Tarjeta RAP para la Sábana
 * Tarjeta arrastrable con funcionalidad completa
 */

import { useDrag } from "react-dnd";
import { useEffect, useState, useMemo } from "react";
import { obtenerSiglas } from "../utils/obtenerSiglas";

const TarjetaRAPSabana = ({
  rap,
  asignacion = null,
  onDesasignarRAP,
  instructores = [],
  onAsignarInstructor,
  asignandoInstructor = false,
  onCopiarRAP,
}) => {
  // Configurar drag & drop
  const [{ isDragging }, drag] = useDrag({
    type: "RAP_SABANA",
    item: {
      id_rap: rap.id_rap,
      rap: rap,
      asignacion: asignacion
        ? {
          ...asignacion,
          id_rap: asignacion.id_rap || rap.id_rap,
        }
        : null,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Manejar desasignación
  const handleDesasignar = (e) => {
    e.stopPropagation();
    if (asignacion && asignacion.id_trimestre && onDesasignarRAP) {
      onDesasignarRAP(rap.id_rap, asignacion.id_trimestre);
    }
  };

  // (a) Atajo local cuando la tarjeta tiene foco: Alt+C para copiar
  const handleKeyDown = (e) => {
    // Usar Alt+C para copiar (evita conflicto con Ctrl en Chrome)
    if (e.altKey && (e.key === "c" || e.key === "C")) {
      if (onCopiarRAP) onCopiarRAP(rap, asignacion);
    }
    // Escape para cancelar modo copia (si el padre expone handler, puede escuchar)
    if (e.key === "Escape") {
      // delegar al padre mediante onCopiarRAP(null) no es ideal; el parent puede escuchar evento global Escape.
    }
  };

  // (b) Atajo global solo mientras el cursor esté sobre la tarjeta: Alt+C
  const [hover, setHover] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      if (!hover) return;
      // Corregir: 'altKey' (mayúscula K)
      if (e.altKey && (e.key === "c" || e.key === "C")) {
        if (onCopiarRAP) onCopiarRAP(rap, asignacion);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hover, rap, asignacion, onCopiarRAP]);

  // Detecta hover sin clic
  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  // Obtener horas del trimestre si hay asignación
  const horasTrimestre = asignacion?.horas_trimestre ?? null;
  const horasSemana = asignacion?.horas_semana ?? null;

  const nombreInstructorAsignado = useMemo(() => {
    if (asignacion?.instructor_asignado) {
      return asignacion.instructor_asignado;
    }
    if (asignacion?.id_instructor && Array.isArray(instructores)) {
      const instructor = instructores.find(
        (item) => Number(item.id_instructor) === Number(asignacion.id_instructor),
      );
      return instructor?.nombre || null;
    }
    return null;
  }, [asignacion, instructores]);

  const siglasInstructor = nombreInstructorAsignado
    ? obtenerSiglas(nombreInstructorAsignado)
    : '';

  return (
    <div
      ref={drag}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`tarjeta-rap-sabana ${isDragging ? "arrastrando" : ""}`}
      role="button"
      aria-label={`RAP ${rap.codigo_rap}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header con código y botón de eliminar */}
      <div className="tarjeta-rap-header">
        <div className="tarjeta-rap-codigo">{rap.codigo_rap || "N/A"}</div>
        {asignacion && (
          <button
            className="tarjeta-rap-eliminar"
            onClick={handleDesasignar}
            title="Quitar RAP del trimestre"
            disabled={asignandoInstructor}
          >
            ×
          </button>
        )}
      </div>

      {/* Nombre/Denominación del RAP */}
      <div className="tarjeta-rap-nombre">{rap.descripcion_rap || "Sin descripción"}</div>

      {/* Competencia del RAP */}
      {rap.nombre_competencia && (
        <div className="tarjeta-rap-competencia">
          <span className="tarjeta-rap-label">Competencia:</span>
          <span className="tarjeta-rap-valor">{rap.nombre_competencia}</span>
        </div>
      )}

      {/* Horas totales (duración máxima) */}
      {rap.duracion_maxima && (
        <div className="tarjeta-rap-horas-totales">
          <span className="tarjeta-rap-label">Horas Totales:</span>
          <span className="tarjeta-rap-valor">{rap.duracion_maxima}h</span>
        </div>
      )}


      {/* Información de horas */}
      <div className="tarjeta-rap-horas-info">
        {horasTrimestre !== null && horasTrimestre !== undefined && (
          <div className="tarjeta-rap-horas">
            <span className="tarjeta-rap-label">Trimestre:</span>
            <span className="tarjeta-rap-valor">{Number(horasTrimestre).toFixed(0)}h</span>
          </div>
        )}

        {horasSemana !== null && horasSemana !== undefined && (
          <div className="tarjeta-rap-horas">
            <span className="tarjeta-rap-label">Semana:</span>
            <span className="tarjeta-rap-valor">{Number(horasSemana).toFixed(1)}h</span>
          </div>
        )}
      </div>

      {asignacion?.id_rap_trimestre && (
        <div className="tarjeta-rap-instructor">
          <label className="tarjeta-rap-label">Instructor:</label>
          <div className="tarjeta-rap-instructor-row">
            {siglasInstructor ? (
              <span
                className="instructor-avatar instructor-avatar--asignado"
                title={nombreInstructorAsignado}
                aria-hidden
              >
                {siglasInstructor}
              </span>
            ) : (
              <span
                className="instructor-avatar instructor-avatar--vacio"
                title="Sin instructor asignado"
                aria-hidden
              />
            )}
            <select
              value={asignacion.id_instructor ?? ""}
              onChange={(e) => {
                const idInstructor = e.target.value ? parseInt(e.target.value, 10) : null;
                onAsignarInstructor(asignacion.id_rap_trimestre, idInstructor);
              }}
              disabled={asignandoInstructor}
              className="tarjeta-rap-select-instructor"
              onClick={(e) => e.stopPropagation()}
            >
              <option value=""> Sin Asignar </option>
              {Array.isArray(instructores) &&
                instructores.map((instructor) => (
                  <option key={instructor.id_instructor} value={instructor.id_instructor}>
                    {instructor.nombre}
                  </option>
                ))}
            </select>
          </div>

          {asignandoInstructor && <div className="tarjeta-rap-cargando">Asignando...</div>}
        </div>
      )}
    </div>
  );
};

export default TarjetaRAPSabana;
