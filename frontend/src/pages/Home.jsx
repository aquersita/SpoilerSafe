import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = ({ popularAnime, isBackendUp, backendStatus }) => {
    const navigate = useNavigate();
    const destacadosRef = useRef(null);

    const handleScroll = (direction) => {
        if (destacadosRef.current) {
            const scrollAmount = 350;
            if (direction === 'left') {
                destacadosRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                destacadosRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <React.Fragment>
            <section className="relative w-full h-[85vh] overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img alt="Demon Slayer Background" className="w-full h-full object-cover object-top" src="https://image.tmdb.org/t/p/original/b9PEZeiSu1Ux2oweuoaeHmpaFIC.jpg" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent z-10"></div>
                </div>
                <div className="relative z-20 h-full max-w-[1600px] mx-auto px-8 flex flex-col justify-center">
                    <div className="w-full lg:w-1/2 space-y-6 mt-12 pl-4 md:pl-0 pb-16 md:pb-24">
                        <h1 className="text-6xl md:text-8xl text-gray-900 leading-tight tracking-tighter drop-shadow-sm font-demonslayer uppercase" style={{ WebkitTextStroke: "1px #111" }}>
                            DEMON<br /><span className="text-primary">SLAYER</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                            <span className="bg-primary text-white px-2 py-0.5 rounded text-xs">Nuevos Episodios</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            <span className="text-gray-600">Shonen</span>
                            <span className="text-gray-600">Acción</span>
                            <span className="bg-gray-200 text-gray-700 px-2 py-0.5 text-xs rounded border border-gray-300">Sub | Dob</span>
                        </div>
                        <p className="text-gray-700 text-base md:text-lg leading-relaxed max-w-2xl font-medium line-clamp-3">
                            Tanjiro Kamado vive una vida modesta pero feliz en las montañas con su familia. Un día, cuando regresa de vender carbón en el pueblo, encuentra los restos de su familia masacrada tras el ataque de un demonio...
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            <button onClick={() => navigate('/anime/101922')} className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-8 rounded-sm transition-transform hover:scale-105 flex items-center gap-2 uppercase tracking-wide shadow-lg shadow-orange-200">
                                <span className="material-icons">play_arrow</span>
                                Ver T4 E1
                            </button>
                            <button onClick={() => alert("Añadido")} className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-8 rounded-sm transition-all flex items-center gap-2 uppercase tracking-wide">
                                <span className="material-icons-outlined">bookmark_border</span>
                                Añadir
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-8 bg-white relative z-20 -mt-20 lg:-mt-32">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary block rounded-full"></span>
                            Novedades de la Temporada
                        </h2>
                        <a className="text-sm font-bold text-primary hover:underline" href="#">Ver todo</a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div onClick={() => navigate('/anime/140221')} className="group cursor-pointer">
                            <div className="relative overflow-hidden rounded-md shadow-md aspect-[2/3]">
                                <img alt="Spy x Family" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src="https://media.kitsu.app/anime/45398/poster_image/large-c26c1e0b77e881fcd66475af6bd22c57.jpeg" />
                                <div className="absolute top-2 left-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">PREMIUM</div>
                            </div>
                            <h3 className="font-bold text-gray-800 mt-2 truncate transition-colors">Spy x Family</h3>
                            <p className="text-xs text-gray-500">Comedia, Acción</p>
                        </div>
                        <div onClick={() => navigate('/anime/153288')} className="group cursor-pointer">
                            <div className="relative overflow-hidden rounded-md shadow-md aspect-[2/3]">
                                <img alt="Kaiju No. 8" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src="https://media.kitsu.app/anime/46300/poster_image/large-31cc66fd5854cc555d496ced7ab40c31.jpeg" />
                            </div>
                            <h3 className="font-bold text-gray-800 mt-2 truncate transition-colors">Kaiju No. 8</h3>
                            <p className="text-xs text-gray-500">Ciencia Ficción, Acción</p>
                        </div>
                        <div onClick={() => navigate('/anime/152052')} className="group cursor-pointer">
                            <div className="relative overflow-hidden rounded-md shadow-md aspect-[2/3]">
                                <img alt="Mashle" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src="https://media.kitsu.app/anime/46229/poster_image/large-0089799807bf6cc3579a183b8338d789.jpeg" />
                                <div className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">DUB</div>
                            </div>
                            <h3 className="font-bold text-gray-800 mt-2 truncate transition-colors">Mashle: Magic and Muscles</h3>
                            <p className="text-xs text-gray-500">Fantasía, Comedia</p>
                        </div>
                        <div onClick={() => navigate('/anime/151807')} className="group cursor-pointer">
                            <div className="relative overflow-hidden rounded-md shadow-md aspect-[2/3]">
                                <img alt="Solo Leveling" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src="https://media.kitsu.app/anime/46231/poster_image/large-cdadff31f42490b9f48a035939a01a92.jpeg" />
                            </div>
                            <h3 className="font-bold text-gray-800 mt-2 truncate transition-colors">Solo Leveling</h3>
                            <p className="text-xs text-gray-500">Acción, Aventura</p>
                        </div>
                        <div onClick={() => navigate('/anime/153518')} className="group cursor-pointer hidden lg:block">
                            <div className="relative overflow-hidden rounded-md shadow-md aspect-[2/3]">
                                <img alt="Dungeon Meshi" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src="https://media.kitsu.app/anime/46320/poster_image/large-9d404bdee1ca826c60e32864e0502999.jpeg" />
                            </div>
                            <h3 className="font-bold text-gray-800 mt-2 truncate transition-colors">Dungeon Meshi</h3>
                            <p className="text-xs text-gray-500">Fantasía, Cocina</p>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-8 bg-gray-50 border-t border-gray-100">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary block rounded-full"></span>
                            Destacados para ti
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => handleScroll('left')} className="p-1 text-white bg-primary hover:bg-orange-600 active:bg-orange-700 rounded-full transition-colors disabled:opacity-50">
                                <span className="material-icons">chevron_left</span>
                            </button>
                            <button onClick={() => handleScroll('right')} className="p-1 text-white bg-primary hover:bg-orange-600 active:bg-orange-700 rounded-full transition-colors">
                                <span className="material-icons">chevron_right</span>
                            </button>
                        </div>
                    </div>
                    <div ref={destacadosRef} className="flex overflow-x-auto gap-4 hide-scrollbar pb-4 scroll-smooth">
                        <div onClick={() => navigate('/anime/101922')} className="min-w-[280px] md:min-w-[320px] relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                            <div className="aspect-video overflow-hidden rounded-md shadow-md relative">
                                <img alt="Demon Slayer" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" src="https://media.kitsu.app/anime/41370/cover_image/large-3de3cc6d2b33162c928de10aa201e4ba.jpeg" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg drop-shadow-md">Demon Slayer</h3>
                                    <div className="flex items-center mt-2 text-primary text-sm font-bold">
                                        <span className="material-icons text-base mr-1">play_circle</span> VER AHORA
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 group-hover:hidden">
                                <h3 className="font-bold text-gray-800 truncate">Demon Slayer</h3>
                                <p className="text-xs text-gray-500">Acción, Sobrenatural</p>
                            </div>
                        </div>
                        <div onClick={() => navigate('/anime/21')} className="min-w-[280px] md:min-w-[320px] relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                            <div className="aspect-video overflow-hidden rounded-md shadow-md relative">
                                <img alt="One Piece" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" src="https://media.kitsu.app/anime/12/cover_image/large-3e72f400a87b5241780c5082f0582611.jpeg" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg drop-shadow-md">One Piece</h3>
                                    <div className="flex items-center mt-2 text-primary text-sm font-bold">
                                        <span className="material-icons text-base mr-1">play_circle</span> VER AHORA
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 group-hover:hidden">
                                <h3 className="font-bold text-gray-800 truncate">One Piece</h3>
                                <p className="text-xs text-gray-500">Aventura, Piratas</p>
                            </div>
                        </div>
                        <div onClick={() => navigate('/anime/21459')} className="min-w-[280px] md:min-w-[320px] relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                            <div className="aspect-video overflow-hidden rounded-md shadow-md relative">
                                <img alt="My Hero Academia" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" src="https://media.kitsu.app/anime/cover_images/11469/large.jpg" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg drop-shadow-md">My Hero Academia</h3>
                                    <div className="flex items-center mt-2 text-primary text-sm font-bold">
                                        <span className="material-icons text-base mr-1">play_circle</span> VER AHORA
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 group-hover:hidden">
                                <h3 className="font-bold text-gray-800 truncate">My Hero Academia</h3>
                                <p className="text-xs text-gray-500">Superhéroes, Escolar</p>
                            </div>
                        </div>
                        <div onClick={() => navigate('/anime/113415')} className="min-w-[280px] md:min-w-[320px] relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                            <div className="aspect-video overflow-hidden rounded-md shadow-md relative">
                                <img alt="Jujutsu Kaisen" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" src="https://media.kitsu.app/anime/cover_images/42765/large.jpg" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg drop-shadow-md">Jujutsu Kaisen</h3>
                                    <div className="flex items-center mt-2 text-primary text-sm font-bold">
                                        <span className="material-icons text-base mr-1">play_circle</span> VER AHORA
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 group-hover:hidden">
                                <h3 className="font-bold text-gray-800 truncate">Jujutsu Kaisen</h3>
                                <p className="text-xs text-gray-500">Acción, Sobrenatural</p>
                            </div>
                        </div>
                        <div onClick={() => navigate('/anime/16498')} className="min-w-[280px] md:min-w-[320px] relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                            <div className="aspect-video overflow-hidden rounded-md shadow-md relative">
                                <img alt="Attack on Titan" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" src="https://media.kitsu.app/anime/cover_images/7442/large.jpg" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg drop-shadow-md">Attack on Titan</h3>
                                    <div className="flex items-center mt-2 text-primary text-sm font-bold">
                                        <span className="material-icons text-base mr-1">play_circle</span> VER AHORA
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 group-hover:hidden">
                                <h3 className="font-bold text-gray-800 truncate">Attack on Titan</h3>
                                <p className="text-xs text-gray-500">Acción, Drama</p>
                            </div>
                        </div>
                        <div onClick={() => navigate('/anime/11061')} className="min-w-[280px] md:min-w-[320px] relative group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                            <div className="aspect-video overflow-hidden rounded-md shadow-md relative">
                                <img alt="Hunter x Hunter" className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" src="https://media.kitsu.app/anime/cover_images/6448/large.jpg" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                    <h3 className="text-white font-bold text-lg drop-shadow-md">Hunter x Hunter</h3>
                                    <div className="flex items-center mt-2 text-primary text-sm font-bold">
                                        <span className="material-icons text-base mr-1">play_circle</span> VER AHORA
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 group-hover:hidden">
                                <h3 className="font-bold text-gray-800 truncate">Hunter x Hunter</h3>
                                <p className="text-xs text-gray-500">Acción, Aventura</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section className="py-12 bg-white border-t border-gray-100">
                <div className="max-w-[1600px] mx-auto px-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 mb-8">
                        <span className="w-1 h-6 bg-primary block rounded-full"></span>
                        Top 10 Animes más vistos hoy
                    </h2>
                    <div className="relative">
                        <div className="flex overflow-x-auto gap-8 hide-scrollbar pb-8 items-center pl-6">
                            {[
                                { id: '12', title: 'One Piece', img: 'https://media.kitsu.app/anime/poster_images/12/large.jpg' },
                                { id: '42765', title: 'Jujutsu Kaisen', img: 'https://media.kitsu.app/anime/42765/poster_image/large-5ce19551c1a6cf995b378205b9149b5c.jpeg' },
                                { id: '1555', title: 'Naruto Shippuden', img: 'https://media.kitsu.app/anime/poster_images/1555/large.jpg' },
                                { id: '13209', title: 'Black Clover', img: 'https://media.kitsu.app/anime/poster_images/13209/large.jpg' },
                                { id: '244', title: 'Bleach', img: 'https://media.kitsu.app/anime/poster_images/244/large.jpg' },
                                { id: '43806', title: 'Chainsaw Man', img: 'https://media.kitsu.app/anime/43806/poster_image/large-815d6008fb3b56f4291b9f0ffa05cd8f.jpeg' },
                                { id: '8271', title: 'Tokyo Ghoul', img: 'https://media.kitsu.app/anime/poster_images/8271/large.jpg' },
                                { id: '100', title: 'Fullmetal Alchemist', img: 'https://media.kitsu.app/anime/poster_images/100/large.jpg' },
                                { id: '720', title: 'Dragon Ball Z', img: 'https://media.kitsu.app/anime/720/poster_image/large-5cfc7e2756852e708c822df0a9f59871.jpeg' },
                                { id: '1376', title: 'Death Note', img: 'https://media.kitsu.app/anime/poster_images/1376/large.jpg' }
                            ].map((anime, idx) => (
                                <div key={anime.id} onClick={() => navigate(`/anime/${anime.id}`)} className="flex-none relative group cursor-pointer pr-4">
                                    <span className={`absolute ${idx === 9 ? '-left-12' : '-left-8'} -bottom-4 text-[130px] font-black text-white leading-none z-0 drop-shadow-lg pointer-events-none`} style={{ WebkitTextStroke: "4px #888" }}>{idx + 1}</span>
                                    <div className="w-[140px] aspect-[2/3] rounded-md overflow-hidden shadow-lg z-10 relative transform group-hover:scale-105 transition-transform duration-300 bg-gray-200 ml-6">
                                        <img alt={anime.title} className="w-full h-full object-cover" src={anime.img} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
            <footer className="bg-gray-900 border-t border-gray-800 py-12 text-center text-sm text-gray-400">
                <div className="flex justify-center gap-6 mb-4">
                    <a className="hover:text-primary transition-colors text-white" href="#">Términos</a>
                    <a className="hover:text-primary transition-colors text-white" href="#">Privacidad</a>
                    <a className="hover:text-primary transition-colors text-white" href="#">Contacto</a>
                </div>
                <p>© 2024 SpoilerSafe. Anime Streaming Concept.</p>
            </footer>
        </React.Fragment>
    );
};

export default Home;
