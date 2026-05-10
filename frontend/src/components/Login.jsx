import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, loginUser } from '../services/userService';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [formData, setFormData] = useState({ email: '', username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { email, username, password } = formData;
    const title = mode === 'register' ? 'Crear Cuenta' : 'Iniciar Sesión';

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'register') {
                await registerUser(email, password, username);
                onLogin();
                navigate('/');
            } else {
                await loginUser(email, password);
                onLogin();
                navigate('/');
            }
        } catch (err) {
            console.error(err);
            const msg = err.message || '';
            if (msg.includes('email-already-in-use')) {
                setError('Ya existe una cuenta con ese email.');
            } else if (msg.includes('wrong-password') || msg.includes('invalid-credential')) {
                setError('Email o contraseña incorrectos.');
            } else if (msg.includes('user-not-found')) {
                setError('No existe una cuenta con ese email.');
            } else if (msg.includes('weak-password')) {
                setError('La contraseña debe tener al menos 6 caracteres.');
            } else if (msg.includes('invalid-email')) {
                setError('El formato del email no es válido.');
            } else {
                setError(msg || 'Error en la autenticación. Verifica tus datos.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-md p-8 rounded shadow-2xl border border-gray-200 relative">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-4 left-4 text-gray-400 hover:text-primary transition-colors flex items-center gap-1 text-sm font-bold"
                >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Volver
                </button>
                <div className="text-center mb-8 mt-4">
                    <h2 className="text-2xl font-bold text-text-main mb-2">{title}</h2>
                    <p className="text-text-muted text-sm">Accede a SpoilerSafe para comentar sin miedo.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-text-muted text-xs font-bold uppercase mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={onChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-text-main focus:border-primary outline-none transition-colors"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    {mode === 'register' && (
                        <div>
                            <label className="block text-text-muted text-xs font-bold uppercase mb-2">Nombre de Usuario</label>
                            <input
                                type="text"
                                name="username"
                                value={username}
                                onChange={onChange}
                                className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-text-main focus:border-primary outline-none transition-colors"
                                placeholder="Ej. OtakuMaster99"
                                maxLength="20"
                                required
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-text-muted text-xs font-bold uppercase mb-2">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-text-main focus:border-primary outline-none transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold uppercase py-3 hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50 mt-4 rounded-sm"
                    >
                        {loading ? 'Procesando...' : (mode === 'register' ? 'Crear Cuenta' : 'Acceder')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="text-text-muted hover:text-text-main text-sm underline"
                    >
                        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
