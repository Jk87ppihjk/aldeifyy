
import React from 'react';

interface NavItem {
    id: string;
    label: string;
    icon: string;
    badgeCount?: number;
}

interface BottomNavProps {
    items: NavItem[];
    activeTab: string;
    setActiveTab: (tabId: string) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ items, activeTab, setActiveTab }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 z-30" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex justify-around max-w-lg mx-auto py-2">
                {items.map(item => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)} 
                        className="relative flex flex-col items-center font-medium p-2 rounded-lg w-20 transition-colors group"
                    >
                        <div className={`transition-colors ${activeTab === item.id ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-400'}`}>
                           <i className={`${item.icon} w-6 h-6 text-xl`}></i>
                           <span className="text-xs mt-1 block">{item.label}</span>
                        </div>
                        {item.badgeCount && item.badgeCount > 0 && (
                            <span className="absolute top-0 right-2.5 h-5 w-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                {item.badgeCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;