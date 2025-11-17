
import React, { useState, useMemo } from 'react';
import { CartItem, User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { apiFetch } from '../../services';
import Spinner from '../../components/Spinner';
import Message from '../../components/Message';

interface CheckoutScreenProps {
    items: CartItem[];
    onBack: () => void;
    onOrderPlaced: () => void;
}

const CheckoutScreen: React.FC<CheckoutScreenProps> = ({ items, onBack, onOrderPlaced }) => {
    const { user } = useAuth();
    const { removeItemsFromCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const { subtotal, deliveryFee, total } = useMemo(() => {
        const sub = items.reduce((acc, item) => acc + (item.price || 0) * item.qty, 0);
        const fee = 5.00; // Fixed delivery fee per store checkout
        return { subtotal: sub, deliveryFee: fee, total: sub + fee };
    }, [items]);

    const handlePlaceOrder = async () => {
        setLoading(true);
        setMessage(null);
        
        const payload = {
            items: items.map(item => ({
                product_id: item.product_id,
                qty: item.qty,
                options: item.options
            }))
        };
        
        const { ok, data } = await apiFetch<any>('/delivery/orders', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (ok && (data as any).success) {
            setMessage({ text: 'Order placed! Redirecting to payment...', type: 'success' });
            
            // Remove items from cart
            const itemIds = items.map(item => item.id);
            removeItemsFromCart(itemIds);

            // Redirect to Mercado Pago
            const paymentUrl = (data as any).init_point;
            if (paymentUrl) {
                window.open(paymentUrl, '_blank');
            }
            
            // Navigate to orders screen
            setTimeout(onOrderPlaced, 2000);
        } else {
            setMessage({ text: (data as any).message || 'Failed to place order.', type: 'error' });
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center">
                 <button onClick={onBack} className="text-gray-400 hover:text-white mr-4">
                    <i className="fas fa-arrow-left fa-lg"></i>
                </button>
                <h1 className="text-3xl font-bold text-white">Checkout</h1>
            </div>

            {/* Delivery Address */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h2 className="text-lg font-bold text-orange-500 mb-2">Delivery Address</h2>
                <p className="font-semibold text-white">{user.full_name}</p>
                <p className="text-gray-300 text-sm">{user.address_street}, {user.address_number}</p>
                <p className="text-gray-300 text-sm">{user.district_id} - {user.city_id}</p>
                <p className="text-gray-300 text-sm mt-1">Ref: {user.address_nearby}</p>
                <p className="text-teal-400 text-sm mt-2">WhatsApp: {user.whatsapp_number}</p>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h2 className="text-lg font-bold text-orange-500 mb-3">Order Summary</h2>
                <div className="space-y-2">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="text-gray-300">
                                {item.qty} x {item.name}
                            </div>
                            <div className="text-white font-medium">
                                R$ {((item.price || 0) * item.qty).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="border-t border-gray-700 my-3"></div>
                 <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                    <span>Delivery Fee</span>
                    <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 my-2"></div>
                <div className="flex justify-between text-white font-bold text-xl">
                    <span>Total to Pay</span>
                    <span className="text-teal-400">R$ {total.toFixed(2)}</span>
                </div>
            </div>
            
             {message && <Message text={message.text} type={message.type} />}

            <button 
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-green-800 flex items-center justify-center h-12"
            >
                {loading ? <Spinner size="sm" /> : 'Confirm & Pay'}
            </button>
        </div>
    );
};

export default CheckoutScreen;
