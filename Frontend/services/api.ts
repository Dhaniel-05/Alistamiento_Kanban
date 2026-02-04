// Servicio API para conectar con el backend Node.js + Express + MySQL

import type {
  Ficha,
  Fase,
  Competencia,
  ResultadoAprendizaje,
  Usuario,
  ApiResponse,
  InstructorCompetencia,
  AsignacionFicha,
  ProyectoFormativo
} from '../src/types';


const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL)
  ? (import.meta as any).env.VITE_API_BASE_URL
  : 'http://localhost:3000/api';

class ApiService {
  private normalizeUser(raw: any): Usuario {
    return {
      id: raw.id_usuario ?? raw.id ?? 0,
      nombres: raw.nombres ?? '',
      apellidos: raw.apellidos ?? '',
      nombre_completo: raw.nom_completo ?? raw.nombre_completo ?? `${raw.nombres || ''} ${raw.apellidos || ''}`.trim(),
      ini_nom: raw.ini_nom ?? raw.iniNom ?? raw.ini_nom ?? undefined,
      num_ident: raw.num_ident ?? raw.numIdent ?? raw.num_ident ?? undefined,
      correo: raw.correo ?? raw.email ?? '',
      perfil_profesional: raw.especialidad ?? raw.perfil_profesional ?? null,
      rol: raw.rol ?? 'Instructor'
    } as Usuario;
  }
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Attach token from localStorage if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: any = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, clear local token (frontend should handle redirect)
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
        return {
          success: false,
          error: data.error || data.message || 'Error en la petición',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  // ============ FICHAS ============
  async getFichas(): Promise<ApiResponse<Ficha[]>> {
    return this.request<Ficha[]>('/fichas');
  }

  // ============ FASES ============
  async getFasesByFicha(fichaId: number): Promise<ApiResponse<Fase[]>> {
    return this.request<Fase[]>(`/fichas/${fichaId}/fases`);
  }

  async getKanbanFasesByFicha(fichaId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/fichas/${fichaId}/fases-kanban`);
  }

  async getAllFases(): Promise<ApiResponse<Fase[]>> {
    return this.request<Fase[]>('/fases');
  }

  async getFasesByJornada(jornada: string): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/fases-configuracion?jornada=${encodeURIComponent(jornada)}`);
  }

  async updateFaseFicha(fichaId: number, faseId: number, faseData: {
    nombre_fase?: string;
    orden?: number;
    color?: string;
    descripcion?: string;
    activo?: boolean;
  }): Promise<ApiResponse<void>> {
    return this.request<void>(`/fichas/${fichaId}/fases/${faseId}`, {
      method: 'PUT',
      body: JSON.stringify(faseData)
    });
  }

  // ============ COMPETENCIAS ============
  async getCompetenciasByFicha(fichaId: number): Promise<ApiResponse<Competencia[]>> {
    return this.request<Competencia[]>(`/fichas/${fichaId}/competencias`);
  }

  async getCompetenciasByFase(
    fichaId: number,
    faseId: number
  ): Promise<ApiResponse<Competencia[]>> {
    return this.request<Competencia[]>(`/fichas/${fichaId}/fases/${faseId}/competencias`);
  }

  async updateCompetenciaFase(
    competenciaId: number,
    faseBase?: string,
    faseVista?: string
  ): Promise<ApiResponse<Competencia>> {
    return this.request<Competencia>(`/competencias/${competenciaId}/fase`, {
      method: 'PUT',
      body: JSON.stringify({ faseBase, faseVista }),
    });
  }

  async updateCompetenciaEstado(
    competenciaId: number,
    estado: string
  ): Promise<ApiResponse<any>> {
    return this.request<any>(`/competencias/${competenciaId}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  }

  async createCompetencia(payload: any): Promise<ApiResponse<any>> {
    return this.request('/competencias', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async searchCompetencias(
    fichaId: number,
    query: string
  ): Promise<ApiResponse<Competencia[]>> {
    return this.request<Competencia[]>(
      `/fichas/${fichaId}/competencias/search?q=${encodeURIComponent(query)}`
    );
  }

  async getResultadosByCompetencia(competenciaId: number, fichaId?: number | null): Promise<ApiResponse<ResultadoAprendizaje[]>> {
    let url = `/competencias/${competenciaId}/resultados`;
    if (fichaId) {
      url += `?fichaId=${fichaId}`;
    }
    const resp = await this.request<any>(url);
    // El backend ahora devuelve { success: true, data: [...] }
    if (resp.success && resp.data) {
      return { success: true, data: resp.data };
    }
    // Si no tiene estructura success/data, asumir que es el array directamente (compatibilidad)
    if (Array.isArray(resp)) {
      return { success: true, data: resp };
    }
    return resp as ApiResponse<ResultadoAprendizaje[]>;
  }

  async getInstructoresByCompetencia(competenciaId: number): Promise<ApiResponse<InstructorCompetencia[]>> {
    return this.request<InstructorCompetencia[]>(`/competencias/${competenciaId}/instructores`);
  }

  // ============ RESULTADOS DE APRENDIZAJE ============
  async getAllResultados(): Promise<ApiResponse<ResultadoAprendizaje[]>> {
    return this.request<ResultadoAprendizaje[]>(`/resultados`);
  }

  async getResultado(id: number): Promise<ApiResponse<ResultadoAprendizaje>> {
    return this.request<ResultadoAprendizaje>(`/resultados/${id}`);
  }

  // ============ ASIGNACIONES ============
  async asignarFichaAUsuario(idUsuario: number, idFicha: number, rolFicha?: string): Promise<ApiResponse<any>> {
    return this.request('/asignaciones', {
      method: 'POST',
      body: JSON.stringify({ id_usuario: idUsuario, id_ficha: idFicha, rol_ficha: rolFicha }),
    });
  }

  async getUsuariosAsignadosAFicha(idFicha: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/asignaciones/ficha/${idFicha}`);
  }

  async getFichasAsignadasAUsuario(idUsuario: number): Promise<ApiResponse<AsignacionFicha[]>> {
    return this.request<AsignacionFicha[]>(`/asignaciones/usuario/${idUsuario}`);
  }

  async eliminarAsignacion(idAsignacion: number): Promise<ApiResponse<void>> {
    return this.request(`/asignaciones/${idAsignacion}`, {
      method: 'DELETE',
    });
  }

  async assignInstructorToResultado(resultadoId: number, instructorId: number): Promise<ApiResponse<void>> {
    return this.request(`/resultados/${resultadoId}/instructor`, {
      method: 'PUT',
      body: JSON.stringify({ instructorId }),
    });
  }

  async getResultadosByFicha(fichaId: number): Promise<ApiResponse<ResultadoAprendizaje[]>> {
    return this.request<ResultadoAprendizaje[]>(`/fichas/${fichaId}/resultados`);
  }

  async getResultadosByFase(
    fichaId: number,
    faseId: number
  ): Promise<ApiResponse<ResultadoAprendizaje[]>> {
    return this.request<ResultadoAprendizaje[]>(`/fichas/${fichaId}/fases/${faseId}/resultados`);
  }



  async updateResultadoPhase(
    resultadoId: number,
    faseBase?: string,
    faseVista?: string
  ): Promise<ApiResponse<ResultadoAprendizaje>> {
    return this.request<ResultadoAprendizaje>(`/resultados/${resultadoId}/phase`, {
      method: 'PUT',
      body: JSON.stringify({ fase_base: faseBase, fase_vista: faseVista }),
    });
  }

  async searchResultados(
    fichaId: number,
    query: string
  ): Promise<ApiResponse<ResultadoAprendizaje[]>> {
    return this.request<ResultadoAprendizaje[]>(
      `/fichas/${fichaId}/resultados/search?q=${encodeURIComponent(query)}`
    );
  }

  async createResultado(payload: any): Promise<ApiResponse<any>> {
    return this.request('/resultados', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateResultado(id: number, payload: any): Promise<ApiResponse<void>> {
    return this.request(`/resultados/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteResultado(id: number): Promise<ApiResponse<void>> {
    return this.request(`/resultados/${id}`, {
      method: 'DELETE',
    });
  }

  async updateResultadoEstado(id: number, estado: string): Promise<ApiResponse<void>> {
    return this.request(`/resultados/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  }

  // ============ USUARIO ============
  async getCurrentUser(): Promise<ApiResponse<Usuario>> {
    const resp = await this.request<any>('/auth/me');
    if (resp.success && resp.data) {
      return { success: true, data: this.normalizeUser(resp.data) };
    }
    return resp as ApiResponse<any>;
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  async getUsers(): Promise<ApiResponse<Usuario[]>> {
    return this.request<Usuario[]>('/auth/users');
  }

  // ============ PROGRAMAS ============
  async getProgramas(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/programas');
  }

  async createPrograma(payload: any): Promise<ApiResponse<any>> {
    return this.request('/programas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updatePrograma(id: number, payload: any): Promise<ApiResponse<void>> {
    return this.request(`/programas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deletePrograma(id: number): Promise<ApiResponse<void>> {
    return this.request(`/programas/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ PROYECTOS ============
  async getProyectos(): Promise<ApiResponse<ProyectoFormativo[]>> {
    return this.request<ProyectoFormativo[]>('/proyectos');
  }

  async createProyecto(payload: any): Promise<ApiResponse<{ id_proyecto: number }>> {
    return this.request('/proyectos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateProyecto(id: number, payload: any): Promise<ApiResponse<void>> {
    return this.request(`/proyectos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteProyecto(id: number): Promise<ApiResponse<void>> {
    return this.request(`/proyectos/${id}`, {
      method: 'DELETE',
    });
  }


  // ============ ACTAS ============
  async getActasByFicha(idFicha: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/actas/ficha/${idFicha}`);
  }

  async getActa(id: number): Promise<ApiResponse<any>> {
    return this.request<any>(`/actas/${id}`);
  }

  async createActa(payload: any): Promise<ApiResponse<any>> {
    return this.request('/actas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateActa(id: number, payload: any): Promise<ApiResponse<void>> {
    return this.request(`/actas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteActa(id: number): Promise<ApiResponse<void>> {
    return this.request(`/actas/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ PLANEACIÓN ============
  async getPlaneacion(fichaId: number): Promise<ApiResponse<any[]>> {
    return this.request<any[]>(`/planeacion/${fichaId}`);
  }

  async createPlaneacion(payload: any): Promise<ApiResponse<any>> {
    return this.request('/planeacion', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updatePlaneacion(id: number, payload: any): Promise<ApiResponse<void>> {
    return this.request(`/planeacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deletePlaneacion(id: number): Promise<ApiResponse<void>> {
    return this.request(`/planeacion/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ INSTRUCTOR ASSIGNMENT ============
  async asignInstructorToResultado(resultadoId: number, instructorId: number | null, fichaId?: number): Promise<ApiResponse<void>> {
    if (fichaId) {
      // Nueva lógica: Asignación específica por ficha
      return this.request(`/fichas/${fichaId}/resultados/${resultadoId}/instructor`, {
        method: 'PUT',
        body: JSON.stringify({ instructorId }),
      });
    } else {
      // Lógica legacy (global) - Mantener por compatibilidad si se usa en otros lados
      return this.request(`/resultados/${resultadoId}/instructor`, {
        method: 'PUT',
        body: JSON.stringify({ instructorId }),
      });
    }
  }

  // ============ FASES ============
  async updateResultadoFase(
    resultadoId: number,
    faseId: number | null,
    fichaId?: number
  ): Promise<ApiResponse<ResultadoAprendizaje>> {
    if (fichaId) {
      // Nueva lógica: Fase específica por ficha
      return this.request<ResultadoAprendizaje>(`/fichas/${fichaId}/resultados/${resultadoId}/fase`, {
        method: 'PUT',
        body: JSON.stringify({ fase_id: faseId }),
      });
    } else {
      // Lógica legacy
      return this.request<ResultadoAprendizaje>(`/resultados/${resultadoId}/fase`, {
        method: 'PUT',
        body: JSON.stringify({ fase_id: faseId }),
      });
    }
  }

  // ============ USUARIOS ============
  async getUsuarios(): Promise<ApiResponse<Usuario[]>> {
    const resp = await this.request<any[]>('/auth/users');
    if (!resp.success) return { success: false, error: resp.error };
    const normalized = (resp.data || []).map((u: any) => this.normalizeUser(u));
    return { success: true, data: normalized };
  }

  async createUsuario(payload: any): Promise<ApiResponse<{ id_usuario: number; contrasena?: string }>> {
    return this.request('/usuarios', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUsuario(id: number, payload: any): Promise<ApiResponse<void>> {
    return this.request(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteUsuario(id: number): Promise<ApiResponse<void>> {
    return this.request(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ FICHAS - MUTATIONS ============
  async createFicha(payload: any): Promise<ApiResponse<{ id_ficha: number }>> {
    return this.request('/fichas', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateFicha(id: number, payload: any): Promise<ApiResponse<void>> {
    return this.request(`/fichas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async patchFicha(id: number, payload: any): Promise<ApiResponse<void>> {
    return this.request(`/fichas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteFicha(id: number): Promise<ApiResponse<void>> {
    return this.request(`/fichas/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ AUTHENTICATION - REGISTRATION & PASSWORD RESET ============

  async register(userData: {
    nom_completo: string;
    num_ident: string;
    correo: string;
    contrasena: string;
    especialidad?: string;
    rol?: string;
  }): Promise<ApiResponse<{ userId: number }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async requestPasswordReset(num_ident: string, correo: string): Promise<ApiResponse<void>> {
    return this.request('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ num_ident, correo }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // ============ EXPORTS ============
  async exportActaToWord(actaId: number): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const response = await fetch(`${API_BASE_URL}/actas/${actaId}/export/word`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al exportar acta');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Acta_${actaId}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async exportPlaneacionToExcel(fichaId: number, faseNombre: string): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const params = new URLSearchParams({
      id_ficha: String(fichaId),
      fase: faseNombre
    });
    const response = await fetch(`${API_BASE_URL}/actas/planeacion/export/excel?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      let errorMessage = 'Error al exportar planeación';
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.error || errorBody?.message || errorMessage;
      } catch (parseError) {
        // Ignorar errores al parsear el cuerpo
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safePhase = faseNombre.replace(/[^a-zA-Z0-9-_]/g, '_');
    a.href = url;
    a.download = `Planeacion_${safePhase}_Ficha_${fichaId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const apiService = new ApiService();
