import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/userService';

const Settings = ({ user }) => {
    const navigate = useNavigate();
    const { profile, setProfile } = useAuth();
    const currentUser = user || profile;

    const [activeTab, setActiveTab] = useState('account');
    const [bio, setBio] = useState(currentUser?.bio || '');
    const [location, setLocation] = useState(currentUser?.location || '');
    const [saving, setSaving] = useState(false);

    const handleSaveAccount = async () => {
        if (!currentUser?.uid) { navigate('/login'); return; }
        setSaving(true);
        try {
            await updateUserProfile(currentUser.uid, { bio, location });
            setProfile(prev => ({ ...prev, bio, location }));
            toast.success('Cambios guardados correctamente');
        } catch {
            toast.error('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'account':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Detalles de la Cuenta</h2>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nombre de Usuario</label>
                            <input
                                type="text"
                                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg block w-full p-3 font-medium outline-none cursor-not-allowed"
                                value={currentUser?.username || ''}
                                disabled
                            />
                            <span className="text-xs text-slate-400">El nombre de usuario no se puede cambiar.</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Biografía</label>
                            <textarea
                                rows={3}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block w-full p-3 font-medium outline-none transition-shadow resize-none"
                                placeholder="Cuéntanos algo sobre ti..."
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                maxLength={500}
                            />
                            <span className="text-xs text-slate-400 text-right">{bio.length}/500</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Ubicación</label>
                            <input
                                type="text"
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block w-full p-3 font-medium outline-none transition-shadow"
                                placeholder="Ej: Madrid, España"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                maxLength={100}
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <span className="material-symbols-outlined text-slate-400">admin_panel_settings</span>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nivel de cuenta</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {currentUser?.is_admin ? '🛡️ Administrador' : currentUser?.is_premium ? '⭐ Premium' : '👤 Usuario gratuito'}
                                    {' · '}Nivel {currentUser?.level || 1} · {currentUser?.points || 0} XP
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={handleSaveAccount}
                                disabled={saving}
                                className="bg-primary hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all flex items-center gap-2"
                            >
                                {saving && <span className="animate-spin material-symbols-outlined text-[18px]">autorenew</span>}
                                Guardar Cambios
                            </button>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Preferencias de Notificaciones</h2>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200">Nuevos Episodios</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Avisarme cuando salga un episodio de mis animes en emisión.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-200">Actualidad de SpoilerSafe</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Recibir noticias sobre nuevas características de la plataforma.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:bg-gray-900 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                );

            case 'spoilers':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Configuración Anti-Spoilers</h2>

                        <div className="bg-orange-50 border-l-4 border-primary p-4 rounded-r-lg mb-6">
                            <p className="text-orange-800 font-medium">Controla cómo de restrictivo quieres que sea nuestro filtro inteligente en títulos, sinopsis y comentarios.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nivel de Bloqueo</label>
                            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block w-full p-3 font-medium cursor-pointer outline-none transition-shadow">
                                <option>Normal (Solo comentarios reportados)</option>
                                <option>Estricto (Filtrado de palabras clave)</option>
                                <option>Extremo (Ocultar todo hasta haberlo visto)</option>
                            </select>
                        </div>
                    </div>
                );

            case 'premium':
                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">Tu Suscripción</h2>

                        <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 rounded-xl text-center">
                            {currentUser?.is_premium ? (
                                <>
                                    <span className="material-symbols-outlined text-yellow-500 text-6xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Miembro Premium</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm">Estás disfrutando de anime en su máxima expresión. Sin anuncios sociales y a la mejor resolución posible.</p>
                                    <button onClick={() => navigate('/premium')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105">
                                        Gestionar Plan
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-primary text-6xl mb-4">diamond</span>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Usuario Gratuito</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm">Mejora a Premium para disfrutar de anime sin anuncios, descargas offline y emblemas exclusivos en tu perfil.</p>
                                    <button onClick={() => navigate('/premium')} className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105">
                                        Subir a Premium
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
                        <span className="material-symbols-outlined text-primary text-4xl">settings</span>
                        Ajustes
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Administra la configuración de tu cuenta y preferencias de SpoilerSafe.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden h-fit">
                        <ul className="flex flex-col">
                            {[
                                { id: 'account', icon: 'person', label: 'Cuenta' },
                                { id: 'notifications', icon: 'notifications', label: 'Notificaciones' },
                                { id: 'spoilers', icon: 'visibility_off', label: 'Anti-Spoilers' },
                                { id: 'premium', icon: 'credit_card', label: 'Suscripción Premium' },
                            ].map(({ id, icon, label }, i, arr) => (
                                <li
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`px-6 py-4 cursor-pointer transition-colors font-bold flex items-center gap-3
                                        ${i < arr.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}
                                        ${activeTab === id ? 'bg-orange-50/50 text-primary border-l-4 border-l-primary' : 'hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                                    {label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 p-8">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
