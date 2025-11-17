
import React from 'react';
import { useAuth } from './contexts/AuthContext';
import { Role } from './types';

// Import Screens
import AuthScreen from './screens/AuthScreen';
import AddressSetupScreen from './screens/AddressSetupScreen';
import StoreSetupScreen from './screens/StoreSetupScreen';
import MainAppScreen from './screens/MainAppScreen';
import SellerDashboard from './screens/SellerDashboard';
import DeliveryDashboard from './screens/DeliveryDashboard';
import Spinner from './components/Spinner';


export default function App() {
    const { user, needsSetup, setupType, isLoading, checkToken } = useAuth();

    const handleSetupComplete = () => {
        // Re-check token/user status to clear the setup flags
        checkToken();
    };
    
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 flex justify-center items-center">
                <Spinner />
            </div>
        );
    }
    
    // Add a wrapper with safe-area padding for the entire app
    // to prevent overlap with mobile device notches and home bars.
    return (
        <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            {!user ? (
                <AuthScreen />
            ) : needsSetup ? (
                setupType === 'store_setup' ? (
                    <StoreSetupScreen onSetupComplete={handleSetupComplete} />
                ) : setupType === 'address_setup' ? (
                    <AddressSetupScreen onSetupComplete={handleSetupComplete} />
                ) : (
                    <AuthScreen /> // Fallback
                )
            ) : (
                // Role-based routing
                (() => {
                    switch (user.role) {
                        case Role.DELIVERY:
                            return <DeliveryDashboard />;
                        case Role.SELLER:
                            return <SellerDashboard />;
                        case Role.BUYER:
                        case Role.ADMIN: // Admins get buyer view on mobile
                        default:
                            return <MainAppScreen />;
                    }
                })()
            )}
        </div>
    );
}