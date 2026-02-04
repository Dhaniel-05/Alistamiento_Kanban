// pages/ProgramFormAdmin.tsx

import React, { useState } from 'react';
import { FileText, X, Save } from 'lucide-react';
import type { ProgramData } from '../types/interfaces';
import '../styles/admin/ProgramForms.css';
import { apiService } from '../../services/api';

const ProgramFormAdmin: React.FC = () => {
  const [formData, setFormData] = useState<ProgramData>({
    idPrograma: '',
    codigoPrograma: '',
    tituloObtenido: '',
    tipoPrograma: '',
    version: '',
    duracionTotal: '',
    duracionEtapaLectiva: '',
    duracionEtapaProductiva: '',
    fechaInicio: '',
    fechaFin: '',
    ambienteFicha: '',
    jornada: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveDraft = () => {
    console.log('Guardando borrador...', formData);
    alert('Borrador guardado');
  };

  const handleSaveProgram = () => {
    console.log('Guardando programa...', formData);
    alert('Programa guardado exitosamente');
  };

  const handleCancel = () => {
    setFormData({
      idPrograma: '',
      codigoPrograma: '',
      tituloObtenido: '',
      tipoPrograma: '',
      version: '',
      duracionTotal: '',
      duracionEtapaLectiva: '',
      duracionEtapaProductiva: '',
      fechaInicio: '',
      fechaFin: '',
      ambienteFicha: '',
      jornada: ''
    });
  };

  // ---------- Carga de resultados del programa ----------
  const [programResultados, setProgramResultados] = useState<any[]>([]);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  function normalize(str: string | null | undefined) {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  const loadResultadosDelPrograma = async () => {
    setResultError(null);
    setProgramResultados([]);

    let programaId: number | null = null;

    if (formData.idPrograma && String(formData.idPrograma).trim()) {
      const asNum = Number(formData.idPrograma);
      if (!Number.isNaN(asNum)) programaId = asNum;
    }

    try {
      if (!programaId && formData.codigoPrograma) {
        const resp = await apiService.getProgramas();
        if (resp.success && Array.isArray(resp.data)) {
          const found = resp.data.find((p: any) => normalize(p.codigo_programa) === normalize(formData.codigoPrograma));
          if (found && found.id_programa) programaId = found.id_programa;
        }
      }

      if (!programaId) {
        setResultError('No se pudo determinar el id del programa. Indica `idPrograma` o `codigoPrograma` válido.');
        return;
      }

      setResultLoading(true);

      const resp = await apiService.getAllResultados();
      if (!resp.success || !Array.isArray(resp.data)) {
        setResultError(resp.error || 'Error al cargar resultados');
        return;
      }

      const all: any[] = resp.data;

      const filtered = all
        .filter(r => Number(r.id_programa) === Number(programaId))
        .filter(r => {
          const nombreNorm = normalize(r.nombre || r.nombre_resultado || '');
          return nombreNorm && nombreNorm !== 'denominacion' && nombreNorm !== 'denominación';
        })
        .map(r => ({
          id: r.id || r.id_resultado,
          nombre: r.nombre || r.nombre_resultado,
          fase_base: r.fase_base || r.fase || null,
          fase_vista: r.fase_vista || null,
        }));

      setProgramResultados(filtered);
    } catch (err: any) {
      setResultError(err?.message || String(err));
    } finally {
      setResultLoading(false);
    }
  };

  return (
    <div className="admin-program-form-section">
      <div className="admin-section-header">
        <FileText size={24} color="#7c3aed" />
        <h3 className="admin-section-title">Información del Programa</h3>
      </div>
      <p className="admin-section-subtitle">Completa los datos del programa académico</p>
      
      <div className="admin-form-grid">
        <div className="admin-form-group">
          <label className="admin-label">ID Programa</label>
          <input
            type="text"
            name="idPrograma"
            value={formData.idPrograma}
            onChange={handleInputChange}
            placeholder="Ej: PROG001"
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Código Programa</label>
          <input
            type="text"
            name="codigoPrograma"
            value={formData.codigoPrograma}
            onChange={handleInputChange}
            placeholder="Ej: TEC001"
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Título Obtenido</label>
          <input
            type="text"
            name="tituloObtenido"
            value={formData.tituloObtenido}
            onChange={handleInputChange}
            placeholder="Ej: Técnico en Sistemas"
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Tipo de Programa</label>
          <select
            name="tipoPrograma"
            value={formData.tipoPrograma}
            onChange={handleInputChange}
            className="admin-select"
          >
            <option value="">Seleccionar tipo</option>
            <option value="tecnico">Técnico</option>
            <option value="tecnologo">Tecnólogo</option>
            <option value="especializacion">Especialización</option>
            <option value="diplomado">Diplomado</option>
          </select>
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Versión</label>
          <input
            type="text"
            name="version"
            value={formData.version}
            onChange={handleInputChange}
            placeholder="Ej: V1.0"
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Duración Total (meses)</label>
          <input
            type="text"
            name="duracionTotal"
            value={formData.duracionTotal}
            onChange={handleInputChange}
            placeholder="Ej: 24"
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Duración Etapa Lectiva (meses)</label>
          <input
            type="text"
            name="duracionEtapaLectiva"
            value={formData.duracionEtapaLectiva}
            onChange={handleInputChange}
            placeholder="Ej: 18"
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Duración Etapa Productiva (meses)</label>
          <input
            type="text"
            name="duracionEtapaProductiva"
            value={formData.duracionEtapaProductiva}
            onChange={handleInputChange}
            placeholder="Ej: 6"
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Fecha de Inicio</label>
          <input
            type="date"
            name="fechaInicio"
            value={formData.fechaInicio}
            onChange={handleInputChange}
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Fecha de Fin</label>
          <input
            type="date"
            name="fechaFin"
            value={formData.fechaFin}
            onChange={handleInputChange}
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Ambiente de Ficha</label>
          <input
            type="text"
            name="ambienteFicha"
            value={formData.ambienteFicha}
            onChange={handleInputChange}
            placeholder="Ej: Aula 101"
            className="admin-input"
          />
        </div>
        
        <div className="admin-form-group">
          <label className="admin-label">Jornada</label>
          <select
            name="jornada"
            value={formData.jornada}
            onChange={handleInputChange}
            className="admin-select"
          >
            <option value="">Seleccionar jornada</option>
            <option value="manana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
            <option value="mixta">Mixta</option>
          </select>
        </div>
      </div>
      
      <div className="admin-form-actions">
        <button className="admin-btn-cancel" onClick={handleCancel}>
          <X size={18} />
          Cancelar
        </button>
        <button className="admin-btn-draft" onClick={handleSaveDraft}>
          <Save size={18} />
          Guardar Borrador
        </button>
        <button className="admin-btn-save" onClick={handleSaveProgram}>
          <Save size={18} />
          Guardar Programa
        </button>
      </div>

      <div className="admin-section-results">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h4>Resultados del Programa</h4>
          <button className="admin-btn-draft" onClick={loadResultadosDelPrograma}>
            Cargar resultados
          </button>
        </div>

        {resultLoading && <p>Cargando resultados...</p>}
        {resultError && <p style={{ color: 'red' }}>{resultError}</p>}

        {!resultLoading && programResultados.length === 0 && !resultError && (
          <p style={{ color: '#666' }}>No hay resultados cargados aún.</p>
        )}

        {programResultados.length > 0 && (
          <ul>
            {programResultados.map(r => (
              <li key={r.id}>
                <strong>{r.nombre}</strong>
                <span style={{ marginLeft: 8, color: '#555' }}>Fase: {r.fase_base || 'Sin asignar'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProgramFormAdmin;