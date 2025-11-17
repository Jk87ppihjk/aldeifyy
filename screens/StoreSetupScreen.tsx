
import React from 'react';

interface StoreSetupProps {
    onSetupComplete: () => void;
}

const StoreSetupScreen: React.FC<StoreSetupProps> = ({ onSetupComplete }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center justify-center text-center">
            <i className="fas fa-store text-5xl text-teal-400 mb-6"></i>
            <h1 className="text-2xl text-teal-400 font-bold">Store Setup Required</h1>
            <p className="text-gray-400 mt-4 max-w-md">To begin selling, you need to create your store profile. This includes your store name, address, and logo.</p>
            <p className="text-gray-500 text-sm mt-6">(For the best experience, we recommend completing this step on our web platform.)</p>
            <button onClick={onSetupComplete} className="mt-8 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                I Understand, Continue to Dashboard
            </button>
        </div>
    );
};

export default StoreSetupScreen;
