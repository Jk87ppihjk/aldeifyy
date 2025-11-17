
import React from 'react';
import { User } from '../../types';

interface ProfileScreenProps {
    user: User;
    onLogout: () => void;
    onNavigate: (page: string) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ user, onLogout, onNavigate }) => {
    const profileItems = [
        { label: "My Orders", icon: "fa-solid fa-receipt", action: () => onNavigate('myOrders') },
        { label: "Edit Profile", icon: "fa-solid fa-user-pen", action: () => onNavigate('editProfile') },
        { label: "Help Center", icon: "fa-solid fa-question-circle", action: () => {} },
        { label: "Terms of Service", icon: "fa-solid fa-file-contract", action: () => onNavigate('terms') },
        { label: "Privacy Policy", icon: "fa-solid fa-shield-halved", action: () => onNavigate('privacy') },
    ];

    return (
        <div className="p-4 text-white">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-900">{user.full_name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                    <h2 className="text-2xl font-bold">{user.full_name || 'Aldeify User'}</h2>
                    <p className="text-gray-400">{user.email}</p>
                </div>
            </div>

            <div className="space-y-2">
                {profileItems.map(item => (
                     <button key={item.label} onClick={item.action} className="w-full flex items-center p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
                        <i className={`${item.icon} text-teal-400 w-6 text-center`}></i>
                        <span className="ml-4 font-medium">{item.label}</span>
                        <i className="fa-solid fa-chevron-right ml-auto text-gray-500"></i>
                    </button>
                ))}
            </div>

            <button 
                onClick={onLogout} 
                className="mt-8 w-full bg-red-600/80 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
                <i className="fas fa-sign-out-alt mr-2"></i> Logout
            </button>
        </div>
    );
};

export default ProfileScreen;