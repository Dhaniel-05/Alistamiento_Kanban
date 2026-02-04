import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { apiService } from '../../services/api';
import indiaImage from '../assets/images/india.png';

export function PasswordRecovery() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [numIdent, setNumIdent] = useState('');
    const [correo, setCorreo] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!numIdent || !correo) {
            setError('Por favor completa todos los campos');
            return;
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            setError('Por favor ingresa un correo electrónico válido');
            return;
        }

        setLoading(true);

        try {
            const response = await apiService.requestPasswordReset(numIdent, correo);

            if (response.success) {
                setSuccess(true);
            } else {
                setError(response.error || 'Error al solicitar recuperación de contraseña');
            }
        } catch (err: any) {
            setError(err.message || 'Error al solicitar recuperación de contraseña');
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
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Correo Enviado!</h2>
                    <p className="text-gray-600 mb-6">
                        Si existe una cuenta con los datos proporcionados, recibirás un correo electrónico con instrucciones para restablecer tu contraseña.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        El enlace expirará en <strong>1 hora</strong>.
                    </p>
                    <Button
                        onClick={() => navigate('/login')}
                        className="w-full bg-[#39A900] hover:bg-[#2E7D32] text-white font-bold py-3 rounded-full shadow-lg"
                    >
                        Volver al Inicio de Sesión
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-8">
            <div className="w-full max-w-7xl bg-white rounded-[30px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">

                {/* Columna Izquierda - Formulario */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="max-w-md mx-auto w-full">

                        <div className="text-center md:text-left mb-8">
                            <p className="text-gray-600 text-xs mb-6 leading-relaxed">
                                Si has olvidado tu contraseña, se te asignara una contraseña temporal. Al
                                ingresar con esta contraseña, se te pedirá obligatoriamente que la cambies.
                            </p>
                            <h1 className="text-4xl font-bold text-black tracking-tight mb-8">
                                Recuperar Contraseña
                            </h1>
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="numIdent" className="text-gray-600 text-xs font-medium tracking-wide">Numero de Identificación</Label>
                                <Input
                                    id="numIdent"
                                    type="text"
                                    value={numIdent}
                                    onChange={(e) => setNumIdent(e.target.value)}
                                    className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-11 rounded-lg"
                                    placeholder=""
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="correo" className="text-gray-600 text-xs font-medium tracking-wide">Correo Electronico</Label>
                                <Input
                                    id="correo"
                                    type="email"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    className="bg-blue-50/50 border-input/0 focus-visible:ring-1 focus-visible:ring-green-500 h-11 rounded-lg"
                                    placeholder=""
                                    required
                                />
                            </div>

                            <div className="pt-4 flex justify-center md:justify-start">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold py-6 px-8 rounded-full text-xs shadow-lg hover:shadow-xl uppercase tracking-wider min-w-[200px]"
                                >
                                    {loading ? 'Enviando...' : 'RECUPERAR CONTRASEÑA'}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-12 pt-6 border-t border-gray-100 text-center md:text-left">
                            <p className="text-[10px] text-gray-400">
                                Desarrollo del sistema a cargo de: José Asprilla, Wisner Martínez y Roy Arenas
                            </p>
                        </div>
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
                            src={indiaImage}
                            alt="Recuperar Contraseña SENA"
                            className="object-contain h-[550px] w-auto drop-shadow-2xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
