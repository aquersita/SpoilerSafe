import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getManga, getMangaChaptersFromJikan } from '../services/mangaService';
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

        const fetchMangaDetails = async () => {
            setLoading(true);
            try {
                const res = await getManga(id);
                const media = res.data.Media;
                if ((!media.chapters || media.chapters === 0) && media.idMal) {
                    const jikanChapters = await getMangaChaptersFromJikan(media.idMal);
                    if (jikanChapters) media.chapters = jikanChapters;
                }
                setManga(media);
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
        if (!profile?.uid) return;
        const targetChapters = manga?.chapters || totalChapters;
        const unread = Array.from({ length: targetChapters }, (_, i) => i + 1)
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
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!manga) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-gray-400">
                <span className="material-symbols-outlined text-6xl mb-4 text-gray-600">menu_book</span>
                <p>No se ha encontrado el manga.</p>
                <button onClick={() => navigate('/manga')} className="mt-4 text-primary font-bold hover:underline">
                    Volver al Catálogo
                </button>
            </div>
        );
    }

    const title = manga.title.romaji || manga.title.english;
    const coverImage = manga.coverImage.extraLarge || manga.coverImage.large;
    const bannerImage = manga.bannerImage || coverImage;
    const cleanDescription = manga.description
        ? manga.description.replace(/<[^>]*>?/gm, '')
        : "Sin sinopsis disponible.";
    const knownChapters = manga.chapters && manga.chapters > 0;
    const readCount = readChapters.size;
    const totalChapters = knownChapters ? manga.chapters : Math.max(readCount + 50, 100);

    return (
        <>
            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-bold">
                    {toast}
                </div>
            )}

            {/* ── HERO ── */}
            <section className="relative w-full h-[88vh] min-h-[560px] overflow-hidden bg-gray-950">
                <img
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover object-top opacity-45"
                    src={bannerImage}
                />
                {/* Left gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/75 to-transparent z-10" />
                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-50 dark:from-gray-950 to-transparent z-10" />

                <div className="relative z-20 h-full max-w-[1400px] mx-auto px-6 md:px-10 flex items-center">
                    <div className="flex items-end gap-10 w-full pb-12">

                        {/* Cover poster */}
                        <div className="hidden lg:block shrink-0 self-end">
                            <img
                                src={coverImage}
                                alt={title}
                                className="w-48 xl:w-56 rounded-xl shadow-2xl shadow-black/60 border border-white/10 object-cover aspect-[2/3]"
                            />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 space-y-4 max-w-2xl">
                            {/* Chips */}
                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                <span className="bg-primary text-white px-3 py-1 rounded-full uppercase tracking-wide">
                                    {manga.status === 'RELEASING' ? 'En publicación' : manga.status === 'FINISHED' ? 'Finalizado' : manga.status || 'Finalizado'}
                                </span>
                                {manga.averageScore && (
                                    <span className="flex items-center gap-1 bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 px-2.5 py-1 rounded-full">
                                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        {(manga.averageScore / 10).toFixed(1)}
                                    </span>
                                )}
                                <span className="text-gray-500">·</span>
                                {manga.genres?.slice(0, 3).map((g, i) => (
                                    <span key={i} className="text-gray-300 font-normal">{g}</span>
                                ))}
                            </div>

                            {/* Title */}
                            <h1
                                className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight drop-shadow-xl"
                                style={{ fontFamily: "'Arial Black', sans-serif" }}
                            >
                                {title}
                            </h1>

                            {/* Description */}
                            <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 max-w-xl">
                                {cleanDescription}
                            </p>

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                {/* Favorite */}
                                <button
                                    title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
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
                                    className={`flex items-center gap-2 font-black py-3 px-7 rounded-lg shadow-lg transition-all hover:scale-105 active:scale-100 text-sm uppercase tracking-wide ${
                                        isFavorite
                                            ? 'bg-rose-500 text-white shadow-rose-500/40'
                                            : 'bg-primary hover:bg-orange-500 text-white shadow-primary/40'
                                    }`}
                                >
                                    <span className="material-icons-outlined text-xl">{isFavorite ? 'favorite' : 'favorite_border'}</span>
                                    {isFavorite ? 'En favoritos' : 'Añadir a favoritos'}
                                </button>

                                {/* Back to Manga */}
                                <button
                                    onClick={() => navigate('/manga')}
                                    className="flex items-center gap-2 border-2 border-white/30 hover:border-white/70 text-white font-bold py-3 px-6 rounded-lg bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all text-sm uppercase tracking-wide"
                                >
                                    <span className="material-symbols-outlined">arrow_back</span>
                                    Catálogo
                                </button>
                            </div>

                            {/* Quick stats */}
                            <div className="flex items-center gap-5 text-xs text-gray-500 pt-1">
                                <span>{manga.chapters || '?'} capítulos</span>
                                <span>{manga.volumes || '?'} volúmenes</span>
                                <span className="capitalize">{manga.status?.toLowerCase().replace('_', ' ')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Reading Progress ── */}
            <section className="py-12 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 min-h-[300px]">
                <div className="max-w-[1600px] mx-auto px-8">
                    <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary block rounded-full"></span>
                            Mi Progreso de Lectura
                            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                                ({readCount}/{knownChapters ? totalChapters : '?'} capítulos)
                            </span>
                        </h2>
                        <div className="flex items-center gap-3">
                            {profile?.uid && (readCount < totalChapters) && (
                                <button onClick={markAllRead}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm">
                                    <span className="material-symbols-outlined text-[18px]">done_all</span>
                                    Marcar todos como leídos
                                </button>
                            )}
                            {knownChapters && readCount === totalChapters && totalChapters > 0 && (
                                <span className="flex items-center gap-1.5 text-green-600 text-sm font-bold">
                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    Completado
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-6 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                            <span>{readCount} / {knownChapters ? totalChapters : '?'} capítulos leídos</span>
                            <span className="font-bold text-primary">
                                {knownChapters ? `${Math.round((readCount / totalChapters) * 100)}%` : `${readCount} leídos`}
                            </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-500"
                                style={{ width: knownChapters ? `${(readCount / totalChapters) * 100}%` : `${Math.min((readCount / totalChapters) * 100, 100)}%` }}
                            />
                        </div>
                    </div>

                    {!profile?.uid && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-4">
                            <button onClick={() => navigate('/login')} className="text-primary font-bold hover:underline">Inicia sesión</button>
                            {' '}para rastrear tu lectura y ganar +2 XP por capítulo.
                        </p>
                    )}

                    {/* Chapter grid */}
                    <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-1.5 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                        {Array.from({ length: totalChapters }, (_, i) => i + 1).map(n => {
                            const isRead = readChapters.has(n);
                            return (
                                <button
                                    key={n}
                                    onClick={() => markChapterRead(n)}
                                    title={`Cap. ${n}${isRead ? ' (leído)' : ' — +2 XP'}`}
                                    className={`aspect-square rounded text-[10px] font-bold transition-all ${
                                        isRead
                                            ? 'bg-primary text-white shadow-sm'
                                            : profile?.uid
                                                ? 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-primary/20 hover:text-primary border border-gray-200 dark:border-gray-700'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    {n}
                                </button>
                            );
                        })}
                    </div>
                    {profile?.uid && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-primary">stars</span>
                            Ganas +2 XP por cada capítulo marcado como leído
                        </p>
                    )}
                </div>
            </section>

            {/* ── Dónde Leer ── */}
            {(manga.externalLinks || []).filter(l => l.site && l.url).length > 0 && (
                <section className="py-10 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
                    <div className="max-w-[1600px] mx-auto px-8">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
                            <span className="w-1 h-6 bg-primary block rounded-full"></span>
                            Dónde Leer
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {manga.externalLinks.filter(l => l.site && l.url).map((link, i) => (
                                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                   className="flex items-center gap-3 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-primary hover:shadow-md p-4 rounded-lg group transition-all">
                                    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-primary/10 shrink-0">
                                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-primary text-lg">open_in_new</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-primary truncate transition-colors">{link.site}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </>
    );
};

export default MangaDetails;
