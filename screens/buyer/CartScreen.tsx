
import React, { useState, useEffect, useCallback } from 'react';
import { useCart } from '../../contexts/CartContext';
import { apiFetch } from '../../services';
import { CalculatedCart, CartBreakdown, CartItem } from '../../types';
import Spinner from '../../components/Spinner';

interface CartScreenProps {
    onCheckout: (items: CartItem[]) => void;
}

const CartScreen: React.FC<CartScreenProps> = ({ onCheckout }) => {
    const { cart, updateQuantity, removeFromCart } = useCart();
    const [breakdown, setBreakdown] = useState<CalculatedCart | null>(null);
    const [loading, setLoading] = useState(true);

    const calculateCart = useCallback(async () => {
        if (cart.length === 0) {
            setBreakdown(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { ok, data } = await apiFetch<CalculatedCart>('/cart/calculate', {
            method: 'POST',
            body: JSON.stringify({ items: cart.map(i => ({product_id: i.product_id, qty: i.qty, options: i.options})) })
        });
        if (ok) {
            // Merge local cart data (like the composite id) with backend calculated data
            const calculatedData = data as CalculatedCart;
            calculatedData.cartBreakdown.forEach(storeCart => {
                storeCart.items.forEach(item => {
                    const localItem = cart.find(c => c.product_id === item.product_id && JSON.stringify(c.options) === JSON.stringify(item.selected_options));
                    if(localItem) {
                        (item as any).id = localItem.id;
                    }
                });
            });
            setBreakdown(calculatedData);
        }
        setLoading(false);
    }, [cart]);

    useEffect(() => {
        calculateCart();
    }, [calculateCart]);
    
    const handleCheckoutForStore = (storeCart: CartBreakdown) => {
        // Find the full cart items corresponding to this store's checkout
        const itemsToCheckout = cart.filter(cartItem => 
            storeCart.items.some(breakdownItem => cartItem.id === (breakdownItem as any).id)
        );
        onCheckout(itemsToCheckout);
    };

    if (loading) {
        return <div className="p-4"><Spinner /></div>;
    }

    if (!breakdown || cart.length === 0) {
        return (
            <div className="p-4 text-center">
                <i className="fas fa-shopping-cart text-6xl text-gray-700 mb-4"></i>
                <h2 className="text-2xl font-bold text-white">Your Cart is Empty</h2>
                <p className="text-gray-400 mt-2">Looks like you haven't added anything yet.</p>
            </div>
        );
    }
    
    return (
        <div className="p-4 space-y-6">
            <h1 className="text-3xl font-bold text-white">My Cart</h1>
            {breakdown.cartBreakdown.map((storeCart: CartBreakdown) => (
                <div key={storeCart.store_id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h2 className="text-lg font-bold text-orange-500 mb-3">{storeCart.store_name}</h2>
                    <div className="space-y-4">
                        {storeCart.items.map(item => (
                            <div key={(item as any).id} className="flex items-center gap-4">
                                <img src={item.image_url} alt={item.product_name} className="w-16 h-16 rounded-md object-cover"/>
                                <div className="flex-grow">
                                    <p className="font-semibold text-white">{item.product_name}</p>
                                     {item.selected_options && Object.keys(item.selected_options).length > 0 &&
                                        <p className="text-xs text-gray-400">
                                            {Object.entries(item.selected_options).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                        </p>
                                    }
                                    <p className="text-sm text-gray-300">R$ {Number(item.product_price).toFixed(2)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity((item as any).id, item.qty - 1)} className="bg-gray-700 h-7 w-7 rounded-full">-</button>
                                    <span className="font-bold w-4 text-center">{item.qty}</span>
                                    <button onClick={() => updateQuantity((item as any).id, item.qty + 1)} className="bg-gray-700 h-7 w-7 rounded-full">+</button>
                                </div>
                                <button onClick={() => removeFromCart((item as any).id)} className="text-gray-500 hover:text-red-500">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-700 mt-4 pt-3">
                        <div className="flex justify-between text-sm text-gray-300">
                           <span>Subtotal</span>
                           <span>R$ {Number(storeCart.subtotal_products).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-300">
                           <span>Delivery Fee</span>
                           <span>R$ {5.00.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between font-bold text-white mt-1">
                           <span>Total for this store</span>
                           <span>R$ {(Number(storeCart.subtotal_products) + 5.00).toFixed(2)}</span>
                        </div>
                    </div>
                    <button onClick={() => handleCheckoutForStore(storeCart)} className="mt-4 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Checkout from {storeCart.store_name}
                    </button>
                </div>
            ))}

            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-2">
                <h2 className="text-xl font-bold text-white mb-3">Grand Total</h2>
                <div className="flex justify-between text-gray-300">
                    <span>Products Subtotal</span>
                    <span>R$ {Number(breakdown.subTotalGeral).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                    <span>Delivery Fee ({breakdown.numeroDeLojas} {breakdown.numeroDeLojas > 1 ? 'stores' : 'store'})</span>
                    <span>R$ {Number(breakdown.freteTotal).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 my-2"></div>
                <div className="flex justify-between text-white font-bold text-xl">
                    <span>Total</span>
                    <span className="text-teal-400">R$ {Number(breakdown.valorTotal).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default CartScreen;