// Tipos para la aplicación SENA Alistamiento
// Alineados con el esquema de base de datos MySQL

export interface Ficha {
  id_ficha: number;
  codigo_ficha: string;
  nombre_ficha: string;
  jornada: 'Diurna' | 'Nocturna';
  programa: string;
  estado: 'En Progreso' | 'Finalizada' | 'Por Inciar';
  fecha_inicio?: string;
  fecha_fin?: string;
  id_programa?: number | null;
  ambiente?: string | null;
  programa_nombre?: string;
  // Alias properties for compatibility
  id?: number;
  codigo?: string;
  nombre?: string;
  modalidad?: string;
  modalidad_formacion?: string;
}

export interface Fase {
  id: number;
  nombre: string;
  orden?: number;
  color?: string;
  activo?: boolean;
  habilitada?: boolean; // Alias para activo para mejor legibilidad
}

export interface ProgramaFormativo {
  id: number;
  codigo: string;
  titulo_obtenido: string;
  tipo_programa: string | null;
  version: string | null;
  duracion_total: number;
  duracion_lectiva: number | null;
  duracion_productiva: number | null;
  nombre?: string;
  nombre_programa?: string;
  // Additional fields
  codigo_programa?: string;
  duracion_total_programa?: number;
  duracion_etapa_lectiva?: number;
  duracion_etapa_productiva?: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
}

export interface ProyectoFormativo {
  id_proyecto: number;
  codigo_proyecto: string;
  nombre_proyecto: string;
  tiempo_de_ejecucion?: number;
  info_adicional?: string;
  id_programa: number;
  // Joined fields
  programa_nombre?: string;
  codigo_programa?: string;
}


export interface InstructorCompetencia {
  id_instructor: number;
  nombre_instructor: string;
  correo: string;
  rol_en_competencia?: string;
  fecha_asignacion?: string;
  avatar_url?: string;
}

export interface Competencia {
  id: number;
  codigo: string;
  nombre: string;
  norma_competencia?: string;
  descripcion?: string[];
  progreso?: number;
  instructor_nombre?: string;
  tipo_competencia: string | null;
  horas: number;
  estado: 'Por Iniciar' | 'En Progreso' | 'Terminado';
  id_programa: number;
  // Campos adicionales desde la relación con fases
  fase_id?: number;
  fase_nombre?: string;
  ficha_id?: number;
  orden?: number;
  fecha_asignacion?: string;
  fecha_actualizacion?: string;
  // Instructores asociados
  instructores?: InstructorCompetencia[];
}

export interface ResultadoAprendizaje {
  id: number;
  nombre?: string;
  descripcion?: string | null;
  criterios_evaluacion?: string | null;
  conocimientos_proceso?: string | null;
  conocimientos_saber?: string | null;
  actividad_aprendizaje?: string | null;
  evidencia_aprendizaje?: string | null;
  descripcion_evidencia?: string | null;
  actividad_proyecto?: string | null;
  estrategias_didacticas?: string | null;
  materiales_formacion?: string | null;
  estado: 'Por Asignar' | 'Por Iniciar' | 'En Proceso' | 'Terminado';
  id_competencia?: number;
  competencia_id?: number;
  id_usuario?: number | null;
  id_instructor?: number | null;
  instructor_asignado?: string | null;
  // Campos adicionales desde relaciones
  competencia_codigo?: string;
  competencia_nombre?: string;
  competencia_horas?: string;
  horas_calculadas?: number;
  instructor_nombre?: string;
  fase_id?: number;
  fase_nombre?: string;
  ficha_id?: number;
  ficha_codigo?: string;
  ficha_nombre?: string;
  orden?: number;
  fecha_asignacion?: string;
  fecha_actualizacion?: string;
  codigo?: string;
  horas_resultado?: number;
  fase_base?: string | null;
  fase_vista?: string | null;
  culminado?: boolean | number; // Indica si el resultado está culminado
}

export interface Usuario {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  perfil_profesional: string | null;
  rol: 'SuperUsuario' | 'Instructor' | 'Equipo Ejecutor';
  ini_nom?: string;
  nombre_completo?: string;
  num_ident?: string;
  contrasena?: string;
  // Campos que el backend puede devolver con nombres diferentes
  id_usuario?: number;
  nom_completo?: string;
  especialidad?: string;
}

export interface AsignacionFicha {
  id: number;
  id_usuario: number;
  id_ficha: number;
  rol_ficha?: string | null;
  codigo_ficha?: string;
  nombre_ficha?: string;
  estado?: string;
  jornada?: string;
  modalidad_formacion?: string;
  programa_nombre?: string;
}

export interface DragItem {
  id: number;
  type: 'competencia' | 'resultado';
  faseId: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

