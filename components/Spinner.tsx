
import React from 'react';

const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = {
        sm: 'h-5 w-5 border-2',
        md: 'h-10 w-10 border-4',
        lg: 'h-16 w-16 border-4',
    };
    return (
        <div className="flex justify-center items-center h-full">
            <div 
                className={`animate-spin rounded-full border-orange-500 border-t-transparent ${sizeClasses[size]}`}
                style={{ borderTopColor: 'transparent' }}
            ></div>
        </div>
    );
};

export default Spinner;
