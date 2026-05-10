import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getWatchlist, removeFromWatchlist } from '../services/watchlistService';

const Watchlist = ({ user }) => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const currentUser = user || profile;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWatchlist = async () => {
        if (!currentUser?.uid) { setLoading(false); return; }
        try {
            const data = await getWatchlist(currentUser.uid);
            setItems(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { window.scrollTo(0, 0); fetchWatchlist(); }, [currentUser?.uid]);

    const handleRemove = async (animeId) => {
        try {
            await removeFromWatchlist(currentUser.uid, animeId);
            setItems(prev => prev.filter(a => a.id !== animeId));
            toast.success('Eliminado de tu lista');
        } catch { toast.error('Error al eliminar'); }
    };

    if (!currentUser) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 px-4">
            <span className="material-symbols-outlined text-6xl mb-4 text-gray-300">lock</span>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Inicia sesión</h2>
            <p className="text-sm text-center">Necesitas iniciar sesión para ver tu watchlist.</p>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-12 md:py-16 mb-8">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-primary text-3xl">bookmark</span>
                        <span className="text-white/60 font-bold text-sm uppercase tracking-widest">Mi Colección</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        Mi Watchlist
                    </h1>
                    <p className="text-white/60 mt-2 text-lg">
                        {items.length} anime{items.length !== 1 ? 's' : ''} guardado{items.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6">
                {items.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-16 text-center">
                        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">bookmark_border</span>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Tu watchlist está vacía</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Explora el catálogo y guarda los animes que quieras ver.</p>
                        <button onClick={() => navigate('/catalog')}
                            className="bg-primary hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
                            Explorar Catálogo
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map(anime => {
                            const title = anime.title?.romaji || anime.title?.english || 'Sin título';
                            const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : null;
                            const statusLabel = anime.status === 'RELEASING' ? 'En Emisión' : anime.status === 'NOT_YET_RELEASED' ? 'Próximamente' : 'Finalizado';
                            const statusColor = anime.status === 'RELEASING' ? 'text-green-600 bg-green-50' : anime.status === 'NOT_YET_RELEASED' ? 'text-blue-600 bg-blue-50' : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800';

                            return (
                                <div key={anime.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow flex group">
                                    {/* Cover */}
                                    <div className="w-24 md:w-32 shrink-0 cursor-pointer" onClick={() => navigate(`/anime/${anime.id}`)}>
                                        <img src={anime.coverImage?.large} alt={title}
                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 p-4 md:p-5 flex flex-col justify-between min-w-0">
                                        <div>
                                            <div className="flex items-start justify-between gap-3">
                                                <h3 className="font-black text-gray-900 dark:text-white text-lg truncate cursor-pointer hover:text-primary transition-colors"
                                                    onClick={() => navigate(`/anime/${anime.id}`)}>
                                                    {title}
                                                </h3>
                                                <button onClick={() => handleRemove(anime.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1" title="Eliminar de la lista">
                                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${statusColor}`}>{statusLabel}</span>
                                                {score && (
                                                    <span className="flex items-center gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="material-symbols-outlined text-yellow-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                        {score}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-400">{anime.episodes || '?'} eps</span>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 truncate">{anime.genres?.join(', ')}</p>
                                        </div>
                                        <div className="flex items-center gap-3 mt-3">
                                            <button onClick={() => navigate(`/anime/${anime.id}`)}
                                                className="bg-primary hover:bg-orange-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                                                Ver Detalles
                                            </button>
                                            {anime.added_at && (
                                                <span className="text-[10px] text-gray-400">
                                                    Añadido {new Date(anime.added_at?.toDate ? anime.added_at.toDate() : anime.added_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Watchlist;
