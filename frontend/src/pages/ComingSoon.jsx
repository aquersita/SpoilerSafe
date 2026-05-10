import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[85vh] bg-white dark:bg-gray-950 flex items-center justify-center relative overflow-hidden">
            {/* Background Image Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://media.kitsu.app/anime/41370/cover_image/large-3de3cc6d2b33162c928de10aa201e4ba.jpeg"
                    alt="Background"
                    className="w-full h-full object-cover opacity-10 filter blur-[2px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-light via-background-light/90 to-transparent"></div>
            </div>

            <div className="relative z-10 text-center px-4 max-w-2xl mx-auto flex flex-col items-center">
                <div className="text-primary mb-6 animate-bounce">
                    <span className="material-icons-outlined text-7xl md:text-8xl drop-shadow-lg">construction</span>
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-gray-800 dark:text-gray-200 tracking-tighter mb-4 drop-shadow-sm" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                    PRÓXIMAMENTE
                </h1>

                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 font-medium mb-8 leading-relaxed">
                    Nuestros desarrolladores están forjando esta sección con el poder del anime.
                    <br className="hidden md:block" /> ¡Vuelve pronto para descubrir contenido épico!
                </p>

                <div className="flex gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-white dark:bg-gray-900 border-2 border-primary text-primary hover:bg-orange-50 active:bg-orange-100 font-bold py-3 px-8 rounded-sm transition-colors focus:outline-none flex items-center gap-2 uppercase tracking-wide shadow-sm"
                    >
                        <span className="material-icons text-xl">arrow_back</span>
                        Volver Atrás
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-primary hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-3 px-8 rounded-sm transition-all shadow-lg shadow-orange-200 focus:outline-none flex items-center gap-2 uppercase tracking-wide"
                    >
                        <span className="material-icons text-xl">home</span>
                        Ir a Inicio
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComingSoon;
