import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const AnimeDetails = ({ user }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [anime, setAnime] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trending, setTrending] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.documentElement.classList.remove('dark');

        const fetchAnime = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`http://localhost:8000/anime/${id}`);
                setAnime(res.data.data.Media);
                const trendRes = await axios.get('http://localhost:8000/anime/trending');
                setTrending(trendRes.data.data.Page.media.slice(0, 5));
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

    if (loading) {
        return <div className="min-h-screen bg-white flex items-center justify-center">Cargando detalles...</div>;
    }

    if (!anime) {
        return <div className="min-h-screen bg-white flex items-center justify-center">Anime no encontrado</div>;
    }

    const title = anime.title.romaji || anime.title.english;
    const bannerImage = anime.bannerImage || anime.coverImage.extraLarge;
    const coverImage = anime.coverImage.extraLarge || anime.coverImage.large;

    return (
        <React.Fragment>
            <section className="relative w-full h-[85vh] overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gray-900">
                    <img alt={title} className="w-full h-full object-cover object-top opacity-80 mix-blend-overlay" src={bannerImage} />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent z-10 w-full md:w-2/3"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10 h-1/2 bottom-0 top-auto"></div>
                </div>
                <div className="relative z-20 h-full max-w-[1600px] mx-auto px-8 flex flex-col justify-center">
                    <div className="w-full lg:w-3/4 space-y-6 mt-12 pl-4 md:pl-0">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tighter drop-shadow-lg" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                            {title.toUpperCase()}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                            <span className="bg-primary text-white px-2 py-0.5 rounded text-xs">{anime.status || 'FINALIZADO'}</span>
                            <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                            {anime.genres?.slice(0, 3).map((g, i) => (
                                <span key={i} className="text-gray-300">{g}</span>
                            ))}
                            <span className="bg-white/10 text-white px-2 py-0.5 text-xs rounded border border-white/20">Sub | Dob</span>
                        </div>
                        <p className="text-gray-300 text-base md:text-lg leading-relaxed max-w-3xl font-medium line-clamp-4" dangerouslySetInnerHTML={{ __html: anime.description || 'Sin descripción disponible.' }}></p>

                        <div className="flex items-center gap-4 pt-4">
                            <button onClick={() => navigate(`/anime/${id}/episode/1`)} className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-8 rounded-sm transition-all focus:outline-none flex items-center gap-2 uppercase tracking-wide shadow-lg">
                                <span className="material-icons">play_arrow</span>
                                Ver T1 E1
                            </button>
                            {anime.trailer?.id && (
                                <button onClick={() => window.open(`https://youtube.com/watch?v=${anime.trailer.id}`, '_blank')} className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-8 rounded-sm transition-all focus:outline-none flex items-center gap-2 uppercase tracking-wide shadow-lg">
                                    <span className="material-icons-outlined">movie</span>
                                    Trailer
                                </button>
                            )}
                            <button onClick={() => alert("Añadido a favoritos")} className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-4 rounded-sm transition-all focus:outline-none flex items-center justify-center shadow-lg">
                                <span className="material-icons-outlined text-xl">bookmark_border</span>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Episodios Section */}
            <section className="py-12 bg-white border-t border-gray-100 min-h-[400px]">
                <div className="max-w-[1600px] mx-auto px-8">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2 mb-8">
                        <span className="w-1 h-6 bg-primary block rounded-full"></span>
                        Episodios
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: anime.episodes || 12 }).map((_, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/anime/${id}/episode/${i + 1}`)}
                                className="group cursor-pointer bg-white rounded-md overflow-hidden border border-gray-200 hover:shadow-xl hover:border-primary transition-all flex flex-col"
                            >
                                <div className="relative aspect-video bg-gray-200 overflow-hidden">
                                    <img src={bannerImage || coverImage} alt={`Episode ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">24:00</div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-primary text-white rounded-full p-2 shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                                            <span className="material-icons">play_arrow</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-primary transition-colors">Episodio {i + 1}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2">Emitido recientemente. Acompaña al protagonista en esta nueva aventura llena de acción y secretos.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </React.Fragment>
    );
};

export default AnimeDetails;
