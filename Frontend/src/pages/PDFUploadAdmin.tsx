// // pages/PDFUploadAdmin.tsx

// import React, { useState } from 'react';
// import { Upload, FilePlus } from 'lucide-react';
// import type { PDFUploadProps } from '../types/interfaces';
// import '../styles/admin/PDFUploadAdmin.css';

// const PDFUpload: React.FC<PDFUploadProps> = ({ onFileSelect }) => {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] || null;
//     setSelectedFile(file);
//     onFileSelect(file);
//   };

//   return (
//     <div className="admin-pdf-upload-section">
//       <div className="admin-section-header">
//         <Upload size={24} color="#7c3aed" />
//         <h3 className="admin-section-title">Cargar Documento PDF</h3>
//       </div>
//       <p className="admin-section-subtitle">Selecciona el archivo PDF del programa académico</p>

//       <div className="admin-upload-area">
//         <div className="admin-upload-icon">
//           <FilePlus size={48} color="#ec4899" />
//         </div>
//         <p className="admin-upload-text">Arrastra tu archivo PDF aquí</p>
//         <p className="admin-upload-subtext">o haz clic para seleccionar</p>

//         <label htmlFor="admin-file-upload" className="admin-upload-button">
//           Seleccionar Archivo
//         </label>
//         <input
//           id="admin-file-upload"
//           type="file"
//           accept=".pdf"
//           onChange={handleFileChange}
//           style={{ display: 'none' }}
//         />

//         {selectedFile && (
//           <p className="admin-selected-file">Archivo seleccionado: {selectedFile.name}</p>
//         )}
//       </div>
//     </div>
//   );
// };

// // export default PDFUpload;
// import React, { useState } from 'react';
// import { Upload, FilePlus } from 'lucide-react';
// import type { PDFUploadProps } from '../types/interfaces';
// // La importación del archivo CSS ha sido eliminada para resolver el error de compilación 
// // "Could not resolve...". Asegúrate de que las rutas a los archivos CSS sean correctas 
// // o considera usar estilos en línea o un framework como Tailwind CSS si el archivo 
// // no es local al componente.
// import '../styles/admin/PDFUploadAdmin.css'; 

// // 🌐 URL de tu backend
// // IMPORTANTE: Asegúrate de que este puerto coincida con el puerto de tu servidor Express.
// const API_UPLOAD_URL = 'http://localhost:3000/api/pdf/upload'; 

// const PDFUpload: React.FC<PDFUploadProps> = ({ onFileSelect }) => {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
//   const [statusMessage, setStatusMessage] = useState<string>('');

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0] || null;
//     setSelectedFile(file);
//     onFileSelect(file);
//     // Resetear el estado al seleccionar un nuevo archivo
//     setUploadStatus('idle');
//     setStatusMessage('');
//   };

//   const handleUpload = async () => {
//     if (!selectedFile) {
//       setStatusMessage('Por favor, selecciona un archivo PDF primero.');
//       return;
//     }

//     setUploadStatus('uploading');
//     setStatusMessage(`Cargando y procesando '${selectedFile.name}'...`);

//     // Usamos FormData para enviar el archivo
//     const formData = new FormData();
//     // 'pdf' debe coincidir con el nombre del campo en tu ruta de Express (upload.single('pdf'))
//     formData.append('pdf', selectedFile); 

//     try {
//       const response = await fetch(API_UPLOAD_URL, {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await response.json();

//       if (response.ok && data.success) {
//         setUploadStatus('success');
//         setStatusMessage(data.message || `PDF procesado. ${data.total_registros} registros guardados.`);
//       } else {
//         // Manejar errores (el error.message vendrá de tu controlador de Express)
//         setUploadStatus('error');
//         setStatusMessage(data.error || 'Error desconocido al procesar el PDF en el servidor.');
//       }
//     } catch (error) {
//       // Manejar errores de red
//       console.error('Error de red al subir el PDF:', error);
//       setUploadStatus('error');
//       setStatusMessage('Error de conexión con el servidor backend.');
//     }
//   };


//   return (
//     <div className="admin-pdf-upload-section">
//       <div className="admin-section-header">
//         <Upload size={24} color="#7c3aed" />
//         <h3 className="admin-section-title">Cargar Documento PDF</h3>
//       </div>
//       <p className="admin-section-subtitle">Selecciona el archivo PDF del programa académico</p>

//       <div className="admin-upload-area">
//         <div className="admin-upload-icon">
//           <FilePlus size={48} color="#ec4899" />
//         </div>
//         <p className="admin-upload-text">Arrastra tu archivo PDF aquí</p>
//         <p className="admin-upload-subtext">o haz clic para seleccionar</p>

//         <label htmlFor="admin-file-upload" className="admin-upload-button">
//           Seleccionar Archivo
//         </label>
//         <input
//           id="admin-file-upload"
//           type="file"
//           accept=".pdf"
//           onChange={handleFileChange}
//           style={{ display: 'none' }}
//         />

//         {selectedFile && (
//           <p className="admin-selected-file">Archivo seleccionado: {selectedFile.name}</p>
//         )}

//         {/* Nuevo botón para disparar la subida */}
//         <button 
//             className="admin-upload-button mt-4" // Reutilizamos tu clase de botón
//             onClick={handleUpload}
//             // Deshabilitar si no hay archivo o está cargando
//             disabled={!selectedFile || uploadStatus === 'uploading'} 
//         >
//             {uploadStatus === 'uploading' ? 'Procesando...' : 'Subir y Analizar'}
//         </button>

//         {/* Mensaje de estado */}
//         {statusMessage && (
//             <p className={`mt-2 ${uploadStatus === 'error' ? 'text-red-500' : uploadStatus === 'success' ? 'text-green-500' : 'text-blue-500'}`}>
//                 {statusMessage}
//             </p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PDFUpload;
import React, { useState } from 'react';
import { Upload, FilePlus, CheckCircle, XCircle, Loader } from 'lucide-react';
import '../styles/admin/PDFUploadAdmin.css';

const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3000';
const API_BASE = RAW_API_BASE.replace(/\/$/, '');
const API_PREFIX = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;
const API_UPLOAD_URL = `${API_PREFIX}/pdf/upload`;

type LocalPDFUploadProps = {
  onFileSelect?: (file: File | null) => void;
  onSuccess?: () => void;
  idFicha?: number; // ID de la ficha a la que se asociarán las competencias
};

const PDFUpload: React.FC<LocalPDFUploadProps> = ({ onFileSelect, onSuccess, idFicha }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadDetails, setUploadDetails] = useState<{
    competencias?: number;
    resultados?: number;
  }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    console.log("📄 Archivo seleccionado:", file);

    if (file) {
      console.log("📋 Tipo:", file.type);
      console.log("📏 Tamaño:", file.size);
    }

    setSelectedFile(file);
    onFileSelect?.(file);
    setUploadStatus('idle');
    setStatusMessage('');
    setUploadDetails({});
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    console.log("📦 Archivo arrastrado:", file);

    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      onFileSelect(file);
      setUploadStatus('idle');
      setStatusMessage('');
      setUploadDetails({});
    } else {
      setStatusMessage('Por favor, arrastra un archivo PDF válido');
      setUploadStatus('error');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatusMessage('Por favor, selecciona un archivo PDF primero.');
      setUploadStatus('error');
      return;
    }

    console.log("🚀 Iniciando subida...");
    console.log("📄 Archivo a subir:", selectedFile.name);
    console.log("📋 Tipo MIME:", selectedFile.type);
    console.log("📏 Tamaño:", selectedFile.size, "bytes");

    setUploadStatus('uploading');
    setStatusMessage(`Procesando '${selectedFile.name}'...`);

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    // id_ficha es opcional - si no se proporciona, se creará automáticamente
    if (idFicha) {
      formData.append('id_ficha', String(idFicha));
    }

    // Log para debug
    console.log("📦 FormData creado");
    console.log("🔑 Campo 'pdf' agregado al FormData");
    console.log("🆔 ID Ficha:", idFicha);

    try {
      console.log("📡 Enviando request a:", API_UPLOAD_URL);

      const response = await fetch(API_UPLOAD_URL, {
        method: 'POST',
        body: formData,
        // ⚠️ NO agregues Content-Type, fetch lo hace automáticamente con FormData
      });

      console.log("📨 Respuesta recibida. Status:", response.status);

      const data = await response.json();
      console.log("📋 Datos de respuesta:", data);

      if (response.ok && data.success) {
        setUploadStatus('success');
        setStatusMessage(data.message || 'PDF procesado exitosamente');
        setUploadDetails({
          competencias: data.total_registros,
          resultados: data.resultados_aprendizaje,
        });
        // Disparar callback si existe
        onSuccess?.();
      } else {
        setUploadStatus('error');
        setStatusMessage(data.error || 'Error desconocido al procesar el PDF');
        console.error("❌ Error del servidor:", data);
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      setUploadStatus('error');
      setStatusMessage('Error de conexión con el servidor. Verifica que el backend esté corriendo en el API configurado');
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setStatusMessage('');
    setUploadDetails({});
    onFileSelect(null);
  };

  return (
    <div className="admin-pdf-upload-section">
      <div
        className="admin-upload-area"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="admin-upload-icon">
          {uploadStatus === 'uploading' ? (
            <Loader size={40} color="#ec4899" className="animate-spin" />
          ) : uploadStatus === 'success' ? (
            <CheckCircle size={40} color="#10b981" />
          ) : uploadStatus === 'error' ? (
            <XCircle size={40} color="#ef4444" />
          ) : (
            <FilePlus size={40} color="#ec4899" />
          )}
        </div>

        {uploadStatus === 'idle' && (
          <>
            <p className="admin-upload-text">Arrastra tu archivo PDF aquí</p>
            <p className="admin-upload-subtext">o haz clic para seleccionar</p>
          </>
        )}

        <label htmlFor="admin-file-upload" className="admin-upload-button">
          {selectedFile ? 'Cambiar Archivo' : 'Seleccionar Archivo'}
        </label>
        <input
          id="admin-file-upload"
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {selectedFile && uploadStatus === 'idle' && (
          <div className="mt-3">
            <p className="admin-selected-file text-sm">
              📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
            </p>
            <button
              className="admin-upload-button mt-3"
              onClick={handleUpload}
            >
              Subir y Procesar
            </button>
          </div>
        )}

        {uploadStatus === 'uploading' && (
          <div className="mt-3">
            <p className="text-blue-600 font-medium text-sm">
              {statusMessage}
            </p>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="mt-3 space-y-2">
            <p className="text-green-600 font-medium text-sm">
              ✅ PDF procesado e insertado correctamente
            </p>
            {uploadDetails.competencias !== undefined && (
              <div className="text-sm text-gray-700 space-y-1 bg-green-50 p-2 rounded">
                <p>✅ Competencias insertadas: {uploadDetails.competencias}</p>
                <p>✅ Resultados de aprendizaje: {uploadDetails.resultados}</p>
              </div>
            )}
            <button
              className="admin-upload-button mt-2"
              onClick={resetUpload}
            >
              Subir Otro Archivo
            </button>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-3">
            <p className="text-red-600 font-medium text-sm">
              {statusMessage}
            </p>
            <button
              className="admin-upload-button mt-2"
              onClick={resetUpload}
            >
              Intentar Nuevamente
            </button>
          </div>
        )}
      </div>

      {/* Instrucciones compactas */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800 font-medium mb-1">
          ℹ️ Instrucciones:
        </p>
        <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
          <li>El PDF debe contener competencias en formato de tabla</li>
          <li>Tamaño máximo: 10 MB</li>
          <li>Los datos se guardarán automáticamente en minúsculas</li>
          <li>El proceso puede tardar varios segundos para PDFs grandes</li>
        </ul>
      </div>
    </div>
  );
};

export default PDFUpload;