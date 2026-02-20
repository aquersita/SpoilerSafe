import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ onLoginClick, onLogoClick, user }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Mobile States
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const handleSearch = async (e) => {
        if (e.key === 'Enter') {
            if (query.length < 3) return;
            try {
                const res = await axios.get(`http://localhost:8000/anime/search?query=${query}`);
                setResults(res.data.data.Page.media);
                setShowResults(true);
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleMobileLinkClick = (path) => {
        setIsMenuOpen(false);
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-border-light transition-colors duration-300 shadow-sm">
            <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <div onClick={onLogoClick} className="flex items-center group cursor-pointer" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        <span className="text-primary font-black text-3xl tracking-tighter drop-shadow-sm">SPOILER</span>
                        <span className="font-black text-3xl tracking-tighter text-gray-800 group-hover:text-primary transition-colors drop-shadow-sm">SAFE</span>
                    </div>
                    <div className="hidden lg:flex items-center space-x-6 text-sm font-bold text-text-secondary">
                        <div className="relative group cursor-pointer h-16 flex items-center">
                            <span className="group-hover:text-primary transition-colors flex items-center gap-1">
                                Explorar <span className="material-icons-outlined text-sm">expand_more</span>
                            </span>
                        </div>
                        <button onClick={() => alert("Manga")} className="hover:text-primary transition-colors">Manga</button>
                        <button onClick={() => alert("Juegos")} className="hover:text-primary transition-colors">Juegos</button>
                        <button onClick={() => alert("Noticias")} className="hover:text-primary transition-colors">Noticias</button>
                        <button onClick={() => alert("Tienda")} className="hover:text-primary transition-colors">Tienda</button>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className={`${isMobileSearchOpen ? 'flex absolute top-16 left-0 w-full p-4 bg-white border-b border-gray-100 z-50' : 'hidden md:flex'} items-center relative`}>
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                                <span className="material-icons-outlined text-gray-400 text-lg">search</span>
                            </div>
                            <input
                                className="bg-gray-50 border border-gray-200 text-sm py-2 pl-10 pr-4 w-full focus:ring-1 focus:ring-primary focus:border-primary text-gray-800 placeholder-gray-500 rounded-sm"
                                placeholder="Buscar anime..."
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                        </div>
                        {showResults && (
                            <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-sm mt-1 shadow-xl overflow-hidden z-50">
                                {results.length === 0 ? (
                                    <div className="p-3 text-xs text-gray-400">No se encontraron resultados</div>
                                ) : (
                                    results.map(anime => (
                                        <div
                                            key={anime.id}
                                            className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                                            onClick={() => {
                                                navigate(`/anime/${anime.id}`);
                                                setShowResults(false);
                                                setQuery('');
                                            }}
                                        >
                                            <span className="text-sm text-gray-800 truncate">{anime.title.romaji}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                    <button onClick={() => alert("Prueba Premium")} className="hidden sm:flex items-center gap-2 bg-primary text-white border border-primary px-4 py-1.5 text-xs font-bold tracking-wider hover:bg-orange-600 active:bg-orange-700 transition-all uppercase rounded-sm">
                        <span className="material-icons text-sm">star</span>
                        <span className="hidden lg:inline">Prueba Premium</span>
                    </button>
                    <div className="flex items-center gap-3 border-l border-gray-200 pl-4 ml-2">
                        <button className="md:hidden text-gray-500 hover:text-primary" onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}>
                            <span className="material-icons-outlined">search</span>
                        </button>
                        <button className="text-gray-500 hover:text-primary">
                            <span className="material-icons-outlined">notifications</span>
                        </button>
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => user ? navigate(`/users/${user.username}`) : onLoginClick()}>
                            <div className="relative">
                                <img
                                    alt="User Avatar"
                                    className="w-8 h-8 rounded-full border border-gray-200"
                                    src={user ? "https://www.crunchyroll.com/i/beta/avatar/cr_gray.png" : "https://lh3.googleusercontent.com/aida-public/AB6AXuAV10sjbjmfSOU6llH8dCmzWZwLhLtLS_7Q1px5LDum7KwMOZipPVTG4BNQy4R4z9xZ5sLNa8VgUcYs3jZ6bSrnupe0okqIkRK2q5oBOlh41J0LIQFGOA4zqEKYDMOLmQidVz4WcfuCQiiczyu6bg3ONBEGV3E8SYq-LoZXL0EOwcslC1Ei3JN6wo3B28poPuMn7vECPDiOwVmgai5DXT5d7rOtVB-QlJXFj2KfooHAGrbs9Tm0pmgApYLqZp_lSijcjuWxqBAMFEj3"}
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
