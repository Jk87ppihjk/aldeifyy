
import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
    onNavigate: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onNavigate }) => {
    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
            <header className="sticky top-0 z-20 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700">
                <div className="max-w-4xl mx-auto p-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-orange-500 tracking-wider cursor-pointer" onClick={() => onNavigate('home')}>
                        aldeify
                    </h1>
                </div>
            </header>
            
            <main className="flex-grow w-full max-w-4xl mx-auto p-4">
                {children}
            </main>
            
            <footer className="bg-gray-800 border-t border-gray-700 mt-8">
                <div className="max-w-4xl mx-auto py-6 px-4 text-center text-gray-400 text-sm">
                    <div className="flex justify-center gap-6 mb-4">
                        <a onClick={() => onNavigate('terms')} className="cursor-pointer hover:text-orange-500 transition-colors">Terms of Service</a>
                        <a onClick={() => onNavigate('privacy')} className="cursor-pointer hover:text-orange-500 transition-colors">Privacy Policy</a>
                    </div>
                    <p>&copy; {new Date().getFullYear()} aldeify. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
