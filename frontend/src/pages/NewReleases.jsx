
import { askAgeGate } from '../utils/ageGate';
const SEASONS_ES = { WINTER: 'Invierno', SPRING: 'Primavera', SUMMER: 'Verano', FALL: 'Otoño' };

const NewReleases = () => {
    const navigate = useNavigate();
    const [anime, setAnime] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasNext, setHasNext] = useState(true);

    const now = new Date();
    const month = now.getMonth() + 1;
    const seasonKey = month <= 3 ? 'WINTER' : month <= 6 ? 'SPRING' : month <= 9 ? 'SUMMER' : 'FALL';

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetch = async () => {
            try {
                const res = await axios.get(`${API}/anime/new-releases?page=1`);
                const media = res.data?.data?.Page?.media || [];
                setAnime(media);
                setHasNext(res.data?.data?.Page?.pageInfo?.hasNextPage || false);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            const next = page + 1;
            const res = await axios.get(`${API}/anime/new-releases?page=${next}`);
            const media = res.data?.data?.Page?.media || [];
            setAnime(prev => [...prev, ...media]);
            setHasNext(res.data?.data?.Page?.pageInfo?.hasNextPage || false);
            setPage(next);
        } catch (err) { console.error(err); }
        finally { setLoadingMore(false); }
    };

    if (loading) return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white pb-16">
            <div className="bg-gradient-to-r from-primary to-orange-600 py-12 md:py-16 mb-8">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="material-symbols-outlined text-white/80 text-3xl">new_releases</span>
                        <span className="text-white/70 font-bold text-sm uppercase tracking-widest">Temporada {SEASONS_ES[seasonKey]} {now.getFullYear()}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        Nuevos Estrenos
                    </h1>
                    <p className="text-white/80 mt-2 text-lg max-w-2xl">
                        Los animes más recientes de la temporada actual, actualizados automáticamente desde AniList.
                    </p>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                    {anime.map(a => {
                        const title = a.title.romaji || a.title.english;
                        const score = a.averageScore ? (a.averageScore / 10).toFixed(1) : null;
                        const statusLabel = a.status === 'RELEASING' ? 'En Emisión' : a.status === 'NOT_YET_RELEASED' ? 'Próximamente' : 'Finalizado';
                        const statusColor = a.status === 'RELEASING' ? 'bg-green-500' : a.status === 'NOT_YET_RELEASED' ? 'bg-blue-500' : 'bg-gray-500';

                        return (
                            <div
                                key={a.id}
                                onClick={() => a.isAdult
                                    ? askAgeGate(() => navigate(`/anime/${a.id}`))
                                    : navigate(`/anime/${a.id}`)
                                }
                                className="cursor-pointer group flex flex-col"
                            >
                                <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-sm bg-gray-100">
                                    <img
                                        src={a.coverImage.large} alt={title}
                                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${a.isAdult ? 'blur-sm scale-110' : ''}`}
                                    />
                                    {a.isAdult ? (
                                        <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2 z-10">
                                            <span className="material-symbols-outlined text-white text-5xl">18_up_rating</span>
                                            <span className="text-white text-[11px] font-black uppercase tracking-wider">Contenido +18</span>
                                            <span className="text-white/60 text-[10px]">Clic para verificar edad</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className={`absolute top-2 left-2 ${statusColor} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow`}>
                                                {statusLabel}
                                            </div>
                                            {score && (
                                                <div className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                                    {score}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 mt-2 text-sm truncate group-hover:text-primary transition-colors">{title}</h3>
                                <p className="text-xs text-gray-500 truncate">{a.genres?.slice(0, 2).join(', ') || 'Anime'}</p>
                            </div>
                        );
                    })}
                </div>

                {hasNext && (
                    <div className="mt-12 flex justify-center pb-8">
                        <button onClick={handleLoadMore} disabled={loadingMore}
                            className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all flex items-center gap-2 disabled:opacity-70">
                            {loadingMore ? (
                                <><span className="material-symbols-outlined animate-spin text-[20px]">autorenew</span> Cargando...</>
                            ) : (
                                <><span className="material-symbols-outlined text-[20px]">expand_more</span> Cargar más estrenos</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewReleases;
import { API } from '../utils/api.js';