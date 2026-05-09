import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getManga } from '../services/mangaService';
import { getMangaProgress, markChapterRead as markChapterReadService } from '../services/progressService';
import { checkIsFavorite, addFavorite, removeFavorite } from '../services/favoritesService';

const MangaDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const [manga, setManga] = useState(null);
    const [loading, setLoading] = useState(true);
    const [readChapters, setReadChapters] = useState(new Set());
    const [isFavorite, setIsFavorite] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.classList.remove('dark');

        const fetchMangaDetails = async () => {
            setLoading(true);
            try {
                const res = await getManga(id);
                setManga(res.data.Media);
            } catch (err) {
                console.error("Error fetching manga details:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMangaDetails();
    }, [id]);

    useEffect(() => {
        if (!id || !profile?.uid) return;
        getMangaProgress(profile.uid, id)
            .then(read => setReadChapters(new Set(read)))
            .catch(() => {});
        checkIsFavorite(profile.uid, 'manga', id)
            .then(fav => setIsFavorite(fav))
            .catch(() => {});
    }, [id, profile?.uid]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const markChapterRead = async (chNum) => {
        if (!profile?.uid) { navigate('/login'); return; }
        if (readChapters.has(chNum)) return;
        try {
            const res = await markChapterReadService(profile.uid, id, chNum);
            setReadChapters(prev => new Set([...prev, chNum]));
            if (res.points_earned > 0) {
                showToast(`+${res.points_earned} XP — Capítulo ${chNum} leído`);
            }
        } catch {
            showToast('Error al marcar capítulo');
        }
    };

    const markAllRead = async () => {
        if (!profile?.uid || !manga?.chapters) return;
        const unread = Array.from({ length: manga.chapters }, (_, i) => i + 1)
            .filter(n => !readChapters.has(n));
        if (unread.length === 0) return;
        let total = 0;
        for (const n of unread) {
            try {
                const res = await markChapterReadService(profile.uid, id, n);
                total += res.points_earned || 0;
                setReadChapters(prev => new Set([...prev, n]));
            } catch { /* continue */ }
        }
        showToast(`+${total} XP — ${unread.length} capítulos marcados`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!manga) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-500">
                <span className="material-symbols-outlined text-6xl mb-4 text-gray-300">menu_book</span>
                <p>No se ha encontrado el manga.</p>
                <button onClick={() => navigate('/manga')} className="mt-4 text-primary font-bold hover:underline">
                    Volver al Catálogo
                </button>
            </div>
        );
    }

    const title = manga.title.romaji || manga.title.english;
    const cleanDescription = manga.description
        ? manga.description.replace(/<[^>]*>?/gm, '')
        : "Sin sinopsis disponible.";
    const totalChapters = manga.chapters || 0;
    const readCount = readChapters.size;

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-bold">
                    {toast}
                </div>
            )}

            {/* Banner */}
            <div className="w-full h-[35vh] md:h-[45vh] bg-gray-900 relative">
                {manga.bannerImage ? (
                    <img src={manga.bannerImage} alt="Banner" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-gray-800 to-gray-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/20 to-transparent" />
            </div>

            <div className="max-w-[1200px] mx-auto px-4 md:px-8 relative -mt-32 md:-mt-48 z-10 flex flex-col md:flex-row gap-8">
                {/* Left Column */}
                <div className="w-48 md:w-64 shrink-0 mx-auto md:mx-0">
                    <img
                        src={manga.coverImage.extraLarge}
                        alt={title}
                        className="w-full rounded-xl shadow-2xl border-4 border-white bg-white"
                    />
                    <button
                        onClick={() => navigate('/manga')}
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:text-primary hover:border-primary font-bold py-3 px-4 rounded-lg shadow-sm transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                        Volver a Mangas
                    </button>
                </div>

                {/* Right Column */}
                <div className="flex-1 mt-4 md:mt-24 bg-white md:bg-transparent p-6 md:p-0 rounded-xl shadow-sm md:shadow-none border md:border-none border-gray-100">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {manga.genres && manga.genres.map(genre => (
                            <span key={genre} className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full uppercase">
                                {genre}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-2 leading-tight">{title}</h1>

                    {/* Botón favorito */}
                    <div className="mb-6">
                        <button
                            onClick={async () => {
                                if (!profile?.uid) { navigate('/login'); return; }
                                try {
                                    if (isFavorite) {
                                        await removeFavorite(profile.uid, 'manga', id);
                                        setIsFavorite(false);
                                        showToast('Eliminado de favoritos');
                                    } else {
                                        await addFavorite(profile.uid, {
                                            media_id: parseInt(id),
                                            media_type: 'manga',
                                            title: manga.title?.romaji || manga.title?.english || '',
                                            cover_image: manga.coverImage?.extraLarge || manga.coverImage?.large || '',
                                            banner_image: manga.bannerImage || '',
                                            genres: manga.genres || [],
                                            average_score: manga.averageScore || null,
                                        });
                                        setIsFavorite(true);
                                        showToast('¡Añadido a favoritos!');
                                    }
                                } catch (err) {
                                    showToast('Error al actualizar favoritos');
                                }
                            }}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                isFavorite
                                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-rose-400 hover:text-rose-500'
                            }`}
                        >
                            <span className="material-symbols-outlined text-lg"
                                style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                                favorite
                            </span>
                            {isFavorite ? 'En favoritos' : 'Añadir a favoritos'}
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-6 mb-8 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="material-symbols-outlined text-yellow-500">star</span>
                            <span className="font-bold">{manga.averageScore ? `${manga.averageScore}%` : 'N/A'}</span>
                            <span className="text-gray-400">Score</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="material-symbols-outlined text-blue-500">menu_book</span>
                            <span className="font-bold">{manga.chapters || '?'}</span>
                            <span className="text-gray-400">Capítulos</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <span className="material-symbols-outlined text-green-500">info</span>
                            <span className="font-bold capitalize">{manga.status?.toLowerCase().replace('_', ' ')}</span>
                            <span className="text-gray-400">Estado</span>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">menu_book</span>
                            Sinopsis
                        </h3>
                        <p className="text-gray-600 leading-relaxed">{cleanDescription}</p>
                    </div>

                    {/* Seguimiento de lectura */}
                    {totalChapters > 0 && (
                        <div className="mb-10 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">bookmark_added</span>
                                    Mi Progreso de Lectura
                                </h3>
                                {profile?.uid && readCount < totalChapters && (
                                    <button onClick={markAllRead}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">done_all</span>
                                        Marcar todo
                                    </button>
                                )}
                            </div>

                            <div className="mb-4">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{readCount} / {totalChapters} capítulos</span>
                                    <span className="font-bold text-primary">
                                        {Math.round((readCount / totalChapters) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${(readCount / totalChapters) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {!profile?.uid && (
                                <p className="text-sm text-gray-400 italic mb-3">
                                    <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">Inicia sesión</button>
                                    {' '}para rastrear tu lectura y ganar +2 XP por capítulo.
                                </p>
                            )}

                            <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1.5 max-h-48 overflow-y-auto">
                                {Array.from({ length: totalChapters }, (_, i) => i + 1).map(n => {
                                    const isRead = readChapters.has(n);
                                    return (
                                        <button
                                            key={n}
                                            onClick={() => markChapterRead(n)}
                                            title={`Cap. ${n}${isRead ? ' (leído)' : ' — +2 XP'}`}
                                            className={`aspect-square rounded text-[10px] font-bold transition-all ${
                                                isRead
                                                    ? 'bg-primary text-white'
                                                    : profile?.uid
                                                        ? 'bg-gray-100 text-gray-500 hover:bg-primary/20 hover:text-primary'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    );
                                })}
                            </div>
                            {profile?.uid && (
                                <p className="text-[11px] text-gray-400 mt-3 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px] text-primary">stars</span>
                                    Ganas +2 XP por cada capítulo marcado como leído
                                </p>
                            )}
                        </div>
                    )}

                    {/* Dónde Leer — solo plataformas oficiales/legales */}
                    {(() => {
                        const OFFICIAL = ['Viz', 'Shonen Jump', 'Manga Plus', 'MangaPlus', 'Crunchyroll', 'BookWalker', 'ComiXology', 'Amazon', 'Yen Press', 'Seven Seas', 'Dark Horse', 'Kodansha', 'Square Enix', 'Shogakukan', 'Shueisha'];
                        const official = (manga.externalLinks || []).filter(l =>
                            OFFICIAL.some(name => l.site?.toLowerCase().includes(name.toLowerCase()))
                        );
                        if (!official.length) return null;
                        return (
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">link</span>
                                    Dónde Leer Oficialmente
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {official.map((link, i) => (
                                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center gap-3 bg-white border border-gray-200 hover:border-primary hover:shadow-md p-4 rounded-xl group transition-all">
                                            <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                                                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary">open_in_new</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{link.site}</p>
                                                <p className="text-xs text-gray-500 truncate">Ir a la web</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default MangaDetails;
