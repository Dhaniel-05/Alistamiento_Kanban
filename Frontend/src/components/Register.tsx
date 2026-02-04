import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { apiService } from '../../services/api';
import registerImage from '../assets/images/india.png';

export function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Form state
    const [nomCompleto, setNomCompleto] = useState('');
    const [numIdent, setNumIdent] = useState('');
    const [correo, setCorreo] = useState('');
    const [especialidad, setEspecialidad] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validaciones
        const trimmedNomCompleto = nomCompleto.trim();
        const trimmedNumIdent = numIdent.trim();
        const trimmedCorreo = correo.trim();
        const trimmedContrasena = contrasena.trim();
        const trimmedConfirmar = confirmarContrasena.trim();

        if (!trimmedNomCompleto || !trimmedNumIdent || !trimmedCorreo || !trimmedContrasena) {
            setError('Todos los campos marcados con * son obligatorios');
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedCorreo)) {
            setError('Por favor ingresa un correo electrónico válido');
            return;
        }

        // Validar documento (solo números)
        if (!/^\d+$/.test(trimmedNumIdent)) {
            setError('El número de documento debe contener solo dígitos');
            return;
        }

        // Validar contraseña
        if (trimmedContrasena.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (trimmedContrasena !== trimmedConfirmar) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const response = await apiService.register({
                nom_completo: trimmedNomCompleto,
                num_ident: trimmedNumIdent,
                correo: trimmedCorreo,
                contrasena: trimmedContrasena,
                especialidad: especialidad.trim() || undefined,
                rol: 'Instructor', // Por defecto registramos como Instructor
            });

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(response.error || 'Error al registrar usuario');
            }
        } catch (err: any) {
            setError(err.message || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-[30px] shadow-2xl p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-[#39A900]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Registro Exitoso!</h2>
                    <p className="text-gray-600 mb-6">
                        Tu cuenta ha sido creada correctamente. Redirigiendo al inicio de sesión...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-7xl bg-white rounded-[30px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[750px]">

                {/* Columna Izquierda - Formulario */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="max-w-xl mx-auto w-full">
                        <div className="text-center md:text-left mb-8">
                            <p className="text-gray-600 text-sm mb-4 leading-relaxed max-w-sm">
                                Recuerde que, una vez registrado, deberá solicitar
                                autorización para poder iniciar sesión.
                            </p>
                            <h1 className="text-5xl font-bold text-black tracking-tight">
                                Registrar Usuario
                            </h1>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <Label htmlFor="nomCompleto" className="text-gray-600 text-xs font-medium tracking-wide">Nombre Completo</Label>
                                    <Input
                                        id="nomCompleto"
                                        type="text"
                                        value={nomCompleto}
                                        onChange={(e) => setNomCompleto(e.target.value)}
                                        className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-11 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="numIdent" className="text-gray-600 text-xs font-medium tracking-wide">Número de Documento</Label>
                                    <Input
                                        id="numIdent"
                                        type="text"
                                        value={numIdent}
                                        onChange={(e) => setNumIdent(e.target.value)}
                                        className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-11 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <Label htmlFor="correo" className="text-gray-600 text-xs font-medium tracking-wide">Correo Electrónico</Label>
                                    <Input
                                        id="correo"
                                        type="email"
                                        value={correo}
                                        onChange={(e) => setCorreo(e.target.value)}
                                        className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-11 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="especialidad" className="text-gray-600 text-xs font-medium tracking-wide">Especialidad</Label>
                                    <Input
                                        id="especialidad"
                                        type="text"
                                        value={especialidad}
                                        onChange={(e) => setEspecialidad(e.target.value)}
                                        className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-11 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Campos de Contraseña */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <Label htmlFor="contrasena" className="text-gray-600 text-xs font-medium tracking-wide">Contraseña</Label>
                                    <Input
                                        id="contrasena"
                                        type="password"
                                        value={contrasena}
                                        onChange={(e) => setContrasena(e.target.value)}
                                        className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-11 rounded-lg"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="confirmarContrasena" className="text-gray-600 text-xs font-medium tracking-wide">Confirmar Contraseña</Label>
                                    <Input
                                        id="confirmarContrasena"
                                        type="password"
                                        value={confirmarContrasena}
                                        onChange={(e) => setConfirmarContrasena(e.target.value)}
                                        className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-11 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="pt-8 flex justify-center md:justify-start">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-6 px-10 rounded-full text-sm shadow-lg hover:shadow-xl uppercase tracking-wider min-w-[200px]"
                                >
                                    {loading ? 'Registrando...' : 'REGISTRAR USUARIO'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Columna Derecha - Imagen y Botón Login */}
                <div className="hidden md:flex md:w-1/2 bg-[#4CAF50] relative items-end justify-center overflow-hidden rounded-bl-[60px] md:rounded-bl-[80px]">
                    {/* Botón Iniciar Sesión - Top Right */}
                    <div className="absolute top-8 right-8 z-10">
                        <Button
                            onClick={() => navigate('/login')}
                            className="bg-[#388E3C] hover:bg-[#2E7D32] text-white font-bold py-2 px-6 rounded-full text-xs shadow-md border border-white/20 uppercase tracking-wider"
                        >
                            INICIAR SESION
                        </Button>
                    </div>

                    {/* Imagen */}
                    <div className="relative z-0 w-full flex justify-center items-end h-full">
                        <img
                            src={registerImage}
                            alt="Registro SENA"
                            className="object-contain h-[550px] w-auto drop-shadow-2xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
