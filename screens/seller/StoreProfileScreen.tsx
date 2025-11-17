import React from 'react';
import { Store } from '../../types';

interface StoreProfileScreenProps {
    store: Store;
    onEditClick: () => void;
}

const InfoCard: React.FC<{ label: string; value: React.ReactNode; icon: string }> = ({ label, value, icon }) => (
    <div className="bg-gray-800 p-4 rounded-lg flex items-start gap-4">
        <i className={`${icon} text-teal-400 text-xl w-6 text-center mt-1`}></i>
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="font-semibold text-white">{value}</p>
        </div>
    </div>
);


const StoreProfileScreen: React.FC<StoreProfileScreenProps> = ({ store, onEditClick }) => {
    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-white">Store Profile</h3>
                 <button onClick={onEditClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">
                    <i className="fas fa-edit mr-2"></i> Edit Profile
                 </button>
            </div>
            
            <div className="relative mb-6">
                <img src={store.banner_url || 'https://picsum.photos/seed/banner/800/200'} alt="Store Banner" className="w-full h-32 object-cover rounded-lg"/>
                <img src={store.logo_url || 'https://picsum.photos/seed/logo/200/200'} alt="Store Logo" className="w-24 h-24 rounded-full object-cover absolute -bottom-12 left-1/2 -translate-x-1/2 border-4 border-gray-900"/>
            </div>

            <div className="mt-16 text-center mb-6">
                <h2 className="text-2xl font-bold text-white">{store.name}</h2>
                <p className="text-sm text-gray-400">{store.category_name}</p>
            </div>
            
            <div className="space-y-3">
                 <InfoCard label="Bio" value={store.bio || 'Not set'} icon="fas fa-info-circle" />
                 <InfoCard label="Address" value={`${store.address_street}, ${store.address_number} - ${store.district_name}, ${store.city_name}`} icon="fas fa-map-marker-alt" />
                 <InfoCard label="WhatsApp Contact" value={store.whatsapp_number} icon="fab fa-whatsapp" />
            </div>
        </div>
    );
};

export default StoreProfileScreen;