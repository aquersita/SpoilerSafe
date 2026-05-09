import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrendingManga, searchManga } from '../services/mangaService';
import { askAgeGate } from '../utils/ageGate';

const Manga = () => {
    const navigate = useNavigate();
    const [trending, setTrending] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchInitial = async () => {
            setLoading(true);
            try {
                const [trendRes, catRes] = await Promise.all([
                    getTrendingManga(),
                    searchManga('')
                ]);
                setTrending(trendRes.data?.Page?.media || []);
                setCatalog(catRes.data?.Page?.media || []);
            } catch (err) {
                console.error("Error fetching manga:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
    }, []);

    useEffect(() => {
        if (loading) return;
        const fetchSearch = async () => {
            setSearching(true);
            try {
                const res = searchQuery
                    ? await searchManga(searchQuery)
                    : await getTrendingManga();
                setCatalog(res.data?.Page?.media || []);
            } catch (err) {
                console.error("Error searching manga:", err);
            } finally {
                setSearching(false);
            }
        };
        fetchSearch();
    }, [searchQuery]);

    const handleLoadMore = async () => {
        setLoadingMore(true);
        try {
            const res = await getTrendingManga();
            setCatalog(prev => [...prev, ...(res.data?.Page?.media || [])]);
        } catch (err) {
            console.error("Error loading more manga:", err);
        } finally {
            setLoadingMore(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background-light flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background-light pb-12">
            {/* Hero Section */}
            <div className="relative w-full h-[40vh] bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10"></div>
                {trending[0] && (
                    <img
                        src={trending[0].coverImage.large}
                        alt="Hero"
                        className="absolute right-0 top-0 w-1/2 h-full object-cover opacity-50 blur-sm"
                    />
                )}
                <div className="relative z-20 max-w-[1600px] mx-auto px-4 md:px-8 h-full flex flex-col justify-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        MANGA ZONE
                    </h1>
                    <p className="text-gray-300 max-w-xl text-lg mb-6">
                        Explora los mangas más populares, descubre nuevas historias y sigue el rastro de tus series favoritas antes de que lleguen al anime.
                    </p>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-12">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary block rounded-full"></span>
                    Mangas en Tendencia
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6 mb-12">
                    {trending.slice(0, 6).map(manga => (
                        <div
                            key={`trend-${manga.id}`}
                            onClick={() => manga.isAdult
                                ? askAgeGate(() => navigate(`/manga/${manga.id}`))
                                : navigate(`/manga/${manga.id}`)
                            }
                            className="cursor-pointer group flex flex-col gap-2"
                        >
                            <div className="relative aspect-[2/3] overflow-hidden rounded-md shadow-sm">
                                <img
                                    src={manga.coverImage.large}
                                    alt={manga.title.romaji}
                                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${manga.isAdult ? 'blur-sm scale-110' : ''}`}
                                />
                                {manga.isAdult ? (
                                    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2 z-10">
                                        <span className="material-symbols-outlined text-white text-5xl">18_up_rating</span>
                                        <span className="text-white text-[11px] font-black uppercase tracking-wider">Contenido +18</span>
                                        <span className="text-white/60 text-[10px]">Clic para verificar edad</span>
                                    </div>
                                ) : (
                                    <div className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded shadow">
                                        MANGA
                                    </div>
                                )}
                            </div>
                            <h3 className="font-bold text-sm text-gray-800 line-clamp-2 group-hover:text-primary transition-colors">
                                {manga.isAdult ? '■■■■■■■■' : manga.title.romaji}
                            </h3>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary block rounded-full"></span>
                        Catálogo Completo
                    </h2>
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Buscar manga..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full bg-white border border-gray-300 text-gray-800 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:border-primary shadow-sm"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {searching ? (
                                <span className="material-symbols-outlined animate-spin text-primary text-[20px]">autorenew</span>
                            ) : (
                                <span className="material-symbols-outlined">search</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 md:gap-6 transition-opacity duration-200 ${searching ? 'opacity-40' : ''}`}>
                    {catalog.map(manga => (
                        <div
                            key={`cat-${manga.id}`}
                            onClick={() => manga.isAdult
                                ? askAgeGate(() => navigate(`/manga/${manga.id}`))
                                : navigate(`/manga/${manga.id}`)
                            }
                            className="cursor-pointer group flex flex-col gap-2"
                        >
                            <div className="relative aspect-[2/3] overflow-hidden rounded-md shadow-sm">
                                <img
                                    src={manga.coverImage.large}
                                    alt={manga.title.romaji}
                                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${manga.isAdult ? 'blur-sm scale-110' : ''}`}
                                />
                                {manga.isAdult ? (
                                    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2 z-10">
                                        <span className="material-symbols-outlined text-white text-5xl">18_up_rating</span>
                                        <span className="text-white text-[11px] font-black uppercase tracking-wider">Contenido +18</span>
                                        <span className="text-white/60 text-[10px]">Clic para verificar edad</span>
                                    </div>
                                ) : (
                                    manga.averageScore && (
                                        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px] text-yellow-400">star</span>
                                            {manga.averageScore}%
                                        </div>
                                    )
                                )}
                            </div>
                            <h3 className="font-bold text-sm text-gray-800 line-clamp-2 group-hover:text-primary transition-colors">
                                {manga.isAdult ? '■■■■■■■■' : manga.title.romaji}
                            </h3>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex justify-center pb-12">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-8 rounded-full shadow-md transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {loadingMore ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[20px]">autorenew</span>
                                Cargando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                                Cargar más mangas
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Manga;
