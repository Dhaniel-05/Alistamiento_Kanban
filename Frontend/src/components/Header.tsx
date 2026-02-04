import { LogOut, User as UserIcon, Settings, Users, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import type { Usuario } from '../types';

interface HeaderProps {
  user?: Usuario | null;
  onLogout?: () => void;
  onNavigateToAdmin?: () => void;
  onOpenGestionInstructores?: () => void;
  canManageInstructores?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ user, onLogout, onNavigateToAdmin, onOpenGestionInstructores, canManageInstructores, onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const handleAdmin = () => {
    if (onNavigateToAdmin) return onNavigateToAdmin();
    navigate('/admin');
  };
  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        {/* Hamburger menu for mobile */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-gray-900 text-base sm:text-lg md:text-xl truncate">
            Sistema de Alistamiento SENA
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
            Desarrollo por Jose Asprilla, Roy Arenas, Winer Martinez (ADSO)
          </p>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          {/* Admin Panel Access */}
          {user?.rol === 'SuperUsuario' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdmin}
              className="text-[#2E7D32] hover:bg-[#2E7D32]/10"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">Panel Admin</span>
            </Button>
          )}

          {/* Gestión de Instructores */}
          {canManageInstructores && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenGestionInstructores?.()}
              className="flex items-center gap-1 sm:gap-2 border-[#39A900] text-[#39A900] hover:bg-[#39A900] hover:text-white transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="hidden lg:inline">Gestionar Instructores</span>
              <span className="lg:hidden">Instructores</span>
            </Button>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#2E7D32] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">
                    {user?.ini_nom
                      ? user.ini_nom
                      : (user?.nombre_completo
                        ? user.nombre_completo.split(' ').map(n => n[0]).slice(0, 3).join('').toUpperCase()
                        : (user?.num_ident ? user.num_ident.slice(-3) : '—'))}
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm text-gray-900">{(user?.nombre_completo ?? `${(user?.nombres ?? '')} ${(user?.apellidos ?? '')}`.trim()) || 'Usuario'}</p>
                  <p className="text-xs text-gray-600">{user?.rol ?? 'Invitado'}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="w-4 h-4 mr-2" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="text-sm">Especialidad</span>
                  <span className="text-xs text-gray-500">{user?.perfil_profesional || 'No especificada'}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="text-sm">Correo</span>
                  <span className="text-xs text-gray-500">{user?.correo || 'No especificado'}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
