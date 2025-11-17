
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Store, User } from '../types';
import { apiFetch } from '../services';

import BottomNav from '../components/BottomNav';
import Spinner from '../components/Spinner';
import Message from '../components/Message';

// Import child screens for the dashboard
import ProductManagementScreen from './seller/ProductManagementScreen';
import OrderManagementScreen from './seller/OrderManagementScreen';
import StoreProfileScreen from './seller/StoreProfileScreen';
import AddProductScreen from './seller/AddProductScreen';
import EditStoreProfileScreen from './seller/EditStoreProfileScreen';
import FyManagementScreen from './seller/FyManagementScreen';
import SettingsScreen from './seller/SettingsScreen';
import AddFyVideoScreen from './seller/AddFyVideoScreen';


const SellerDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    // FIX: Add 'addFyVideo' to the view state to allow navigation to the add video screen.
    const [view, setView] = useState<'dashboard' | 'addProduct' | 'editStore' | 'addFyVideo'>('dashboard');
    const [activeTab, setActiveTab] = useState('products');
    const [store, setStore] = useState<Store | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStoreData = useCallback(async () => {
        setLoading(true);
        const { ok, data } = await apiFetch<{ store: Store }>('/stores/mine');
        if (ok) {
            setStore((data as { store: Store }).store);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStoreData();
    }, [fetchStoreData]);

    const handleStoreUpdate = () => {
        fetchStoreData();
        setView('dashboard');
        setActiveTab('store'); // Switch to store tab to see changes
    }

    const renderContent = () => {
        if (loading) return <div className="mt-10"><Spinner /></div>;
        if (!store) return <div className="p-4"><Message text="To get started, please create your store profile first. This feature is best accessed via our web panel." type="info" /></div>;

        if (view === 'addProduct') {
            return <AddProductScreen 
                store={store} 
                onProductAdded={() => {
                    setView('dashboard');
                    setActiveTab('products');
                }}
                onCancel={() => {
                    setView('dashboard');
                }}
            />;
        }

        if (view === 'editStore') {
            return <EditStoreProfileScreen 
                store={store}
                onStoreUpdate={handleStoreUpdate}
                onCancel={() => setView('dashboard')}
            />
        }

        // FIX: Add a view for the AddFyVideoScreen component.
        if (view === 'addFyVideo') {
            return <AddFyVideoScreen
                onVideoAdded={() => {
                    setView('dashboard');
                    setActiveTab('fy');
                }}
                onCancel={() => {
                    setView('dashboard');
                }}
            />;
        }

        // Default to dashboard content based on active tab
        switch (activeTab) {
            case 'products': 
                return <ProductManagementScreen 
                    store={store} 
                    user={user as User} 
                    onAddProductClick={() => {
                        setView('addProduct');
                    }} 
                />;
            case 'orders': return <OrderManagementScreen store={store} />;
            case 'store': return <StoreProfileScreen store={store} onEditClick={() => setView('editStore')} />;
            // FIX: Pass the onAddVideoClick prop to FyManagementScreen to allow navigation to the add video screen.
            case 'fy': return <FyManagementScreen store={store} user={user as User} onAddVideoClick={() => setView('addFyVideo')} />;
            case 'settings': return <SettingsScreen user={user as User} />;
            default: return null;
        }
    };
    
    const sellerNavItems = [
        { id: 'products', label: 'Products', icon: 'fa-solid fa-box-open' },
        { id: 'orders', label: 'Orders', icon: 'fa-solid fa-receipt' },
        { id: 'fy', label: 'Fy', icon: 'fa-solid fa-video' },
        { id: 'store', label: 'Store', icon: 'fa-solid fa-store' },
        { id: 'settings', label: 'Settings', icon: 'fa-solid fa-cog' },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <header className="bg-gray-800/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-gray-700 sticky top-0 z-10">
                <div>
                    <h1 className="text-xl text-orange-500 font-bold">Seller Dashboard</h1>
                    <p className="text-xs text-gray-400">Welcome, {user?.full_name}!</p>
                </div>
                <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <i className="fas fa-sign-out-alt fa-lg"></i>
                </button>
            </header>
            
            <main className="flex-grow overflow-auto pb-24">
                 {renderContent()}
            </main>
            
            {/* Only show bottom nav in dashboard view */}
            {view === 'dashboard' && (
                <BottomNav items={sellerNavItems} activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
        </div>
    );
}

export default SellerDashboard;