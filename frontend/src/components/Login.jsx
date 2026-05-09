import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API } from '../utils/api.js';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const { username, password } = formData;
    const title = mode === 'register' ? 'Crear Cuenta' : 'Iniciar Sesión';

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'register') {
                await axios.post(`${API}/register`, { username, password });
                // If successful, switch to login or auto-login
                alert('Cuenta creada exitosamente. Por favor inicia sesión.');
                setMode('login');
                setLoading(false);
            } else {
                // Login Local
                const params = new URLSearchParams();
                params.append('username', username);
                params.append('password', password);

                const res = await axios.post(`${API}/token`, params, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                });

                localStorage.setItem('token', res.data.access_token);
                onLogin({ email: username }); // Mock user object
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail);
            } else {
                setError('Error en la autenticación. Verifica tus datos.');
            }
            setLoading(false);
        }
    };

    const handleCrunchyrollSync = async () => {
        // Keeps the existing CR sync feature
        const email = prompt("Enter Crunchyroll Email:");
        const password = prompt("Enter Crunchyroll Password:");
        if (!email || !password) return;

        setLoading(true);
        try {
            const res = await axios.post(`${API}/integrations/crunchyroll/sync`, { email, password });
            localStorage.setItem('token', res.data.access_token);
            onLogin({ email: email });
        } catch (err) {
            console.error(err);
            alert("Falló la sincornización con Crunchyroll");
        } finally {
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
                        <label className="block text-text-muted text-xs font-bold uppercase mb-2">Usuario / Email</label>
                        <input
                            type="text"
                            name="username"
                            value={username}
                            onChange={onChange}
                            className="w-full bg-gray-50 border border-gray-300 rounded p-3 text-text-main focus:border-primary outline-none transition-colors"
                            placeholder="Ej. OtakuMaster99"
                            required
                        />
                    </div>
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

                <div className="mt-6 text-center space-y-4">
                    <button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="text-text-muted hover:text-text-main text-sm underline"
                    >
                        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión'}
                    </button>

                    <div className="relative border-t border-gray-200 pt-4">
                        <p className="text-xs text-text-muted mb-4 uppercase font-bold">O usa tu cuenta oficial</p>
                        <button
                            type="button"
                            onClick={handleCrunchyrollSync}
                            className="w-full bg-primary text-white font-bold uppercase py-2 hover:bg-orange-600 active:bg-orange-700 transition-colors text-xs rounded-sm"
                        >
                            Sincronizar con Crunchyroll
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
