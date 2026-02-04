import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';

const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000';
const API_BASE = RAW_API_BASE.replace(/\/$/, '');
const API_PREFIX = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;
const API_UPLOAD_URL = `${API_PREFIX}/pdf/upload-project`;

interface ProjectPDFUploadProps {
  idPrograma?: number;
  onSuccess?: () => void;
}

const ProjectPDFUpload: React.FC<ProjectPDFUploadProps> = ({ idPrograma = 1, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [projectInfo, setProjectInfo] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadStatus('idle');
    setStatusMessage('');
    setProjectInfo(null);
  };

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const triggerFileSelect = () => {
    inputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMessage('Por favor, selecciona un archivo PDF primero.');
      setUploadStatus('error');
      return;
    }

    console.log("🚀 Subiendo PDF de proyecto...");
    setUploadStatus('uploading');
    setStatusMessage(`Procesando '${selectedFile.name}'...`);

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('id_programa', String(idPrograma));

    try {
      const response = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log("📋 Respuesta:", data);

      if (response.ok && data.success) {
        setUploadStatus('success');
        setStatusMessage(data.message || 'PDF de proyecto procesado exitosamente');
        setProjectInfo(data.proyecto_info);
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setUploadStatus('error');
        setStatusMessage(data.error || 'Error al procesar el PDF de proyecto');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setUploadStatus('error');
      setStatusMessage('Error de conexión con el servidor.');
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setStatusMessage('');
    setProjectInfo(null);
  };

  return (
    <div className="admin-pdf-upload-section">
      <div className="admin-section-header">
        <Upload size={24} color="#7c3aed" />
        <h3 className="admin-section-title">Cargar Información del Proyecto</h3>
      </div>
      <p className="admin-section-subtitle">
        Selecciona el PDF con la información del proyecto (códigos SOFIA, nombre y tiempo de ejecución)
      </p>
      
      <div className="admin-upload-area">
        <div className="admin-upload-icon">
          {uploadStatus === 'uploading' ? (
            <Loader size={48} color="#ec4899" className="animate-spin" />
          ) : uploadStatus === 'success' ? (
            <CheckCircle size={48} color="#10b981" />
          ) : uploadStatus === 'error' ? (
            <XCircle size={48} color="#ef4444" />
          ) : (
            <FileText size={48} color="#ec4899" />
          )}
        </div>

        {uploadStatus === 'idle' && (
          <>
            <p className="admin-upload-text">Arrastra el PDF del proyecto aquí</p>
            <p className="admin-upload-subtext">o haz clic para seleccionar</p>
          </>
        )}
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="admin-upload-button"
            onClick={triggerFileSelect}
          >
            {selectedFile ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
          </button>
          <input
            id="project-file-upload"
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {selectedFile && (
            <span className="text-sm text-gray-600">{selectedFile.name}</span>
          )}
        </div>
        
        {selectedFile && uploadStatus === 'idle' && (
          <div className="mt-4">
            <p className="admin-selected-file">
              📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
            <button 
              className="admin-upload-button mt-4"
              onClick={handleUpload}
              style={{ marginTop: '1rem' }}
            >
              Subir y Procesar Proyecto
            </button>
          </div>
        )}

        {uploadStatus === 'uploading' && (
          <div className="mt-4">
            <p className="text-blue-600 font-medium">{statusMessage}</p>
          </div>
        )}

        {uploadStatus === 'success' && projectInfo && (
          <div className="mt-4 space-y-2">
            <p className="text-green-600 font-medium">{statusMessage}</p>
            <div className="text-sm text-gray-700 space-y-1 p-4 bg-green-50 rounded">
              <p><strong>Código Proyecto SOFIA:</strong> {projectInfo.codigo_proyecto_sofia || 'N/A'}</p>
              <p><strong>Código Programa SOFIA:</strong> {projectInfo.codigo_programa_sofia || 'N/A'}</p>
              <p><strong>Nombre Proyecto:</strong> {projectInfo.nombre_proyecto || 'N/A'}</p>
              <p><strong>Tiempo Ejecución:</strong> {projectInfo.tiempo_ejecucion_meses ? `${projectInfo.tiempo_ejecucion_meses} meses` : 'N/A'}</p>
            </div>
            <button 
              className="admin-upload-button mt-4"
              onClick={resetUpload}
              style={{ marginTop: '1rem' }}
            >
              Subir Otro Archivo
            </button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-4">
            <p className="text-red-600 font-medium">{statusMessage}</p>
            <button 
              className="admin-upload-button mt-4"
              onClick={resetUpload}
              style={{ marginTop: '1rem' }}
            >
              Intentar Nuevamente
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 font-medium mb-2">
          ℹ️ Este PDF debe contener:
        </p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Código de proyecto SOFIA</li>
          <li>Código del programa SOFIA</li>
          <li>Nombre del proyecto</li>
          <li>Tiempo estimado de ejecución (en meses)</li>
        </ul>
      </div>
    </div>
  );
};

export default ProjectPDFUpload;