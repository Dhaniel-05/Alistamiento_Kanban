// types/interfaces.ts

export interface ProgramData {
  idPrograma: string;
  codigoPrograma: string;
  tituloObtenido: string;
  tipoPrograma: string;
  version: string;
  duracionTotal: string;
  duracionEtapaLectiva: string;
  duracionEtapaProductiva: string;
  fechaInicio: string;
  fechaFin: string;
  ambienteFicha: string;
  jornada: string;
}

export interface MenuItem {
  id: string;
  icon: any;
  label: string;
}

export interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export interface HeaderProps {
  title: string;
  subtitle: string;
}

export interface PDFUploadProps {
  onFileSelect: (file: File | null) => void;
}