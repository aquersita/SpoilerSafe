import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCatalog } from '../services/animeService';
import { askAgeGate } from '../utils/ageGate';

const Catalog = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams = new URLSearchParams(location.search);
    const initialSort = searchParams.get('sort') || 'TRENDING_DESC';
    const initialSearch = searchParams.get('search') || '';

    const [animes, setAnimes] = useState([]);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState(initialSort);
    const [searchInput, setSearchInput] = useState(initialSearch);
    const [query, setQuery] = useState(initialSearch);

    const [hasNextPage, setHasNextPage] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const sortOptions = [
        { value: 'TRENDING_DESC', label: 'Tendencias (Popularidad)' },
        { value: 'SCORE_DESC', label: 'Mejor Valorados' },
        { value: 'SCORE', label: 'Peor Valorados' },
        { value: 'START_DATE_DESC', label: 'Novedades (Más recientes)' },
        { value: 'START_DATE', label: 'Clásicos (Más antiguos)' },
        { value: 'EPISODES_DESC', label: 'Más Episodios (Larga duración)' },
        { value: 'EPISODES', label: 'Menos Episodios (Corta duración)' },
        { value: 'DURATION_DESC', label: 'Mayor Duración (Películas/Especiales)' },
        { value: 'DURATION', label: 'Menor Duración (Cortos)' },
        { value: 'TITLE_ROMAJI', label: 'Abecedario (A-Z)' },
        { value: 'TITLE_ROMAJI_DESC', label: 'Abecedario (Z-A)' },
    ];

    const fetchCatalog = async (pageNum, currentSort, currentQuery, append = false) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const res = await getCatalog(pageNum, currentSort, currentQuery);
            const data = res.data?.Page;

            if (data) {
                if (append) {
                    setAnimes(prev => [...prev, ...data.media]);
                } else {
                    setAnimes(data.media);
                }
                setHasNextPage(data.pageInfo.hasNextPage);
            }
        } catch (error) {
            console.error("Error fetching catalog:", error);
            if (!append) setAnimes([]);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(searchInput);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Sync from URL when navbar (or external nav) updates ?search=
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlSearch = params.get('search') || '';
        setSearchInput(urlSearch);
        setQuery(urlSearch);
    }, [location.search]);

    useEffect(() => {
        setPage(1);
        fetchCatalog(1, sort, query, false);
        const params = new URLSearchParams();
        params.set('sort', sort);
        if (query) params.set('search', query);
        window.history.replaceState(null, '', `/catalog?${params.toString()}`);
    }, [sort, query]);

    const handleLoadMore = () => {
        if (!hasNextPage || loadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchCatalog(nextPage, sort, query, true);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <div className="w-full bg-white dark:bg-gray-950 font-display">
            {/* Header del Catálogo */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 pt-24 pb-8 shadow-sm">
                <div className="max-w-[1440px] mx-auto px-4 md:px-10">
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-4xl">explore</span>
                        Catálogo Completo
                    </h1>

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-1">
                                <span className="material-symbols-outlined text-[18px]">sort</span>
                                Ordenar Por:
                            </label>
                            <select
                                value={sort}
                                onChange={(e) => setSort(e.target.value)}
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block p-2 shadow-sm font-medium w-full md:w-64 cursor-pointer outline-none transition-shadow"
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <span className="material-symbols-outlined text-gray-400">search</span>
                            </div>
                            <input
                                type="text"
                                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block w-full pl-10 p-2 shadow-sm outline-none transition-all placeholder:text-gray-400"
                                placeholder="Filtrar catálogo por título..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </form>
                    </div>
                </div>
            </div>

            {/* Grid de Contenido */}
            <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12">

                {loading && page === 1 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <span className="material-symbols-outlined animate-spin text-primary text-5xl mb-4">refresh</span>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider text-sm">Cargando Catálogo...</p>
                    </div>
                ) : animes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
                         <span className="material-symbols-outlined text-gray-300 text-6xl mb-4">search_off</span>
                         <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">No se encontraron animes</h3>
                         <p className="text-gray-400">Prueba con otros filtros o términos de búsqueda.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {animes.map(anime => (
                                <div
                                    key={anime.id}
                                    onClick={() => anime.isAdult
                                        ? askAgeGate(() => navigate(`/anime/${anime.id}`))
                                        : navigate(`/anime/${anime.id}`)
                                    }
                                    className="group relative flex flex-col gap-2 cursor-pointer"
                                >
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-100 dark:border-gray-800 shadow-sm">
                                        <div
                                            className={`w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105 ${anime.isAdult ? 'blur-sm scale-110' : ''}`}
                                            style={{ backgroundImage: `url('${anime.coverImage?.extraLarge || anime.coverImage?.large}')` }}
                                        />

                                        {anime.isAdult && (
                                            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2 z-20">
                                                <span className="material-symbols-outlined text-white text-5xl">18_up_rating</span>
                                                <span className="text-white text-[11px] font-black uppercase tracking-wider">Contenido +18</span>
                                                <span className="text-white/60 text-[10px]">Clic para verificar edad</span>
                                            </div>
                                        )}

                                        {anime.averageScore && !anime.isAdult && (
                                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-yellow-400 text-[11px] font-black px-2 py-1 rounded-sm flex items-center gap-1 border border-white/10 shadow-lg z-10">
                                                <span className="material-symbols-outlined text-[12px] fill-current text-yellow-400">star</span>
                                                {(anime.averageScore / 10).toFixed(1)}
                                            </div>
                                        )}

                                        {!anime.isAdult && (
                                            <>
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300 z-0" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                                    <div className="bg-primary text-white rounded-full p-3 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                        <span className="material-symbols-outlined text-2xl">play_arrow</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors text-sm line-clamp-2 leading-tight">
                                            {anime.title.romaji || anime.title.english}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize flex items-center gap-1">
                                            {anime.format || 'TV'} {anime.seasonYear ? `• ${anime.seasonYear}` : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasNextPage && (
                            <div className="mt-16 flex justify-center">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                    className="bg-primary hover:bg-orange-600 text-white font-bold py-3 px-12 rounded-full shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                                >
                                    {loadingMore ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                                            Cargando...
                                        </>
                                    ) : (
                                        'Cargar Más Animes'
                                    )}
                                </button>
                            </div>
                        )}
                        {!hasNextPage && !loading && animes.length > 0 && (
                            <div className="mt-16 text-center text-gray-400 text-sm font-bold uppercase tracking-wider">
                                Has llegado al final del catálogo
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-8 mt-auto">
                <div className="max-w-[1440px] mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-2xl">live_tv</span>
                        <span className="font-bold text-gray-900 dark:text-white">SpoilerSafe</span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        © 2026 SpoilerSafe Inc. Datos proporcionados por AniList.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Catalog;
