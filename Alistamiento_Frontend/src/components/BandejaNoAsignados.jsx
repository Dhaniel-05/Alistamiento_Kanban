/**
 * Componente de Bandeja de RAPs No Asignados
 */

import { useDrop } from 'react-dnd';
import TarjetaRAPSabana from './TarjetaRAPSabana';
import { useState } from 'react';
import { logger } from '../utils/logger';

const BandejaNoAsignados = ({ raps = [], onDesasignarRAP, onClickRAP }) => {

  // ✅ Hook de búsqueda (DEBE IR AQUÍ)
  const [busqueda, setBusqueda] = useState("");

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'RAP_SABANA',
    drop: (item) => {
      logger.debug('🎯 Drop en bandeja no asignados:', item);

      // ❌ AQUÍ NO VAN HOOKS
      // const [busqueda, setBusqueda] = useState("");  <-- esto estaba mal

      if (item.asignacion) {
        onDesasignarRAP(
          item.asignacion.id_rap || item.id_rap,
          item.asignacion.id_trimestre
        );
      } else {
        logger.warn('RAP sin asignación en bandeja:', item);
      }
      return { bandeja: 'no-asignados' };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleClickRAP = (rap) => {
    if (onClickRAP) onClickRAP(rap);
  };

  // ✅ Filtro de búsqueda
  const rapsFiltrados = raps.filter((rap) => {
    const texto = busqueda.toLowerCase();
    return (
      rap.nombre_competencia?.toLowerCase().includes(texto) ||
      rap.codigo_competencia?.toLowerCase().includes(texto) ||
      rap.codigo_norma?.toLowerCase().includes(texto)
    );
  });


  return (
    <div
      ref={drop}
      className={`sabana-bandeja-no-asignados ${isOver && canDrop ? 'bandeja-over' : ''}`}
    >
      <div className="bandeja-header">
        <h3 className="bandeja-titulo">RAPs No Asignados</h3>
        <span className="bandeja-contador">
          {raps.length} RAP{raps.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* 🔍 Barra de búsqueda */}
      <input
        type="text"
        placeholder="Buscar RAP..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="bandeja-busqueda"
      />

      <div className="bandeja-cards">
        {rapsFiltrados.length > 0 ? (
          rapsFiltrados.map((rap) => (
            <div
              key={`no-asignado-${rap.id_rap}`}
              className="rap-item-container"
              onClick={() => handleClickRAP(rap)}
              style={{ cursor: 'pointer' }}
            >
              <TarjetaRAPSabana rap={rap} asignacion={null} />
            </div>
          ))
        ) : (
          <div className="bandeja-vacio">
            Sin resultados
          </div>
        )}
      </div>
    </div>
  );
};

export default BandejaNoAsignados;
