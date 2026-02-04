// ...existing code...
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Toaster } from './components/ui/sonner';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { Register } from './components/Register';
import { PasswordRecovery } from './components/PasswordRecovery';
import { ResetPassword } from './components/ResetPassword';
// CompetenciasView and ResultadosView are used inside Dashboard
import { AuthProvider, useAuth } from './context/AuthContext';

// Nuevo import para Equipo Ejecutor
import EquipoEjecutorPanel from './components/EquipoEjecutorPanel';

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth();

  function LoginPage() {
    const { setUser } = useAuth();
    const nav = useNavigate();

    const handleLogin = (usuario: any) => {
      setUser(usuario);
      if (usuario.rol === 'SuperUsuario') {
        nav('/admin');
      } else {
        // Usuarios no administradores van al Dashboard
        nav('/dashboard');
      }
    };

    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // AdminWrapper: defined inside AppContent but not executed until rendered inside Router
  const AdminWrapper: React.FC = () => {
    const navigate = useNavigate();
    return (
      <AdminPanel
        user={user!}
        onLogout={() => navigate('/login')}
        onNavigateToDashboard={() => { }} // Provide empty handler to satisfy prop requirements
      />
    );
  };

  // DashboardWrapper: new component introduced by the change
  const DashboardWrapper: React.FC = () => {
    return <Dashboard />;
  };

  const isAdmin = user?.rol === 'SuperUsuario';

  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/password-recovery" element={<PasswordRecovery />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected routes */}
          <Route path="/admin/*" element={isAuthenticated ? <AdminWrapper /> : <Navigate to="/login" />} />
          <Route path="/dashboard" element={isAuthenticated ? <DashboardWrapper /> : <Navigate to="/login" />} />
          {/* Ruta para gestión de instructores (solo SuperUsuario) */}
          <Route path="/equipo-ejecutor" element={isAuthenticated && user?.rol === 'SuperUsuario' ? <EquipoEjecutorPanel /> : <Navigate to="/login" replace />} />
          <Route path="/" element={<Navigate to={!isAuthenticated ? "/login" : isAdmin ? "/admin" : "/dashboard"} replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </DndProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
