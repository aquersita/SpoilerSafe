
import SpoilerFog from '../components/SpoilerFog';
const EpisodePlayer = ({ user }) => {
    const navigate = useNavigate();
    const { id, episodeNumber } = useParams();
    const [anime, setAnime] = useState(null);
    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isWatched, setIsWatched] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [id, episodeNumber]);

    const fetchComments = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.get(`${API}/anime/${id}/episodes/${episodeNumber}/comments`, { headers });
            setComments(res.data);
        } catch (err) {
            console.error("Error fetching comments:", err);
        }
    };

    const handlePostComment = async () => {
        if (!user) {
            toast.error("Debes iniciar sesión para comentar.");
            return;
        }
        if (!newCommentText.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API}/anime/${id}/episodes/${episodeNumber}/comments`, {
                content: newCommentText,
                timestamp: 0 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success("Comentario publicado!");
            setNewCommentText('');
            setIsSpoiler(false);
            fetchComments();
        } catch (err) {
            toast.error("Error al publicar comentario");
        }
    };

    const handleLike = async (commentId) => {
        if (!user) { toast.error("Inicia sesión para dar like"); return; }
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API}/comments/${commentId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchComments();
        } catch (err) { toast.error("Error al dar like"); }
    };

    const handleReport = async (commentId) => {
        if (!user) { toast.error("Inicia sesión para reportar"); return; }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/comments/${commentId}/report`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(res.data.msg);
            fetchComments();
        } catch (err) { toast.error("Error al reportar"); }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.classList.remove('dark');

        const fetchAnime = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${API}/anime/${id}`);
                const mediaData = res.data.data.Media;
                setAnime(mediaData);

                const token = localStorage.getItem('token');
                if (token) {
                    axios.get(`${API}/anime/${id}/progress`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(r => {
                        setIsWatched(r.data.watched_episodes.includes(parseInt(episodeNumber)));
                    }).catch(() => {});
                }

                // Save episode to history
                const historyItem = {
                    title: mediaData.title?.romaji || mediaData.title?.english || 'Anime',
                    image: mediaData.coverImage?.large,
                    path: `/anime/${id}/episode/${episodeNumber}`,
                    episode: episodeNumber,
                    visitedAt: new Date().toISOString()
                };
                const existing = JSON.parse(localStorage.getItem('spoilersafe_history') || '[]');
                const filtered = existing.filter(h => h.path !== historyItem.path);
                filtered.unshift(historyItem);
                localStorage.setItem('spoilersafe_history', JSON.stringify(filtered.slice(0, 50)));
            } catch (err) {
                console.error("Error fetching anime:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchAnime();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    const title = anime?.title?.romaji || anime?.title?.english || 'Anime';
    const coverImage = anime?.coverImage?.extraLarge || anime?.coverImage?.large || '';
    const epNum = parseInt(episodeNumber || 1);
    // Thumbnail del episodio específico (1920×1080 de Crunchyroll) → mejor que el banner corto de AniList
    const episodeThumb = anime?.streamingEpisodes?.[epNum - 1]?.thumbnail;
    const bannerImage = episodeThumb || anime?.bannerImage || coverImage;
    const totalEps = anime?.episodes || (anime?.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : 12);
    const hasPrev = epNum > 1;
    const hasNext = epNum < totalEps;

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* Hero Banner */}
            <div className="w-full h-[35vh] md:h-[40vh] bg-gray-900 relative overflow-hidden">
                <img src={bannerImage} alt={title} className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-gray-900/50"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 to-transparent"></div>

                <div className="absolute inset-0 flex items-center z-10">
                    <div className="max-w-[1200px] mx-auto px-6 w-full">
                        <button onClick={() => navigate(`/anime/${id}`)} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-4 transition-colors">
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Volver a {title}
                        </button>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded">EPISODIO {epNum}</span>
                            <span className="text-white/60 text-sm">de {totalEps}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                            {title}
                        </h1>
                        <p className="text-white/60 text-base mt-2">Temporada {anime?.season || '?'} · {anime?.seasonYear || ''}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-4 md:px-6 -mt-8 relative z-10">
                {/* Navigation entre episodios */}
                <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-8">
                    <button disabled={!hasPrev} onClick={() => navigate(`/anime/${id}/episode/${epNum - 1}`)}
                        className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                        Episodio {epNum - 1}
                    </button>
                    <span className="text-lg font-black text-gray-900">Ep. {epNum}</span>
                    <button disabled={!hasNext} onClick={() => navigate(`/anime/${id}/episode/${epNum + 1}`)}
                        className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        Episodio {epNum + 1}
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Dónde Ver Este Episodio */}
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-5">
                                <span className="material-symbols-outlined text-primary">play_circle</span>
                                Dónde Ver Este Episodio
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                <a
                                    href={`https://www3.animeflv.net/browse?q=${encodeURIComponent(anime?.title?.romaji || anime?.title?.english || title)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 bg-[#1a1a2e] border border-[#e8672a]/40 hover:border-[#e8672a] hover:shadow-md hover:shadow-[#e8672a]/20 p-4 rounded-xl group transition-all sm:col-span-2"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#e8672a]/15 border border-[#e8672a]/30 flex items-center justify-center shrink-0 group-hover:bg-[#e8672a]/25 transition-colors">
                                        <span className="material-symbols-outlined text-[#e8672a]">play_circle</span>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-bold text-white truncate group-hover:text-[#e8672a] transition-colors">AnimeFLV</p>
                                        <p className="text-xs text-gray-400">Ver Episodio {epNum} — gratis en español</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#e8672a] bg-[#e8672a]/10 px-2 py-0.5 rounded-full border border-[#e8672a]/30">GRATIS</span>
                                    <span className="material-symbols-outlined text-[#e8672a]/50 group-hover:text-[#e8672a] transition-colors">arrow_forward</span>
                                </a>
                            </div>

                            {anime?.externalLinks && anime.externalLinks.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {anime.externalLinks.filter(l => l.site).map((link, i) => (
                                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                           className="flex items-center gap-3 bg-gray-50 border border-gray-200 hover:border-primary hover:shadow-md p-4 rounded-xl group transition-all">
                                            <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center group-hover:bg-primary/10 shrink-0 transition-colors">
                                                <span className="material-symbols-outlined text-gray-400 group-hover:text-primary">open_in_new</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-primary transition-colors">{link.site}</p>
                                                <p className="text-xs text-gray-500">Ver Episodio {epNum}</p>
                                            </div>
                                            <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">arrow_forward</span>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">link_off</span>
                                    <p>No hay otros enlaces oficiales registrados para este anime en AniList.</p>
                                </div>
                            )}
                        </section>

                        {/* Comentarios y Discusión */}
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary">forum</span>
                                Discusión del Episodio ({comments.length})
                            </h2>

                            {/* Escribir Comentario */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                                <div className="flex gap-3">
                                    <img src={user?.avatar_url || "https://www.crunchyroll.com/i/beta/avatar/cr_gray.png"} alt="avatar" className="w-9 h-9 rounded-full object-cover shrink-0" />
                                    <div className="flex-1">
                                        <textarea
                                            className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                                            rows="2"
                                            placeholder="Comparte tu opinión sobre este episodio..."
                                            value={newCommentText}
                                            onChange={(e) => setNewCommentText(e.target.value)}
                                        ></textarea>
                                        <div className="flex items-center justify-between mt-2">
                                            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
                                                <input type="checkbox" className="form-checkbox text-primary focus:ring-primary rounded w-3.5 h-3.5"
                                                    checked={isSpoiler} onChange={(e) => setIsSpoiler(e.target.checked)} />
                                                <span className="material-symbols-outlined text-[14px] text-red-400">warning</span>
                                                Contiene Spoiler (Niebla)
                                            </label>
                                            <button onClick={handlePostComment}
                                                className="bg-primary hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-lg text-xs uppercase tracking-wide flex items-center gap-1.5 transition-colors">
                                                <span className="material-symbols-outlined text-[16px]">send</span>
                                                Comentar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de comentarios */}
                            <div className="space-y-5">
                                {comments.length === 0 && (
                                    <div className="text-center py-8 text-gray-400">
                                        <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
                                        <p className="text-sm">Sé el primero en comentar este episodio.</p>
                                    </div>
                                )}
                                {comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3 pb-5 border-b border-gray-100 last:border-0">
                                        <img src={"https://www.crunchyroll.com/i/beta/avatar/cr_gray.png"} alt="avatar" className="w-8 h-8 rounded-full shrink-0" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-gray-900 text-sm">User_{comment.user_id}</span>
                                                <span className="text-xs text-gray-400">{comment.created_at}</span>
                                                {comment.is_spoiler === 1 && (
                                                    <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                                        <span className="material-symbols-outlined text-[10px]">warning</span> Spoiler
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {comment.is_spoiler === 1 ? (
                                                <div className="mt-1 rounded-lg bg-gray-50 border border-gray-200 p-3">
                                                    <SpoilerFog isRevealed={false}>
                                                        <p className="text-gray-700 text-sm">{comment.content}</p>
                                                    </SpoilerFog>
                                                </div>
                                            ) : (
                                                <p className="text-gray-700 text-sm mt-1">{comment.content}</p>
                                            )}
                                            
                                            <div className="flex items-center gap-4 mt-2 text-gray-400 text-xs">
                                                <button onClick={() => handleLike(comment.id)}
                                                    className={`flex items-center gap-1 hover:text-primary transition-colors ${comment.is_liked ? 'text-primary' : ''}`}>
                                                    <span className="material-symbols-outlined text-[14px]">thumb_up</span> {comment.likes_count}
                                                </button>
                                                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-[14px]">reply</span> Responder
                                                </button>
                                                {user && (
                                                    <button onClick={() => handleReport(comment.id)}
                                                        className="flex items-center gap-1 hover:text-red-500 transition-colors ml-auto">
                                                        <span className="material-symbols-outlined text-[14px]">flag</span> Reportar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Episode Info Card */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="aspect-video bg-gray-800 relative overflow-hidden">
                                <img src={coverImage} alt={title} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                                <div className="absolute bottom-3 left-3">
                                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">EP {epNum}</span>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-black text-gray-900 text-sm mb-1">{title}</h3>
                                <p className="text-xs text-gray-500 mb-3">{anime?.genres?.slice(0, 3).join(', ')}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                    {anime?.averageScore && (
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-yellow-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                            <span className="font-bold text-gray-900">{(anime.averageScore / 10).toFixed(1)}</span>
                                        </div>
                                    )}
                                    <span>{totalEps} eps</span>
                                    <span className="capitalize">{anime?.status?.toLowerCase().replace('_', ' ')}</span>
                                </div>
                                <button
                                    onClick={async () => {
                                        const token = localStorage.getItem('token');
                                        if (!token) { toast.error('Inicia sesión para marcar episodios'); return; }
                                        if (isWatched) return;
                                        try {
                                            const res = await axios.post(
                                                `${API}/anime/${id}/episodes/${epNum}/watched`,
                                                {},
                                                { headers: { Authorization: `Bearer ${token}` } }
                                            );
                                            setIsWatched(true);
                                            if (res.data.points_earned > 0) {
                                                toast.success(`+${res.data.points_earned} XP — Episodio ${epNum} visto`);
                                            } else {
                                                toast.success(`Episodio ${epNum} marcado como visto`);
                                            }
                                        } catch {
                                            toast.error('Error al marcar como visto');
                                        }
                                    }}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all ${
                                        isWatched
                                            ? 'bg-green-100 text-green-700 border border-green-200 cursor-default'
                                            : 'bg-primary hover:bg-orange-600 text-white shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: isWatched ? "'FILL' 1" : "'FILL' 0" }}>
                                        check_circle
                                    </span>
                                    {isWatched ? 'Ya visto' : 'Marcar como visto'}
                                </button>
                            </div>
                        </div>

                        {/* Quick Episode List */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="font-black text-gray-900 text-sm mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg">list</span>
                                Episodios cercanos
                            </h3>
                            <div className="space-y-1 max-h-72 overflow-y-auto">
                                {Array.from({ length: Math.min(totalEps, 20) }).map((_, i) => {
                                    const ep = Math.max(1, epNum - 5) + i;
                                    if (ep > totalEps) return null;
                                    return (
                                        <button key={ep} onClick={() => navigate(`/anime/${id}/episode/${ep}`)}
                                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm transition-colors ${
                                                ep === epNum ? 'bg-primary/10 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'
                                            }`}>
                                            <span className={`text-xs font-bold w-6 text-center ${ep === epNum ? 'text-primary' : 'text-gray-400'}`}>{ep}</span>
                                            <span className="flex-1 truncate">Episodio {ep}</span>
                                            {ep === epNum && <span className="material-symbols-outlined text-primary text-[16px]">play_arrow</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EpisodePlayer;
import { API } from '../utils/api.js';