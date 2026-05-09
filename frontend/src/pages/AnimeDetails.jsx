import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getAnime } from '../services/animeService';
import { checkInWatchlist, addToWatchlist, removeFromWatchlist } from '../services/watchlistService';
import { checkIsFavorite, addFavorite, removeFavorite } from '../services/favoritesService';
import { getAnimeProgress, markEpisodeWatched } from '../services/progressService';
import { getCapsules, createCapsule } from '../services/capsulesService';
import { isAgeVerified } from '../utils/ageGate';

const AnimeDetails = ({ user }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profile } = useAuth();
    const currentUser = user || profile;

    const [anime, setAnime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [capsules, setCapsules] = useState([]);
    const [newCapsuleText, setNewCapsuleText] = useState('');
    const [unlockEpisode, setUnlockEpisode] = useState(1);
    const [epsToShow, setEpsToShow] = useState(24);
    const [inWatchlist, setInWatchlist] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [watchedEps, setWatchedEps] = useState(new Set());
    const [ageGateVisible, setAgeGateVisible] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.classList.remove('dark');

        const fetchAnime = async () => {
            setLoading(true);
            setEpsToShow(24);
            try {
                const res = await getAnime(id);
                const mediaData = res.data.Media;
                setAnime(mediaData);
                if (mediaData.isAdult && !isAgeVerified()) {
                    setAgeGateVisible(true);
                }

                // Save to history
                const historyItem = {
                    title: mediaData.title?.romaji || mediaData.title?.english || 'Anime',
                    image: mediaData.coverImage?.large,
                    path: `/anime/${id}`,
                    visitedAt: new Date().toISOString()
                };
                const existing = JSON.parse(localStorage.getItem('spoilersafe_history') || '[]');
                const filtered = existing.filter(h => h.path !== historyItem.path);
                filtered.unshift(historyItem);
                localStorage.setItem('spoilersafe_history', JSON.stringify(filtered.slice(0, 50)));

if (currentUser?.uid) {
                    const uid = currentUser.uid;
                    try {
                        setInWatchlist(await checkInWatchlist(uid, id));
                    } catch (e) { /* ignore */ }
                    try {
                        setIsFavorite(await checkIsFavorite(uid, 'anime', id));
                    } catch (e) { /* ignore */ }
                    try {
                        const watched = await getAnimeProgress(uid, id);
                        setWatchedEps(new Set(watched));
                    } catch (e) { /* ignore */ }
                    try {
                        const caps = await getCapsules(uid, id, 0);
                        setCapsules(caps);
                    } catch (e) { console.error(e); }
                }
            } catch (err) {
                console.error("Error fetching anime:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAnime();
        }
    }, [id]);

    const handleCreateCapsule = async () => {
        if (!currentUser) {
            toast.error("Debes iniciar sesión para crear cápsulas.");
            return;
        }
        if (!newCapsuleText.trim()) return;

        try {
            await createCapsule(currentUser.uid, currentUser.username, id, newCapsuleText, unlockEpisode);
            toast.success(`Cápsula enterrada! Se abrirá en el ep ${unlockEpisode}`);
            setNewCapsuleText('');

            const caps = await getCapsules(currentUser.uid, id, 0);
            setCapsules(caps);
        } catch (err) {
            toast.error("Error al crear la cápsula");
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-white flex items-center justify-center">Cargando detalles...</div>;
    }

    if (!anime) {
        return <div className="min-h-screen bg-white flex items-center justify-center">Anime no encontrado</div>;
    }

    if (ageGateVisible) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
                <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                    <div className="w-16 h-16 rounded-full bg-red-900/40 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
                        <span className="material-symbols-outlined text-red-400 text-4xl">18_up_rating</span>
                    </div>
                    <h2 className="text-white font-black text-2xl mb-2">Contenido +18</h2>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Este anime está clasificado para mayores de 18 años.<br />¿Confirmas que tienes 18 años o más?
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                localStorage.setItem('spoilersafe_age_verified', 'true');
                                setAgeGateVisible(false);
                            }}
                            className="flex-1 bg-primary hover:bg-orange-500 text-white font-black py-3 rounded-xl transition-all hover:scale-105 active:scale-100"
                        >
                            Sí, tengo +18
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-xl transition-colors"
                        >
                            Volver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const title = anime.title.romaji || anime.title.english;
    const coverImage = anime.coverImage.extraLarge || anime.coverImage.large;
    const streamingThumb = anime.streamingEpisodes?.find(ep => ep.thumbnail)?.thumbnail;
    const bannerImage = streamingThumb || anime.bannerImage || coverImage;
    const totalEpisodes = anime.episodes || (anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : 12);

    return (
        <React.Fragment>
            {/* ── HERO ── */}
            <section className="relative w-full h-[88vh] min-h-[560px] overflow-hidden bg-gray-950">
                {/* Banner image — sin blend modes */}
                <img
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover object-top opacity-45"
                    src={bannerImage}
                />
                {/* Gradiente lateral izquierdo */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/75 to-transparent z-10" />
                {/* Gradiente inferior hacia la siguiente sección */}
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-50 to-transparent z-10" />

                <div className="relative z-20 h-full max-w-[1400px] mx-auto px-6 md:px-10 flex items-center">
                    <div className="flex items-end gap-10 w-full pb-12">

                        {/* Cover poster — visible en lg+ */}
                        <div className="hidden lg:block shrink-0 self-end">
                            <img
                                src={coverImage}
                                alt={title}
                                className="w-48 xl:w-56 rounded-xl shadow-2xl shadow-black/60 border border-white/10 object-cover aspect-[2/3]"
                            />
                        </div>

                        {/* Contenido principal */}
                        <div className="flex-1 space-y-4 max-w-2xl">
                            {/* Chips de info */}
                            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                                <span className="bg-primary text-white px-3 py-1 rounded-full uppercase tracking-wide">
                                    {anime.status === 'RELEASING' ? 'En emisión' : anime.status === 'FINISHED' ? 'Finalizado' : anime.status || 'Finalizado'}
                                </span>
                                {anime.averageScore && (
                                    <span className="flex items-center gap-1 bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 px-2.5 py-1 rounded-full">
                                        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        {(anime.averageScore / 10).toFixed(1)}
                                    </span>
                                )}
                                {anime.seasonYear && (
                                    <span className="text-gray-400 font-normal">{anime.seasonYear}</span>
                                )}
                                <span className="text-gray-500">·</span>
                                {anime.genres?.slice(0, 3).map((g, i) => (
                                    <span key={i} className="text-gray-300 font-normal">{g}</span>
                                ))}
                            </div>

                            {/* Título */}
                            <h1
                                className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-none tracking-tight drop-shadow-xl"
                                style={{ fontFamily: "'Arial Black', sans-serif" }}
                            >
                                {title}
                            </h1>

                            {/* Descripción */}
                            <p
                                className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 max-w-xl"
                                dangerouslySetInnerHTML={{ __html: anime.description || 'Sin descripción disponible.' }}
                            />

                            {/* Botones — jerarquía clara */}
                            <div className="flex items-center gap-3 pt-2 flex-wrap">
                                {/* Primario */}
                                <button
                                    onClick={() => navigate(`/anime/${id}/episode/1`)}
                                    className="flex items-center gap-2 bg-primary hover:bg-orange-500 active:bg-orange-700 text-white font-black py-3 px-7 rounded-lg shadow-lg shadow-primary/40 transition-all hover:scale-105 active:scale-100 text-sm uppercase tracking-wide"
                                >
                                    <span className="material-icons text-xl">play_arrow</span>
                                    Ver Episodio 1
                                </button>

                                {/* Secundario — tráiler */}
                                {anime.trailer?.id && (
                                    <button
                                        onClick={() => window.open(`https://youtube.com/watch?v=${anime.trailer.id}`, '_blank')}
                                        className="flex items-center gap-2 border-2 border-white/30 hover:border-white/70 text-white font-bold py-3 px-6 rounded-lg bg-white/5 hover:bg-white/10 backdrop-blur-sm transition-all text-sm uppercase tracking-wide"
                                    >
                                        <span className="material-icons-outlined">movie</span>
                                        Tráiler
                                    </button>
                                )}

                                {/* Favorito */}
                                <button
                                    title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                                    onClick={async () => {
                                        if (!currentUser?.uid) { toast.error('Inicia sesión primero'); return; }
                                        try {
                                            if (isFavorite) {
                                                await removeFavorite(currentUser.uid, 'anime', id);
                                                setIsFavorite(false);
                                                toast.success('Eliminado de favoritos');
                                            } else {
                                                await addFavorite(currentUser.uid, {
                                                    media_id: parseInt(id),
                                                    media_type: 'anime',
                                                    title: anime.title?.romaji || anime.title?.english || '',
                                                    cover_image: anime.coverImage?.extraLarge || anime.coverImage?.large || '',
                                                    banner_image: anime.bannerImage || '',
                                                    genres: anime.genres || [],
                                                    average_score: anime.averageScore || null,
                                                });
                                                setIsFavorite(true);
                                                toast.success('¡Añadido a favoritos!');
                                            }
                                        } catch (err) {
                                            toast.error('Error al actualizar favoritos');
                                        }
                                    }}
                                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 active:scale-100 ${
                                        isFavorite
                                            ? 'border-rose-400 bg-rose-500/20 text-rose-300 shadow-md shadow-rose-500/20'
                                            : 'border-white/30 hover:border-rose-400/60 text-white bg-white/5 hover:bg-rose-500/10'
                                    }`}
                                >
                                    <span className="material-icons-outlined text-xl">{isFavorite ? 'favorite' : 'favorite_border'}</span>
                                </button>

                                {/* Terciario — watchlist (solo icono) */}
                                <button
                                    title={inWatchlist ? 'Quitar de mi lista' : 'Añadir a mi lista'}
                                    onClick={async () => {
                                        if (!currentUser?.uid) { toast.error('Inicia sesión primero'); return; }
                                        try {
                                            if (inWatchlist) {
                                                await removeFromWatchlist(currentUser.uid, id);
                                                setInWatchlist(false);
                                                toast.success('Eliminado de tu lista');
                                            } else {
                                                await addToWatchlist(currentUser.uid, id, {
                                                    title: anime.title,
                                                    coverImage: anime.coverImage,
                                                    bannerImage: anime.bannerImage,
                                                    genres: anime.genres,
                                                    episodes: anime.episodes,
                                                    averageScore: anime.averageScore,
                                                    status: anime.status,
                                                });
                                                setInWatchlist(true);
                                                toast.success('Añadido a tu lista');
                                            }
                                        } catch (err) {
                                            toast.error('Error al actualizar la lista');
                                        }
                                    }}
                                    className={`p-3 rounded-lg border-2 transition-all hover:scale-105 active:scale-100 ${
                                        inWatchlist
                                            ? 'border-primary bg-primary/20 text-primary shadow-md shadow-primary/20'
                                            : 'border-white/30 hover:border-white/60 text-white bg-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <span className="material-icons-outlined text-xl">{inWatchlist ? 'bookmark' : 'bookmark_border'}</span>
                                </button>
                            </div>

                            {/* Stats rápidos */}
                            <div className="flex items-center gap-5 text-xs text-gray-500 pt-1">
                                <span>{totalEpisodes} episodios</span>
                                {anime.season && <span className="capitalize">{anime.season.toLowerCase()} {anime.seasonYear}</span>}
                                <span className="bg-white/10 text-gray-300 px-2 py-0.5 rounded border border-white/10">Sub · Dob</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dónde Ver Section */}
            {(() => {
                const katanime = { site: 'KATANIME', url: `https://katanime.net/buscar?q=${encodeURIComponent(title)}` };
                const anilistLinks = (anime.externalLinks || []).filter(l => l.site && l.url);
                const allLinks = [katanime, ...anilistLinks];
                return (
                    <section className="py-10 bg-gray-50 border-t border-gray-100">
                        <div className="max-w-[1600px] mx-auto px-8">
                            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                                <span className="w-1 h-6 bg-primary block rounded-full"></span>
                                Dónde Ver
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {allLinks.map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                       className="flex items-center gap-3 bg-white border border-gray-200 hover:border-primary hover:shadow-md p-4 rounded-lg group transition-all">
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary/10 shrink-0">
                                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-lg">open_in_new</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 group-hover:text-primary truncate transition-colors">{link.site}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            })()}

            {/* Episodios Section */}
            <section className="py-12 bg-white border-t border-gray-100 min-h-[400px]">
                <div className="max-w-[1600px] mx-auto px-8">
                    <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary block rounded-full"></span>
                            Episodios
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({totalEpisodes} episodios{anime.status === 'RELEASING' ? ' • En emisión' : ''})
                            </span>
                        </h2>
                        {currentUser?.uid && watchedEps.size < totalEpisodes && (
                            <button
                                onClick={async () => {
                                    if (!currentUser?.uid) return;
                                    const unread = Array.from({ length: totalEpisodes }, (_, i) => i + 1).filter(n => !watchedEps.has(n));
                                    let earned = 0;
                                    for (const n of unread) {
                                        try {
                                            const res = await markEpisodeWatched(currentUser.uid, id, n);
                                            earned += res.points_earned || 0;
                                            setWatchedEps(prev => new Set([...prev, n]));
                                        } catch { /* continue */ }
                                    }
                                    toast.success(`+${earned} XP — ¡Anime completado!`);
                                }}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">done_all</span>
                                Marcar todos como vistos
                            </button>
                        )}
                        {watchedEps.size === totalEpisodes && totalEpisodes > 0 && (
                            <span className="flex items-center gap-1.5 text-green-600 text-sm font-bold">
                                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                Completado
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {Array.from({ length: Math.min(totalEpisodes, epsToShow) }).map((_, i) => {
                            const epN = i + 1;
                            const watched = watchedEps.has(epN);
                            return (
                            <div key={i} onClick={() => navigate(`/anime/${id}/episode/${epN}`)}
                                 className={`group cursor-pointer bg-white rounded-md overflow-hidden border transition-all flex flex-col ${watched ? 'border-green-300 hover:shadow-lg hover:border-green-400' : 'border-gray-200 hover:shadow-lg hover:border-primary'}`}>
                                <div className="relative aspect-video bg-gray-800 overflow-hidden">
                                    <img src={bannerImage || coverImage} alt={`Ep ${epN}`}
                                         className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${watched ? 'opacity-50 group-hover:opacity-80' : 'opacity-70 group-hover:opacity-100'}`} />
                                    <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                        EP {epN}
                                    </div>
                                    {watched && (
                                        <div className="absolute top-1.5 right-1.5 bg-green-500 text-white rounded-full p-0.5">
                                            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-primary text-white rounded-full p-2 shadow-lg">
                                            <span className="material-icons text-lg">play_arrow</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2.5">
                                    <h3 className={`font-bold text-xs transition-colors ${watched ? 'text-green-600 group-hover:text-green-700' : 'text-gray-800 group-hover:text-primary'}`}>Episodio {epN}</h3>
                                </div>
                            </div>
                            );
                        })}

                        {/* Próximamente card */}
                        {anime.nextAiringEpisode && (
                            <div className="bg-gray-100 rounded-md overflow-hidden border-2 border-dashed border-gray-300 flex flex-col opacity-70 cursor-default">
                                <div className="relative aspect-video bg-gray-200 overflow-hidden flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-gray-400 text-4xl">schedule</span>
                                    </div>
                                    <div className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                        EP {anime.nextAiringEpisode.episode}
                                    </div>
                                </div>
                                <div className="p-2.5 text-center">
                                    <h3 className="font-bold text-gray-500 text-xs uppercase">Próximamente</h3>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {new Date(anime.nextAiringEpisode.airingAt * 1000).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {epsToShow < totalEpisodes && (
                        <div className="mt-8 flex justify-center">
                            <button onClick={() => setEpsToShow(prev => Math.min(prev + 24, totalEpisodes))}
                                className="bg-primary hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                Cargar más episodios ({Math.min(epsToShow + 24, totalEpisodes)} de {totalEpisodes})
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* Cápsulas del Tiempo Section */}
            <section className="py-12 bg-gray-50 border-t border-gray-100 min-h-[300px]">
                <div className="max-w-[1600px] mx-auto px-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 mb-8">
                        <span className="w-1 h-6 bg-primary block rounded-full"></span>
                        Cápsulas del Tiempo ⏳
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Crear Cápsula */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">add_box</span>
                                Enterrar Nueva Cápsula
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">Escribe tus teorías iniciales. Permanecerán bloqueadas hasta que alcances el episodio objetivo.</p>

                            <textarea
                                className="w-full bg-gray-50 border border-gray-200 rounded p-3 text-sm focus:ring-2 focus:ring-primary outline-none mb-3 resize-none"
                                rows="3"
                                placeholder="Yo creo que el villano es..."
                                value={newCapsuleText}
                                onChange={(e) => setNewCapsuleText(e.target.value)}
                            ></textarea>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <label className="text-sm font-bold text-gray-600">Abrir en Ep:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={anime.episodes || 100}
                                        className="w-16 p-1 border border-gray-200 rounded text-center"
                                        value={unlockEpisode}
                                        onChange={(e) => setUnlockEpisode(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleCreateCapsule}
                                    className="bg-primary hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-sm text-sm uppercase transition-colors"
                                >
                                    Enterrar
                                </button>
                            </div>
                        </div>

                        {/* Mis Cápsulas */}
                        <div className="lg:col-span-2">
                            {capsules.length === 0 ? (
                                <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
                                    No tienes cápsulas enterradas para este anime.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {capsules.map((cap, i) => (
                                        <div key={i} className={`p-5 rounded-lg border relative overflow-hidden ${cap.locked ? 'bg-gray-100 border-gray-200' : 'bg-white border-green-200 shadow-sm'}`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Cápsula #{i+1}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${cap.locked ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                                    {cap.locked ? `Bloqueada hasta Ep ${cap.unlock_at}` : 'Desbloqueada'}
                                                </span>
                                            </div>

                                            {cap.locked ? (
                                                <div className="flex flex-col items-center justify-center py-4 opacity-50 select-none">
                                                    <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">lock</span>
                                                    <div className="h-2 w-3/4 bg-gray-300 rounded-full mb-2"></div>
                                                    <div className="h-2 w-1/2 bg-gray-300 rounded-full"></div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-800 text-sm font-medium">"{cap.content}"</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </React.Fragment>
    );
};

export default AnimeDetails;
