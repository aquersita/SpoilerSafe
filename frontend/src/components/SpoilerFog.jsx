import React from 'react';

const SpoilerFog = ({ isRevealed, children, message = "Spoilers Detectados" }) => {
    const [forceReveal, setForceReveal] = React.useState(false);

    if (isRevealed || forceReveal) {
        return <>{children}</>;
    }

    return (
        <div className="relative group cursor-pointer overflow-hidden rounded" onClick={() => setForceReveal(true)}>
            {/* Blurry Content */}
            <div className="blur-md select-none pointer-events-none opacity-50 grayscale transition-all duration-500">
                {children}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 text-center p-2 z-10 transition-colors hover:bg-white/40">
                <svg className="w-8 h-8 text-primary mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268-2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <span className="font-bold text-text-main text-sm tracking-wide uppercase border border-border-light px-3 py-1 rounded bg-white/80 backdrop-blur-sm">
                    {message}
                </span>
                <span className="text-text-muted text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    Haz clic para revelar
                </span>
            </div>
        </div>
    );
};

export default SpoilerFog;
