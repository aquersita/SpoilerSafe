import React from 'react';
import { useNavigate } from 'react-router-dom';
import { askAgeGate } from '../utils/ageGate';

const AnimeCard = ({ id, title, image, type, isAdult }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (isAdult) {
            askAgeGate(() => navigate(`/anime/${id}`));
        } else {
            navigate(`/anime/${id}`);
        }
    };

    return (
        <div className="group cursor-pointer w-full relative" onClick={handleClick}>
            <div className="relative overflow-hidden aspect-[12/18] mb-2 rounded-sm bg-gray-200">
                <img
                    src={image}
                    alt={title}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${isAdult ? 'blur-sm scale-110' : ''}`}
                />

                {/* Cortina +18 */}
                {isAdult && (
                    <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2 z-10">
                        <span className="material-symbols-outlined text-white text-5xl">18_up_rating</span>
                        <span className="text-white text-[11px] font-black uppercase tracking-wider">Contenido +18</span>
                        <span className="text-white/60 text-[10px]">Clic para verificar edad</span>
                    </div>
                )}

                {/* Hover overlay — solo si no es adulto */}
                {!isAdult && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="bg-primary text-white p-3 rounded-full shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-200">
                            <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                        </div>
                    </div>
                )}

                {/* Premium Badge */}
                {id % 2 === 0 && !isAdult && (
                    <div className="absolute top-0 right-0 m-1">
                        <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                    </div>
                )}
            </div>

            <div className="px-0.5">
                <h3 className="text-text-main text-[15px] font-medium leading-tight line-clamp-2 transition-colors">
                    {title}
                </h3>
                {type && <p className="text-text-muted text-xs mt-1 font-medium">{type}</p>}
            </div>
        </div>
    );
};

export default AnimeCard;
