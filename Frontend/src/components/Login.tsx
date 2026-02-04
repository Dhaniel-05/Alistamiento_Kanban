import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import loginImage from '../assets/images/instructor_sena.png';

interface LoginProps {
  onLogin: (user: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier) {
      setError('Por favor ingresa tu correo o número de documento');
      return;
    }

    if (trimmedIdentifier.length < 5) {
      setError('El correo o documento debe tener al menos 5 caracteres');
      return;
    }

    if (trimmedIdentifier.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedIdentifier)) {
        setError('Por favor ingresa un correo electrónico válido');
        return;
      }
    } else {
      if (!/^\d+$/.test(trimmedIdentifier)) {
        setError('El número de documento debe contener solo dígitos');
        return;
      }
    }

    if (!trimmedPassword) {
      setError('Por favor ingresa tu contraseña');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const success = await login(trimmedIdentifier, trimmedPassword);

      if (success) {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (user) {
          onLogin(user);
        }
      } else {
        setError('Credenciales inválidas. Verifica tu correo/documento y contraseña');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión. Por favor intenta nuevamente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-7xl bg-white rounded-[30px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">

        {/* Columna Izquierda - Formulario */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative">

          <div className="max-w-md mx-auto w-full">
            <p className="text-gray-600 text-sm mb-8 leading-relaxed">
              Bienvenido de Vuelta, Instructor !!!, Si no dispone de un usuario,
              puede crearlo seleccionando el botón Registrar usuario.
            </p>

            <h1 className="text-5xl font-bold text-black mb-12 tracking-tight">
              Iniciar Sesion
            </h1>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-gray-600 font-medium">Nombre de Usuario</Label>
                <div className="relative">
                  <Input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-12 rounded-lg pl-4"
                    placeholder=""
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-gray-600 font-medium">Contraseña</Label>
                  <button
                    type="button"
                    onClick={() => navigate('/password-recovery')}
                    className="text-gray-400 text-xs hover:text-[#39A900] transition-colors"
                  >
                    Olvidaste Tu Contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-12 rounded-lg pl-4 pr-10"
                    placeholder=""
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="pt-8">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-6 px-8 rounded-full text-sm flex items-center gap-2 transition-all shadow-lg hover:shadow-xl uppercase tracking-wider"
                >
                  {loading ? 'Iniciando...' : 'INICIAR SESION'}
                  <ArrowRight size={18} />
                </Button>
              </div>
            </form>

            <div className="mt-16 text-xs text-gray-400 max-w-xs">
              Desarrollo del sistema a cargo de: José Asprilla, Wisner Martínez y Roy Arenas
            </div>
          </div>
        </div>

        {/* Columna Derecha - Imagen y Botón Registro */}
        <div className="hidden md:flex md:w-1/2 bg-[#4CAF50] relative items-end justify-center overflow-hidden rounded-tl-[60px] md:rounded-tl-[80px]">
          {/* Botón Registrar Usuario - Top Right */}
          <div className="absolute top-8 right-8 z-10">
            <Button
              onClick={() => navigate('/register')}
              className="bg-[#388E3C] hover:bg-[#2E7D32] text-white font-bold py-2 px-6 rounded-full text-xs shadow-md border border-white/20 uppercase tracking-wider"
            >
              REGISTRAR USUARIO
            </Button>
          </div>

          {/* Imagen */}
          <div className="relative z-0 w-full flex justify-center items-end h-full">
            <img
              src={loginImage}
              alt="Instructor SENA"
              className="object-contain h-[550px] w-auto drop-shadow-2xl"
            />
          </div>

          {/* Decoración de fondo simple para simular profundidad si es necesario, 
               pero la imagen por sí sola con el fondo verde sólido parece ser el diseño target. */}
        </div>

      </div>
    </div>
  );
}
