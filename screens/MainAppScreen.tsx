
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import Layout from '../components/Layout';
import BottomNav from '../components/BottomNav';
import HomeScreen from './buyer/HomeScreen';
import ProfileScreen from './buyer/ProfileScreen';
import ProductDetailScreen from './buyer/ProductDetailScreen';
import CartScreen from './buyer/CartScreen';
import CheckoutScreen from './buyer/CheckoutScreen';
import MyOrdersScreen from './buyer/MyOrdersScreen';
import EditProfileScreen from './buyer/EditProfileScreen';
import TermsScreen from './legal/TermsScreen';
import PrivacyScreen from './legal/PrivacyScreen';
import FyScreen from './buyer/FyScreen'; // Import the new FyScreen
import { CartItem } from '../types';

type Page = 'home' | 'profile' | 'productDetail' | 'cart' | 'stores' | 'checkout' | 'myOrders' | 'terms' | 'privacy' | 'editProfile' | 'fy';

const MainAppScreen: React.FC = () => {
    const { user, logout, checkToken } = useAuth();
    const { cartItemCount } = useCart();
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);

    const handleNavigate = (page: Page) => {
        setCurrentPage(page);
    };

    const handleNavigateToProduct = (productId: number) => {
        setSelectedProductId(productId);
        setCurrentPage('productDetail');
    };

    const handleNavigateToCheckout = (items: CartItem[]) => {
        setCheckoutItems(items);
        setCurrentPage('checkout');
    }

    // Simple router
    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomeScreen onNavigateToProduct={handleNavigateToProduct} />;
            case 'fy': // Add case for the new Fy screen
                return <FyScreen />;
            case 'profile':
                return <ProfileScreen user={user!} onLogout={logout} onNavigate={handleNavigate} />;
            case 'productDetail':
                return <ProductDetailScreen productId={selectedProductId!} onBack={() => handleNavigate('home')} />;
            case 'cart':
                return <CartScreen onCheckout={handleNavigateToCheckout} />;
            case 'checkout':
                return <CheckoutScreen items={checkoutItems} onBack={() => handleNavigate('cart')} onOrderPlaced={() => handleNavigate('myOrders')} />;
            case 'myOrders':
                return <MyOrdersScreen onBack={() => handleNavigate('profile')} />;
            case 'editProfile':
                return <EditProfileScreen onProfileUpdated={() => {
                    checkToken();
                    handleNavigate('profile');
                }} onBack={() => handleNavigate('profile')} />;
            case 'terms':
                return <TermsScreen />;
            case 'privacy':
                return <PrivacyScreen />;
            default:
                return <HomeScreen onNavigateToProduct={handleNavigateToProduct} />;
        }
    };
    
    const showNav = ['home', 'fy', 'cart', 'profile'].includes(currentPage);

    const buyerNavItems = [
        { id: 'home', label: 'Home', icon: 'fa-solid fa-house' },
        { id: 'fy', label: 'Fy', icon: 'fa-solid fa-video' },
        { id: 'cart', label: 'Cart', icon: 'fa-solid fa-cart-shopping', badgeCount: cartItemCount },
        { id: 'profile', label: 'Profile', icon: 'fa-solid fa-user' },
    ];

    return (
        <Layout onNavigate={handleNavigate}>
            <div className={showNav ? 'pb-24' : ''}>
                {renderPage()}
            </div>
            {showNav && <BottomNav items={buyerNavItems} activeTab={currentPage} setActiveTab={handleNavigate} />}
        </Layout>
    );
};

export default MainAppScreen;
