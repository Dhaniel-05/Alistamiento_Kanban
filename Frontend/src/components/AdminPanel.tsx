import { useState, useEffect, useRef } from 'react';
import { Users, GraduationCap, Folder, FileText, BarChart3, ChevronDown, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import type { Usuario } from '../types';
import { useAuth } from '../context/AuthContext';
import { UsuariosTab } from './UsuariosTab';
import { ProgramasTab } from './ProgramasTab';
import { ProyectosTab } from './ProyectosTab';
import { FichasTab } from './FichasTab';
import { ResultadosTab } from './ResultadosTab';
import { ReportesTab } from './ReportesTab';

interface AdminPanelProps {
  user: Usuario;
  onLogout: () => void;
  onNavigateToDashboard: () => void;
}


export function AdminPanel({ user, onLogout }: AdminPanelProps) {
  // Obtener el tab de la URL (ej: /admin/fichas -> 'fichas')
  const location = window.location;
  const pathParts = location.pathname.split('/');
  const urlTab = pathParts[2] || 'usuarios'; // /admin/fichas -> 'fichas'

  // Validar que el tab de la URL sea válido
  const validTabs = ['usuarios', 'programas', 'proyectos', 'fichas'];
  const initialTab = validTabs.includes(urlTab) ? urlTab : 'usuarios';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Sincronizar URL con el tab activo
  useEffect(() => {
    // Cuando cambia el tab, actualizar la URL
    if (activeTab) {
      navigate(`/admin/${activeTab}`, { replace: true });
    }
  }, [activeTab, navigate]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = async () => {
    try {
      // Llamar al logout del contexto para limpiar el estado
      logout();
      // Llamar al onLogout pasado como prop (por si acaso)
      onLogout();
      // Navegar al login
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así navegar al login
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with SENA branding */}
      <header className="bg-gradient-to-r from-[#39A900] via-[#2E7D32] to-[#1B5E20] shadow-lg px-6 py-5 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-white/30 rounded-full" />
          <div className="transition-transform duration-300 hover:scale-105">
            <h1 className="text-white text-2xl font-bold tracking-tight">
              Panel de Administración
            </h1>
            <p className="text-white/90 text-sm font-medium">
              Sistema de Alistamiento SENA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 cursor-pointer hover:bg-white/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-[#39A900] shadow-md hover:shadow-lg"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          >
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110">
              <span className="text-[#2E7D32] text-sm font-bold">
                {user.nombres || user.ini_nom || user.nombre_completo?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm text-white font-semibold">{user.nombre_completo || user.nom_completo || 'Usuario'}</p>
              <p className="text-xs text-white/80 font-medium">{user.rol}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-white transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-2xl z-50 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                className="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 font-medium hover:pl-6"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="max-w-3xl mx-auto grid grid-cols-4 gap-2 mb-6 h-auto">
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </TabsTrigger>
            <TabsTrigger value="programas" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Programas</span>
            </TabsTrigger>
            <TabsTrigger value="proyectos" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Proyectos</span>
            </TabsTrigger>
            <TabsTrigger value="fichas" className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              <span className="hidden sm:inline">Fichas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios">
            <UsuariosTab />
          </TabsContent>

          <TabsContent value="programas">
            <ProgramasTab />
          </TabsContent>

          <TabsContent value="proyectos">
            <ProyectosTab />
          </TabsContent>

          <TabsContent value="fichas">
            <FichasTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
