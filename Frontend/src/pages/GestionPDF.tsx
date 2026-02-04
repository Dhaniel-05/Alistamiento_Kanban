// // pages/GestionPDF.tsx

// import React, { useState } from 'react';
// import PDFUpload from './PDFUploadAdmin';
// import ProgramForm from './ProgramFormAdmin';
// import '../styles/Pages.css';

// const GestionPDF: React.FC = () => {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);

//   return (
//     <div className="page-wrapper">
//       <PDFUpload onFileSelect={setSelectedFile} />
//       <ProgramForm />
//     </div>
//   );
// };

// export default GestionPDF;

// pages/GestionPDF.tsx

import React, { useState } from 'react';
import PDFUpload from './PDFUploadAdmin';
import ProjectPDFUpload from './ProjectPDFUpload';
import ProgramForm from './ProgramFormAdmin';

const GestionPDF: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [competenciasUploaded, setCompetenciasUploaded] = useState(false);
  const [projectUploaded, setProjectUploaded] = useState(false);

  return (
    <div className="page-wrapper">
      <div className="upload-steps">
        <h2 className="section-title">Gestión de Documentos PDF</h2>
        <p className="section-subtitle">Sube los documentos en el orden indicado</p>
        
        {/* Paso 1: Subir competencias */}
        <div className={`upload-step ${competenciasUploaded ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>Documento de Competencias</h3>
            <PDFUpload 
              onFileSelect={(file) => {
                setSelectedFile(file);
                if (file) setCompetenciasUploaded(true);
              }} 
            />
          </div>
        </div>

        {/* Paso 2: Subir proyecto (solo habilitado después del paso 1) */}
        <div className={`upload-step ${!competenciasUploaded ? 'disabled' : projectUploaded ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>Documento de Proyecto</h3>
            {competenciasUploaded ? (
              <ProjectPDFUpload 
                idPrograma={1}
                onSuccess={() => setProjectUploaded(true)}
              />
            ) : (
              <div className="step-disabled-message">
                <p>⚠️ Primero debes subir el documento de competencias</p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario adicional (opcional) */}
        {projectUploaded && (
          <div className="upload-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Información Adicional</h3>
              <ProgramForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionPDF;