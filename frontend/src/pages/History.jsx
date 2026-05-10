import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const History = ({ user }) => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const currentUser = user || profile;
    const [history, setHistory] = useState([]);

    const storageKey = currentUser?.uid ? `spoilersafe_history_${currentUser.uid}` : null;

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!storageKey) { setHistory([]); return; }
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        setHistory(stored);
    }, [storageKey]);

    const clearHistory = () => {
        if (!storageKey) return;
        localStorage.removeItem(storageKey);
        setHistory([]);
    };

    const removeItem = (index) => {
        if (!storageKey) return;
        const updated = history.filter((_, i) => i !== index);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setHistory(updated);
    };

    if (!user) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-4">
            <span className="material-symbols-outlined text-6xl mb-4 text-gray-300">lock</span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Inicia sesión</h2>
            <p className="text-sm text-center">Necesitas iniciar sesión para ver tu historial.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-12 md:py-16 mb-8">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary text-3xl">history</span>
                        <span className="text-white/60 font-bold text-sm uppercase tracking-widest">Actividad</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        Mi Historial
                    </h1>
                    <p className="text-white/60 mt-2 text-lg">
                        {history.length} elemento{history.length !== 1 ? 's' : ''} visitado{history.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6">
                {history.length > 0 && (
                    <div className="flex justify-end mb-6">
                        <button onClick={clearHistory}
                            className="text-sm font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                            Borrar todo el historial
                        </button>
                    </div>
                )}

                {history.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-16 text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">schedule</span>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Tu historial está vacío</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Navega por el catálogo y entra en animes para que aparezcan aquí.</p>
                        <button onClick={() => navigate('/catalog')}
                            className="bg-primary hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                            Explorar Catálogo
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((item, i) => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow flex group">
                                <div className="w-20 md:w-28 shrink-0 cursor-pointer bg-gray-100 dark:bg-gray-800"
                                     onClick={() => navigate(item.path)}>
                                    {item.image ? (
                                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-gray-300 text-3xl">movie</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 p-4 flex items-center justify-between min-w-0">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate cursor-pointer hover:text-primary transition-colors"
                                            onClick={() => navigate(item.path)}>
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.episode && (
                                                <span className="text-xs text-primary font-bold bg-orange-50 px-2 py-0.5 rounded">
                                                    Ep. {item.episode}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {item.visitedAt ? new Date(item.visitedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                        <button onClick={() => navigate(item.path)}
                                            className="bg-gray-100 dark:bg-gray-800 hover:bg-primary hover:text-white text-gray-500 dark:text-gray-400 p-2 rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                                        </button>
                                        <button onClick={() => removeItem(i)}
                                            className="text-gray-300 hover:text-red-500 p-2 rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
