import React from 'react';

const TrailerModal = ({ trailerId, onClose }) => {
    if (!trailerId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg shadow-2xl overflow-hidden border border-border-light">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 text-white hover:text-primary transition-colors bg-black/50 rounded-full p-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${trailerId}?autoplay=1`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
};

export default TrailerModal;
