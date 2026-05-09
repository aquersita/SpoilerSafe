import React from 'react';
import { useLocation } from 'react-router-dom';

const AnimatedTransitions = ({ children }) => {
    const location = useLocation();

    return (
        <div key={location.pathname} className="animate-fade-in-up w-full flex-grow flex flex-col">
            {children}
        </div>
    );
};

export default AnimatedTransitions;
