import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Comprueba si la ruta actual coincide para resaltar el icono
    const isActive = (path) => location.pathname === path;

    return (
        <aside className="fixed left-0 top-16 bottom-0 w-16 bg-white border-r border-border-light flex flex-col items-center py-6 space-y-8 z-40 hidden md:flex shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
            <button onClick={() => navigate('/')} className={`${isActive('/') ? 'text-primary bg-orange-50' : 'text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors'} w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer`}>
                <span className="material-icons-outlined">home</span>
            </button>
            <button onClick={() => navigate('/catalog')} className={`${isActive('/catalog') ? 'text-primary bg-orange-50' : 'text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors'} w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer`}>
                <span className="material-icons-outlined">apps</span>
            </button>
            <button onClick={() => navigate('/watchlist')} className={`${isActive('/watchlist') ? 'text-primary bg-orange-50' : 'text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors'} w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer`}>
                <span className="material-icons-outlined">bookmark_border</span>
            </button>
            <button onClick={() => navigate('/history')} className={`${isActive('/history') ? 'text-primary bg-orange-50' : 'text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors'} w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer`}>
                <span className="material-icons-outlined">history</span>
            </button>
            <button onClick={() => navigate('/messages')} className={`${isActive('/messages') ? 'text-primary bg-orange-50' : 'text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors'} w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer`}>
                <span className="material-icons-outlined">send</span>
            </button>
            <div className="mt-auto mb-4">
                <button onClick={() => navigate('/settings')} className={`${isActive('/settings') ? 'text-primary bg-orange-50' : 'text-gray-400 hover:text-primary hover:bg-gray-50 transition-colors'} w-10 h-10 flex items-center justify-center rounded-lg cursor-pointer`}>
                    <span className="material-icons-outlined">settings</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
