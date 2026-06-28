// src/pages/planeacion/components/VistaPlaneacion.jsx - VERSIÓN ACTUALIZADA
import React from 'react';
import { logger } from '../../../utils/logger';
import './NuevaPlaneacionForm.css';

export const VistaPlaneacion = ({ planeacion, onClose, user }) => {
  logger.debug('🔍 DEBUG - Datos recibidos en VistaPlaneacion:', planeacion);

  if (!planeacion) {
    return (
      <div className="nueva-planeacion-form">
        <div className="main-header">
          <button className="btn-back" onClick={onClose}>
            <svg className="back-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Volver al Listado
          </button>
          <div className="header-info">
            <h1 className="header-title">Visualización de Planeación Pedagógica</h1>
            <div className="header-subtitle">
              ERROR: No se recibieron datos de la planeación
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extraer datos con múltiples opciones de nombres de campos
  const infoFicha = planeacion.info_ficha || {
    ficha: planeacion.ficha,
    programa: planeacion.programa,
    proyecto: planeacion.proyecto
  };
  
  const raps = planeacion.raps || [];
  const trimestre = planeacion.trimestre || '1';
  const fechaCreacion = planeacion.fecha_creacion;

  logger.debug('📊 Datos extraídos:', { infoFicha, raps, trimestre, fechaCreacion });

  return (
    <div className="nueva-planeacion-form">
      {/* ENCABEZADO PRINCIPAL */}
      <div className="main-header">
        <button className="btn-back" onClick={onClose}>
          <svg className="back-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Volver al Listado
        </button>
        <div className="header-info">
          <h1 className="header-title">Visualización de Planeación Pedagógica</h1>
          <div className="header-subtitle">
            Ficha: {infoFicha.ficha?.codigo_ficha || planeacion.id_ficha || 'No especificada'} |
            Programa: {infoFicha.programa?.nombre_programa || 'No asignado'} |
            Trimestre: {trimestre}
          </div>
        </div>
        <div className="btn-guardar" style={{ background: '#6b7280', cursor: 'default' }}>
          <svg className="save-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Solo Lectura
        </div>
      </div>

      {/* CONTENEDOR DEL FORMULARIO */}
      <div className="form-content">
        {/* SECCIÓN 1: CONFIGURACIÓN INICIAL */}
        <section className="configuracion-section">
          <div className="section-header-inline">
            <div>
              <h2 className="section-title-inline">Configuración de la Planeación</h2>
              <p className="section-description-inline">
                Información general de la planeación pedagógica
              </p>
            </div>
          </div>

          <div className="configuracion-grid">
            <div className="campo-grupo">
              <label className="campo-label-block">Trimestre</label>
              <div className="dato-valor">
                Trimestre {trimestre}
              </div>
            </div>

            <div className="campo-grupo">
              <label className="campo-label-block">Fecha de Elaboración</label>
              <div className="dato-valor">
                {fechaCreacion ? new Date(fechaCreacion).toLocaleDateString('es-ES') : 'No especificada'}
              </div>
            </div>
          </div>

          <div className="trimestre-info">
            <div className="trimestre-seleccionado">
              <strong>Planeación del Trimestre {trimestre}</strong>
            </div>
            <div className="info-raps-disponibles">
              <strong>Total de RAPs en esta planeación:</strong> {raps.length}
            </div>
          </div>

          {/* Lista de RAPs de la planeación */}
          {raps.length > 0 ? (
            <div className="raps-agregados">
              <h3 className="raps-titulo">RAPs incluidos en esta planeación ({raps.length})</h3>
              <div className="raps-lista">
                {raps.map((rap, index) => (
                  <div key={rap.id_rap || rap.id || index} className="rap-item-header">
                    <span className="rap-info">
                      {rap.codigo_rap || rap.codigo} - {rap.nombre_rap || rap.nombre}
                      {rap.horas_trimestre && <span className="rap-horas"> ({rap.horas_trimestre}h)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="raps-agregados">
              <h3 className="raps-titulo">No se encontraron RAPs en esta planeación</h3>
              <p style={{color: '#666', fontSize: '0.875rem'}}>
                Esta planeación no contiene información de RAPs o los datos no están disponibles.
              </p>
            </div>
          )}

          <div className="separator"></div>
        </section>

        {/* SECCIÓN 2: INFORMACIÓN DEL PROGRAMA Y PROYECTO */}
        <section className="programa-section">
          <h2 className="section-title">Información del Programa y Proyecto</h2>
          <p className="section-description">
            Datos del programa de formación y proyecto formativo - Formato GFPI-F-134
          </p>

          <div className="datos-lista">
            <div className="dato-item">
              <h3 className="dato-titulo">Fecha de Elaboración</h3>
              <div className="dato-valor">
                {fechaCreacion ? new Date(fechaCreacion).toLocaleDateString('es-ES') : 'No especificada'}
              </div>
            </div>

            <div className="dato-item">
              <h3 className="dato-titulo">Denominación del Programa de Formación</h3>
              <div className="dato-valor">
                {infoFicha.programa?.nombre_programa || infoFicha.ficha?.nombre_programa || 'Programa no asignado'}
              </div>
            </div>

            <div className="dato-item">
              <h3 className="dato-titulo">Modalidad de Formación</h3>
              <div className="dato-valor">
                Presencial
              </div>
            </div>

            <div className="dato-item">
              <h3 className="dato-titulo">Código del Programa</h3>
              <div className="dato-valor">
                {infoFicha.programa?.codigo_programa || infoFicha.ficha?.codigo_programa || infoFicha.programa?.codigo || 'No disponible'}
              </div>
            </div>

            <div className="dato-item">
              <h3 className="dato-titulo">Versión del Programa</h3>
              <div className="dato-valor">
                {infoFicha.programa?.version_programa || infoFicha.programa?.version || 'v1.0'}
              </div>
            </div>

            <div className="dato-item">
              <h3 className="dato-titulo">Nombre del Proyecto Formativo</h3>
              <div className="dato-valor">
                {infoFicha.proyecto?.nombre_proyecto || infoFicha.proyecto?.nombre || 'Proyecto no asignado'}
              </div>
            </div>

            <div className="dato-item">
              <h3 className="dato-titulo">Código del Proyecto</h3>
              <div className="dato-valor">
                {infoFicha.proyecto?.codigo_proyecto || infoFicha.proyecto?.codigo || 'No disponible'}
              </div>
            </div>

            <div className="dato-item">
              <h3 className="dato-titulo">Fase del Proyecto Formativo</h3>
              <div className="dato-valor">
                {infoFicha.proyecto?.fase_proyecto || infoFicha.proyecto?.fase || 'Por definir'}
              </div>
            </div>

            <div className="dato-item full-width">
              <h3 className="dato-titulo">Actividad del Proyecto Formativo</h3>
              <div className="dato-valor">
                {infoFicha.proyecto?.actividad_proyecto || infoFicha.proyecto?.actividad || 'Actividades de formación según RAPs'}
              </div>
            </div>
          </div>

          <div className="separator"></div>
        </section>

        {/* FORMULARIOS POR CADA RAP */}
        {raps.length > 0 ? (
          raps.map((rap, index) => (
            <RapSection key={rap.id_rap || rap.id || index} rap={rap} planeacion={planeacion} user={user} />
          ))
        ) : (
          <section className="configuracion-section">
            <h3>No hay RAPs para mostrar</h3>
            <p>Esta planeación no contiene información de RAPs detallada.</p>
          </section>
        )}

        {/* BOTÓN DE CERRAR */}
        <div className="form-actions">
          <button type="button" className="btn btn-cancel" onClick={onClose}>
            Cerrar Vista
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente separado para cada RAP
const RapSection = ({ rap, planeacion, user }) => {
  // Función para obtener el nombre de la estrategia didáctica
  const obtenerNombreEstrategia = (valor) => {
    const estrategias = {
      'aprendizaje-basado-proyectos': 'Aprendizaje Basado en Proyectos',
      'estudio-casos': 'Estudio de Casos',
      'aprendizaje-colaborativo': 'Aprendizaje Colaborativo',
      'aprendizaje-problemas': 'Aprendizaje Basado en Problemas'
    };
    return estrategias[valor] || valor || 'No especificada';
  };

  // Función para obtener el nombre del ambiente de aprendizaje
  const obtenerNombreAmbiente = (valor) => {
    const ambientes = {
      'aula': 'Aula de Clase',
      'laboratorio': 'Laboratorio de Sistemas',
      'biblioteca': 'Biblioteca',
      'empresa': 'Empresa',
      'virtual': 'Ambiente Virtual'
    };
    return ambientes[valor] || valor || 'No especificado';
  };

  return (
    <section className="rap-form-section expandido">
      <div className="rap-form-header">
        <h3 className="rap-form-titulo">
          {rap.codigo_rap || rap.codigo} - {rap.nombre_rap || rap.nombre}
          {rap.horas_trimestre && <span className="rap-horas-header"> ({rap.horas_trimestre} horas totales)</span>}
        </h3>
        <div className="rap-form-controls">
          <span className="btn-toggle-acordeon" style={{ background: '#10b981', cursor: 'default' }}>
            ✓
          </span>
        </div>
      </div>

      <div className="rap-form-content">
        <section className="competencia-section">
          <h2 className="section-title">Competencia y Resultado de Aprendizaje</h2>
          <p className="section-description">
            Información específica del RAP
          </p>

          <div className="competencia-info">
            <div className="info-field">
              <h3 className="info-label">Competencia</h3>
              <div className="info-content">
                {rap.competencia || 'No especificada'}
              </div>
            </div>

            <div className="info-field">
              <h3 className="info-label">Resultado de Aprendizaje</h3>
              <div className="info-content">
                {rap.nombre_rap || rap.nombre || 'No especificado'}
              </div>
            </div>

            <div className="saberes-grid">
              <div className="info-field">
                <h3 className="info-label">Saberes de Conceptos y Principios</h3>
                <div className="info-content">
                  {rap.saberes_conceptos || 'No especificados'}
                </div>
              </div>

              <div className="info-field">
                <h3 className="info-label">Saberes de Proceso</h3>
                <div className="info-content">
                  {rap.saberes_proceso || 'No especificados'}
                </div>
              </div>
            </div>

            <div className="info-field">
              <h3 className="info-label">Criterios de Evaluación</h3>
              <div className="info-content">
                {rap.criterios_evaluacion || 'No especificados'}
              </div>
            </div>

            <div className="info-field">
              <h3 className="info-label">Instructor Responsable</h3>
              <div className="info-content">
                {planeacion.instructor?.nombre || user?.nombre} {planeacion.instructor?.apellido || user?.apellido}
              </div>
            </div>

            <div className="rap-info-adicional">
              <div className="info-field">
                <h3 className="info-label">Código RAP</h3>
                <div className="info-content">
                  {rap.codigo_rap || rap.codigo}
                </div>
              </div>

              {rap.codigo_norma && (
                <div className="info-field">
                  <h3 className="info-label">Código Norma</h3>
                  <div className="info-content">
                    {rap.codigo_norma}
                  </div>
                </div>
              )}

              {rap.horas_trimestre && (
                <div className="info-field">
                  <h3 className="info-label">Horas en este Trimestre</h3>
                  <div className="info-content">
                    {rap.horas_trimestre} horas
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="separator"></div>
        </section>

        <section className="planeacion-section">
          <h2 className="section-title">Planeación Detallada - {rap.codigo_rap || rap.codigo}</h2>
          <p className="section-description">
            Información completada por el instructor para este RAP
          </p>

          <div className="planeacion-campos">
            <div className="campo-editable">
              <label className="campo-editable-label">Actividades de Aprendizaje a Desarrollar</label>
              <div className="info-content" style={{ minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                {rap.actividades_aprendizaje || rap.actividadesAprendizaje || 'No especificadas'}
              </div>
            </div>

            <div className="duraciones-grid">
              <div className="campo-editable">
                <label className="campo-editable-label">Duración Directa (80% - Horas)</label>
                <div className="info-content">
                  {rap.duracion_directa || rap.duracionDirecta || '0'} horas
                </div>
              </div>

              <div className="campo-editable">
                <label className="campo-editable-label">Duración Independiente (20% - Horas)</label>
                <div className="info-content">
                  {rap.duracion_independiente || rap.duracionIndependiente || '0'} horas
                </div>
              </div>
            </div>

            <div className="campo-editable">
              <label className="campo-editable-label">Descripción de Evidencia de Aprendizaje</label>
              <div className="info-content" style={{ minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                {rap.descripcion_evidencia || rap.descripcionEvidencia || 'No especificada'}
              </div>
            </div>

            <div className="campo-editable">
              <label className="campo-editable-label">Estrategias Didácticas Activas</label>
              <div className="info-content">
                {obtenerNombreEstrategia(rap.estrategias_didacticas || rap.estrategiasDidacticas)}
              </div>
            </div>

            <div className="campo-editable">
              <label className="campo-editable-label">Ambientes de Aprendizaje Tipificados</label>
              <div className="info-content">
                {obtenerNombreAmbiente(rap.ambientes_aprendizaje || rap.ambientesAprendizaje)}
              </div>
            </div>

            <div className="campo-editable">
              <label className="campo-editable-label">Materiales de Formación</label>
              <div className="info-content" style={{ minHeight: '80px', whiteSpace: 'pre-wrap' }}>
                {rap.materiales_formacion || rap.materialesFormacion || 'No especificados'}
              </div>
            </div>

            <div className="campo-editable">
              <label className="campo-editable-label">Observaciones</label>
              <div className="info-content" style={{ minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                {rap.observaciones || 'Ninguna'}
              </div>
            </div>
          </div>

          <div className="separator"></div>
        </section>
      </div>
    </section>
  );
};