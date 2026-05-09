import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API } from '../utils/api.js';

const Navbar = ({ onLoginClick, onLogoClick, user }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [userResults, setUserResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Dark mode
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('spoilersafe_theme') === 'dark';
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('spoilersafe_theme', darkMode ? 'dark' : 'light');
    }, [darkMode]);

    // Mobile States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const [isExploreOpen, setIsExploreOpen] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 3) {
                setResults([]);
                setUserResults([]);
                setShowResults(false);
                return;
            }
            try {
                const [animeRes, usersRes] = await Promise.all([
                    axios.get(`${API}/anime/search?query=${query}`),
                    axios.get(`${API}/users/search?query=${query}`)
                ]);
                setResults(animeRes.data.data.Page.media);
                setUserResults(usersRes.data);
                setShowResults(true);
            } catch (err) {
                console.error(err);
            }
        };

        const timer = setTimeout(fetchResults, 400);
        return () => clearTimeout(timer);
    }, [query]);

    const handleMobileLinkClick = (path) => {
        setIsMenuOpen(false);
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-border-light dark:border-gray-800 transition-colors duration-300 shadow-sm">
            <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <div onClick={onLogoClick} className="flex items-center group cursor-pointer" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        <span className="text-primary font-black text-3xl tracking-tighter drop-shadow-sm">SPOILER</span>
                        <span className="font-black text-3xl tracking-tighter text-gray-800 dark:text-white group-hover:text-primary transition-colors drop-shadow-sm">SAFE</span>
                    </div>
                    <div className="hidden lg:flex items-center space-x-6 text-sm font-bold text-text-secondary dark:text-gray-400">
                        <div 
                            className="relative group cursor-pointer h-16 flex items-center"
                            onMouseEnter={() => setIsExploreOpen(true)}
                            onMouseLeave={() => setIsExploreOpen(false)}
                        >
                            <span className="group-hover:text-primary transition-colors flex items-center gap-1">
                                Explorar <span className="material-icons-outlined text-sm">expand_more</span>
                            </span>
                            {/* Dropdown Menu */}
                            {isExploreOpen && (
                                <div className="absolute top-14 left-0 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-xl py-2 z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-200 origin-top flex flex-col gap-1">
                                    <div 
                                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary cursor-pointer transition-colors flex items-center gap-2 dark:text-gray-300"
                                        onClick={() => navigate('/catalog')}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">explore</span>
                                        Todo el Catálogo
                                    </div>
                                    <div 
                                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary cursor-pointer transition-colors flex items-center gap-2 dark:text-gray-300"
                                        onClick={() => navigate('/catalog?sort=SCORE_DESC')}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">star</span>
                                        Mejor Valorados
                                    </div>
                                    <div 
                                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary cursor-pointer transition-colors flex items-center gap-2 dark:text-gray-300"
                                        onClick={() => navigate('/catalog?sort=START_DATE_DESC')}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">fiber_new</span>
                                        Novedades
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => navigate('/manga')} className="hover:text-primary transition-colors">Manga</button>
                        <button onClick={() => navigate('/games')} className="hover:text-primary transition-colors">Juegos</button>
                        <button onClick={() => navigate('/news')} className="hover:text-primary transition-colors">Noticias</button>
                        <button onClick={() => navigate('/store')} className="hover:text-primary transition-colors">Tienda</button>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className={`${isMobileSearchOpen ? 'flex absolute top-16 left-0 w-full p-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-50' : 'hidden md:flex'} items-center relative`}>
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                                <span className="material-icons-outlined text-gray-400 text-lg">search</span>
                            </div>
                            <input
                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm py-2 pl-10 pr-4 w-full focus:ring-1 focus:ring-primary focus:border-primary text-gray-800 dark:text-white placeholder-gray-500 rounded-sm"
                                placeholder="Buscar anime o usuarios..."
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        {showResults && (
                            <div className="absolute top-full left-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm mt-1 shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
                                {results.length === 0 && userResults.length === 0 ? (
                                    <div className="p-3 text-xs text-gray-400">No se encontraron resultados</div>
                                ) : (
                                    <>
                                        {userResults.length > 0 && (
                                            <>
                                                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
                                                    Usuarios
                                                </div>
                                                {userResults.map(u => (
                                                    <div
                                                        key={u.id}
                                                        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                                        onClick={() => {
                                                            navigate(`/users/${u.username}`);
                                                            setShowResults(false);
                                                            setQuery('');
                                                        }}
                                                    >
                                                        <img
                                                            src={u.avatar_url || "https://www.crunchyroll.com/i/beta/avatar/cr_gray.png"}
                                                            alt={u.username}
                                                            className="w-6 h-6 rounded-full object-cover bg-gray-100 flex-shrink-0"
                                                        />
                                                        <span className="text-sm text-gray-800 dark:text-gray-200 font-medium truncate">{u.username}</span>
                                                        {u.is_premium && (
                                                            <span className="ml-auto text-[10px] font-bold text-yellow-500 flex-shrink-0">PREMIUM</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                        {results.length > 0 && (
                                            <>
                                                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
                                                    Anime
                                                </div>
                                                {results.map(anime => (
                                                    <div
                                                        key={anime.id}
                                                        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                                        onClick={() => {
                                                            navigate(`/anime/${anime.id}`);
                                                            setShowResults(false);
                                                            setQuery('');
                                                        }}
                                                    >
                                                        <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{anime.title.romaji}</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    {user?.is_premium ? (
                        <button onClick={() => navigate('/premium')} className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-slate-900 border-none px-4 py-1.5 text-xs font-black tracking-wider shadow-lg shadow-yellow-500/30 hover:scale-105 transition-all uppercase rounded cursor-pointer">
                            <span className="material-symbols-outlined text-sm font-black">workspace_premium</span>
                            <span className="hidden lg:inline">PREMIUM ACTIVO</span>
                        </button>
                    ) : (
                        <button onClick={() => navigate('/premium')} className="hidden sm:flex items-center gap-2 bg-primary text-white border border-primary px-4 py-1.5 text-xs font-bold tracking-wider hover:bg-orange-600 active:bg-orange-700 transition-all uppercase rounded-sm cursor-pointer">
                            <span className="material-symbols-outlined text-sm">star</span>
                            <span className="hidden lg:inline">Prueba Premium</span>
                        </button>
                    )}
                    <div className="flex items-center gap-3 border-l border-gray-200 pl-4 ml-2">
                        <button className="md:hidden text-gray-500 hover:text-primary" onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}>
                            <span className="material-icons-outlined">search</span>
                        </button>
                        <button onClick={() => setDarkMode(!darkMode)} className="text-gray-500 hover:text-primary transition-colors" title={darkMode ? 'Modo claro' : 'Modo oscuro'}>
                            <span className="material-symbols-outlined">{darkMode ? 'light_mode' : 'dark_mode'}</span>
                        </button>
                        <button onClick={() => toast('No tienes notificaciones nuevas', { icon: '🔔' })} className="text-gray-500 hover:text-primary transition-colors">
                            <span className="material-icons-outlined">notifications</span>
                        </button>
                        {user?.is_admin && (
                            <button onClick={() => navigate('/admin')} className="text-red-500 hover:text-red-600 transition-colors" title="Admin Panel">
                                <span className="material-symbols-outlined">admin_panel_settings</span>
                            </button>
                        )}
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => user ? navigate(`/users/${user.username}`) : onLoginClick()}>
                            <div className="relative">
                                <img
                                    alt="User Avatar"
                                    className="w-8 h-8 rounded-full border border-gray-200 object-cover bg-gray-100"
                                    src={user?.avatar_url || "https://www.crunchyroll.com/i/beta/avatar/cr_gray.png"}
                                />
                                {user && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                            </div>
                        </div>
                    </div>
                    <button
                        className="lg:hidden p-2 text-gray-500 hover:text-primary"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <span className="material-icons">{isMenuOpen ? 'close' : 'menu'}</span>
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
