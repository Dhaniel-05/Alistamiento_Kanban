/**
 * Componente de Bandeja de RAPs No Asignados
 */

import { useDrop } from 'react-dnd';
import { useMemo, useState } from 'react';
import TarjetaRAPSabana from './TarjetaRAPSabana';
import { logger } from '../utils/logger';
import { getRapSearchFields, matchesSearchQuery } from '../utils/searchText';

const BandejaNoAsignados = ({ raps = [], onDesasignarRAP, onClickRAP }) => {
  const [busqueda, setBusqueda] = useState('');

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'RAP_SABANA',
    drop: (item) => {
      logger.debug('🎯 Drop en bandeja no asignados:', item);

      if (item.asignacion) {
        onDesasignarRAP(
          item.asignacion.id_rap || item.id_rap,
          item.asignacion.id_trimestre,
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

  const rapsFiltrados = useMemo(
    () => raps.filter((rap) => matchesSearchQuery(busqueda, getRapSearchFields(rap))),
    [raps, busqueda],
  );

  const hayFiltroActivo = busqueda.trim().length > 0;

  return (
    <div
      ref={drop}
      className={`sabana-bandeja-no-asignados ${isOver && canDrop ? 'bandeja-over' : ''}`}
    >
      <div className="bandeja-header">
        <h3 className="bandeja-titulo">RAPs No Asignados</h3>
        <span className="bandeja-contador">
          {hayFiltroActivo
            ? `${rapsFiltrados.length} de ${raps.length}`
            : `${raps.length} RAP${raps.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      <input
        type="text"
        placeholder="Buscar RAP..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        className="bandeja-busqueda"
        aria-label="Buscar RAP por nombre, código o competencia"
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
            {hayFiltroActivo ? 'Sin resultados para la búsqueda' : 'Sin RAPs no asignados'}
          </div>
        )}
      </div>
    </div>
  );
};

export default BandejaNoAsignados;
