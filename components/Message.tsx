
import React from 'react';

interface MessageProps {
    text: string;
    type: 'success' | 'error' | 'info';
}

const Message: React.FC<MessageProps> = ({ text, type }) => {
    const typeClasses = {
        success: 'bg-green-500/20 text-green-300 border-green-500/30',
        error: 'bg-red-500/20 text-red-300 border-red-500/30',
        info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    };
    return (
        <p className={`my-4 p-3 rounded-md font-semibold text-center border ${typeClasses[type]}`}>
            {text}
        </p>
    );
};

export default Message;
