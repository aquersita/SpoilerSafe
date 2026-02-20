import React from 'react';

const Sidebar = () => {
    return (
        <aside className="fixed left-0 top-16 bottom-0 w-16 bg-white border-r border-border-light flex flex-col items-center py-6 space-y-8 z-40 hidden md:flex shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
            <a className="text-primary bg-orange-50 w-10 h-10 flex items-center justify-center rounded-lg" href="#">
                <span className="material-icons-outlined">home</span>
            </a>
            <a className="text-gray-400 hover:text-primary hover:bg-gray-50 w-10 h-10 flex items-center justify-center rounded-lg transition-colors" href="#">
                <span className="material-icons-outlined">apps</span>
            </a>
            <a className="text-gray-400 hover:text-primary hover:bg-gray-50 w-10 h-10 flex items-center justify-center rounded-lg transition-colors" href="#">
                <span className="material-icons-outlined">bookmark_border</span>
            </a>
            <a className="text-gray-400 hover:text-primary hover:bg-gray-50 w-10 h-10 flex items-center justify-center rounded-lg transition-colors" href="#">
                <span className="material-icons-outlined">history</span>
            </a>
            <div className="mt-auto mb-4">
                <a className="text-gray-400 hover:text-primary hover:bg-gray-50 w-10 h-10 flex items-center justify-center rounded-lg transition-colors" href="#">
                    <span className="material-icons-outlined">settings</span>
                </a>
            </div>
        </aside>
    );
};

export default Sidebar;
