/**
 * Componente de Columna de Trimestre
 * Columna tipo Kanban que funciona como drop zone para RAPs.
 */

import { useDrop } from "react-dnd";
import { useEffect, useState } from "react";
import { logger } from "../utils/logger";
import TarjetaRAPSabana from "./TarjetaRAPSabana";

const ColumnaTrimestre = ({
  noTrimestre,
  idTrimestre,
  nombreFase,
  raps = [],
  onDropRAP,
  onClickRAP, // Nueva prop para manejar clics en RAPs
  instructores = [],
  onAsignarInstructor,
  asignandoInstructor,
  onDesasignarRAP, // <-- aceptar la prop y pasarla hacia la tarjeta
  modoCopiar = false,
  onCopiarRAP,
  onPegarRAP
}) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "RAP_SABANA",
    drop: (item) => {
      // Si el RAP ya está asignado a este trimestre, no hacer nada
      if (item.asignacion && item.asignacion.id_trimestre === idTrimestre) {
        logger.debug("RAP ya está en este trimestre, ignorando...");
        return;
      }

      // Llamar al callback para asignar el RAP a este trimestre
      onDropRAP(item.id_rap, idTrimestre, item.asignacion);
      return { trimestre: noTrimestre };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const [hover, setHover] = useState(false);

  const handleMouseEnter = () => setHover(true);
  const handleMouseLeave = () => setHover(false);

  // Detectar Alt+V en hover
  useEffect(() => {
    const handler = (e) => {
      if (!modoCopiar) return;
      if (!hover) return;
      if (e.altKey && (e.key === "V" || e.key === "v")) {
        if (onPegarRAP) onPegarRAP(idTrimestre);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hover, modoCopiar, idTrimestre, onPegarRAP]);

  // Handler para pegar: puede ser activado por click en el fondo de la columna
  const handlePegarClick = (e) => {
    // Solo activar pegado si el click fue en el contenedor actual (no en una tarjeta hija)
    if (e.currentTarget !== e.target) return;
    if (modoCopiar && onPegarRAP) {
      onPegarRAP(idTrimestre);
    }
  };

  // Keydown handler para detectar Ctrl+V cuando la columna tenga foco
  const handleKeyDown = (e) => {
    if (modoCopiar && e.altKey && (e.key === "v" || e.key === "V")) {
      if (onPegarRAP) onPegarRAP(idTrimestre);
    }
  };

  // Manejar clic en un RAP
  const handleClickRAP = (rap) => {
    if (onClickRAP) {
      onClickRAP(rap);
    }
  };

  // Calcular total de horas del trimestre
  const totalHoras = raps.reduce((sum, rap) => {
    const horas = rap.asignacion?.horas_trimestre || 0;
    return sum + (horas || 0);
  }, 0);

  return (
    <div
      ref={drop}
      tabIndex={0}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      onClick={handlePegarClick}
      className={`columna-trimestre ${isOver && canDrop ? "columna-over" : ""}`}
      role="region"
      aria-label={`Trimestre ${noTrimestre}`}
    >
      {/* Encabezado de la columna */}
      <div className="columna-trimestre-header">
        <h3 className="columna-trimestre-titulo">Trimestre {noTrimestre}</h3>
        {nombreFase && (
          <p className="columna-trimestre-fase">{nombreFase}</p>
        )}
        <div className="columna-trimestre-info">
          <span className="columna-trimestre-contador">
            {raps.length} RAP{raps.length !== 1 ? "s" : ""}
          </span>
          {totalHoras > 0 && <span className="columna-trimestre-horas">{Number(totalHoras).toFixed(0)} h</span>}
        </div>
      </div>

      {/* Lista de tarjetas RAP en este trimestre */}
      <div className="columna-trimestre-cards">
        {raps.length > 0 ? (
          raps.map((rapData) => (
            <div
              key={`${rapData.rap.id_rap}-${idTrimestre}`}
              className="rap-item-container"
              onClick={() => handleClickRAP(rapData.rap)}
              style={{ cursor: "pointer" }} // Indicar que es clickeable
            >
              <TarjetaRAPSabana
                rap={rapData.rap}
                asignacion={rapData.asignacion}
                instructores={instructores}
                onAsignarInstructor={onAsignarInstructor}
                asignandoInstructor={asignandoInstructor}
                onDesasignarRAP={onDesasignarRAP} // <-- pasar la prop aquí
                onCopiarRAP={onCopiarRAP}
              />
            </div>
          ))
        ) : (
          <div className="columna-trimestre-vacio">Arrastra RAPs aquí</div>
        )}
      </div>
    </div>
  );
};

export default ColumnaTrimestre;
