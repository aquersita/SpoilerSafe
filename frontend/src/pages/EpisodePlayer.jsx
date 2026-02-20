import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const EpisodePlayer = () => {
    const navigate = useNavigate();
    const { id, episodeNumber } = useParams();
    const [anime, setAnime] = useState(null);

    useEffect(() => {
        document.documentElement.classList.add('dark');

        const fetchAnime = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/anime/${id}`);
                setAnime(res.data.data.Media);
            } catch (err) {
                console.error("Error fetching anime:", err);
            }
        };

        if (id) {
            fetchAnime();
        }

        return () => document.documentElement.classList.remove('dark');
    }, [id]);

    const title = anime?.title?.romaji || anime?.title?.english || 'Cargando...';
    const backgroundImage = anime?.coverImage?.extraLarge || anime?.bannerImage || '';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-display">
            {/* Contenedor del reproductor - ya no es fullscreen forzado */}
            <div className="relative w-full h-[50vh] md:h-[75vh] bg-black group/player">
                {/* Video Background Container */}
                <div className="absolute inset-0 z-0 bg-black">
                    {backgroundImage && (
                        <div
                            className="w-full h-full bg-cover bg-center opacity-80 mix-blend-overlay"
                            style={{ backgroundImage: `url('${backgroundImage}')` }}>
                        </div>
                    )}
                    {/* Center Play Indicator (Fading) */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-primary/90 rounded-full p-8 text-white opacity-0 group-hover/player:opacity-100 transition-opacity duration-500 ease-in-out">
                            <span className="material-symbols-outlined !text-6xl">play_arrow</span>
                        </div>
                    </div>
                </div>

                {/* Top Navigation Overlay */}
                <div className="absolute top-0 left-0 w-full z-20 bg-gradient-to-b from-black/90 to-transparent pt-6 pb-20 px-4 md:px-8 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button onClick={() => navigate(-1)} className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white p-2 rounded-lg transition-colors cursor-pointer shadow-lg shadow-orange-500/20">
                                <span className="material-symbols-outlined !text-3xl">arrow_back</span>
                            </button>
                            <div>
                                <h1 className="text-white text-xl md:text-2xl font-bold tracking-tight line-clamp-1">{title}</h1>
                                <p className="text-white/80 text-sm md:text-lg font-medium">Ep {episodeNumber || '01'}: <span className="text-white/60">Reproduciendo</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg p-2 transition-colors shadow-lg shadow-orange-500/20">
                                <span className="material-symbols-outlined">flag</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Controls Overlay */}
                <div className="absolute bottom-0 left-0 w-full z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent pt-24 pb-6 px-4 md:px-8 opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 flex flex-col gap-2">

                    {/* Progress Bar Container */}
                    <div className="relative w-full group/scrubber h-6 flex items-end cursor-pointer mb-2">
                        {/* Thumbnail Preview */}
                        <div className="absolute bottom-8 left-[45%] -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 group-hover/scrubber:opacity-100 transition-opacity duration-200 pointer-events-none hidden md:flex">
                            {backgroundImage && (
                                <div className="w-40 h-24 bg-cover bg-center rounded-lg border-2 border-white/20 shadow-2xl" style={{ backgroundImage: `url('${backgroundImage}')` }}>
                                </div>
                            )}
                            <span className="text-xs font-bold text-white bg-primary px-2 py-1 rounded shadow-lg shadow-orange-500/30">12:45</span>
                        </div>

                        {/* Track */}
                        <div className="w-full h-1.5 bg-white/20 rounded-full relative overflow-visible transition-all duration-200 group-hover/scrubber:h-2">
                            <div className="absolute top-0 left-0 h-full bg-white/30 rounded-full w-[65%]"></div>
                            <div className="absolute top-0 left-0 h-full bg-primary rounded-full w-[52%] relative shadow-[0_0_10px_rgba(255,107,0,0.5)]">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover/scrubber:scale-100 transition-transform duration-200"></div>
                            </div>
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 md:gap-6">
                            <button className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white rounded-full p-2 transition-colors transform active:scale-95 shadow-lg shadow-orange-500/20">
                                <span className="material-symbols-outlined !text-4xl fill-1">play_arrow</span>
                            </button>
                            <div className="hidden md:flex items-center gap-4 text-white/80">
                                <button className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white rounded p-1 transition-colors tooltip" title="-10s">
                                    <span className="material-symbols-outlined !text-[24px]">replay_10</span>
                                </button>
                                <button className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white rounded p-1 transition-colors tooltip" title="+10s">
                                    <span className="material-symbols-outlined !text-[24px]">forward_10</span>
                                </button>
                                <button className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white rounded p-1 transition-colors tooltip" title="Next Episode">
                                    <span className="material-symbols-outlined !text-[24px]">skip_next</span>
                                </button>
                            </div>
                            <div className="group/volume flex items-center gap-3 ml-2">
                                <button className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white rounded p-1.5 transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">volume_up</span>
                                </button>
                                <div className="w-0 overflow-hidden group-hover/volume:w-24 transition-all duration-300 ease-out flex items-center">
                                    <div className="w-20 h-1 bg-white/20 rounded-full cursor-pointer relative">
                                        <div className="absolute top-0 left-0 h-full bg-primary rounded-full w-[80%]"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="text-xs md:text-sm font-medium text-white/90 select-none ml-2">
                                <span>12:30</span>
                                <span className="text-white/40 mx-1">/</span>
                                <span className="text-white/60">24:00</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary hover:bg-orange-600 active:bg-orange-700 text-white transition-colors">
                                <span className="material-symbols-outlined !text-[20px]">closed_caption</span>
                                <span>Eng</span>
                            </button>

                            <div className="relative group/episodes">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary hover:bg-orange-600 active:bg-orange-700 text-white transition-colors">
                                    <span className="material-symbols-outlined !text-[20px]">list_alt</span>
                                    <span className="hidden sm:inline">Episodes</span>
                                </button>
                                <div className="absolute bottom-full right-0 mb-4 w-64 md:w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 hidden group-hover/episodes:block animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <h3 className="text-white font-bold text-sm mb-3">Up Next</h3>
                                    <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                        <div className="flex gap-3 items-center group/item cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
                                            <div className="relative w-24 h-14 rounded overflow-hidden shrink-0">
                                                {backgroundImage && (
                                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${backgroundImage}')` }}></div>
                                                )}
                                                <div className="absolute inset-0 bg-primary/40 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <span className="material-symbols-outlined text-white !text-lg">play_arrow</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-white text-xs font-bold line-clamp-1">Ep {parseInt(episodeNumber || 1) + 1}</p>
                                                <p className="text-white/50 text-[10px]">24m</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="p-2 rounded-full bg-primary hover:bg-orange-600 active:bg-orange-700 text-white transition-all">
                                <span className="material-symbols-outlined !text-[24px]">settings</span>
                            </button>
                            <button className="p-2 rounded-full bg-primary hover:bg-orange-600 active:bg-orange-700 text-white transition-all ml-1 md:ml-2">
                                <span className="material-symbols-outlined !text-[28px]">fullscreen</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN DE COMENTARIOS INYECTADA */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary block rounded-full"></span>
                    Comentarios y Discusión
                </h2>

                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
                    <div className="flex gap-4">
                        <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV10sjbjmfSOU6llH8dCmzWZwLhLtLS_7Q1px5LDum7KwMOZipPVTG4BNQy4R4z9xZ5sLNa8VgUcYs3jZ6bSrnupe0okqIkRK2q5oBOlh41J0LIQFGOA4zqEKYDMOLmQidVz4WcfuCQiiczyu6bg3ONBEGV3E8SYq-LoZXL0EOwcslC1Ei3JN6wo3B28poPuMn7vECPDiOwVmgai5DXT5d7rOtVB-QlJXFj2KfooHAGrbs9Tm0pmgApYLqZp_lSijcjuWxqBAMFEj3" alt="avatar" className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <textarea
                                className="w-full bg-gray-100 dark:bg-gray-700 border-none rounded p-3 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                                rows="3"
                                placeholder="Comparte tu opinión o teoría sobre este episodio..."
                            ></textarea>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-3">
                                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                                    <input type="checkbox" className="form-checkbox text-primary focus:ring-primary rounded" />
                                    <span>Contiene Spoiler (Activar Niebla)</span>
                                </label>
                                <button className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-2 px-6 rounded-sm transition-colors text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm">
                                    <span className="material-icons-outlined text-[18px]">send</span>
                                    Comentar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lista de comentarios */}
                <div className="space-y-6">
                    {/* Comentario normal */}
                    <div className="flex gap-4">
                        <img src="https://www.crunchyroll.com/i/beta/avatar/cr_gray.png" alt="avatar" className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900 dark:text-white text-sm">AnimeFan99</span>
                                <span className="text-xs text-gray-500">hace 2 horas</span>
                                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded font-bold">Lvl 5</span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 text-sm">¡Increíble la animación en la escena final! No puedo esperar al siguiente.</p>
                            <div className="flex items-center gap-4 mt-2 text-gray-500 text-xs">
                                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <span className="material-icons-outlined text-[16px]">thumb_up</span> 14
                                </button>
                                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <span className="material-icons-outlined text-[16px]">reply</span> Responder
                                </button>
                                <button className="flex items-center gap-1 hover:text-red-500 transition-colors ml-auto md:ml-4">
                                    <span className="material-icons-outlined text-[16px]">flag</span> Reportar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Comentario Spoiler */}
                    <div className="flex gap-4">
                        <img src="https://www.crunchyroll.com/i/beta/avatar/cr_gray.png" alt="avatar" className="w-10 h-10 rounded-full" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-gray-900 dark:text-white text-sm">SpoilerMaster</span>
                                <span className="text-xs text-gray-500">hace 5 horas</span>
                                <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1"><span className="material-icons text-[10px]">warning</span> Spoiler</span>
                            </div>
                            <div className="relative group/spoiler mt-2 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer">
                                <div className="p-3 text-transparent group-hover/spoiler:text-gray-700 dark:group-hover/spoiler:text-gray-300 transition-colors select-none group-hover/spoiler:select-auto filter blur-md group-hover/spoiler:blur-none text-sm">
                                    Cuando el protagonista despierta su nuevo poder en el minuto 14:32 y derrota al jefe final, me quedé loco.
                                </div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-sm group-hover/spoiler:opacity-0 transition-opacity">
                                    <span className="material-icons text-3xl text-gray-500 mb-1">visibility_off</span>
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider text-center px-4">Spoiler Ocultado. Pasa el ratón para revelar.</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-gray-500 text-xs">
                                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <span className="material-icons-outlined text-[16px]">thumb_up</span> 42
                                </button>
                                <button className="flex items-center gap-1 hover:text-primary transition-colors">
                                    <span className="material-icons-outlined text-[16px]">reply</span> Responder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EpisodePlayer;
