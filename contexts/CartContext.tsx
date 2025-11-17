
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { CartItem } from '../types';

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: Omit<CartItem, 'id'>) => void;
    updateQuantity: (itemId: string, newQty: number) => void;
    removeFromCart: (itemId: string) => void;
    removeItemsFromCart: (itemIds: string[]) => void;
    clearCart: () => void;
    cartItemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const generateCartItemId = (productId: number, options: Record<string, string>): string => {
    const sortedOptions = Object.keys(options).sort().map(key => `${key}:${options[key]}`).join('-');
    return `${productId}-${sortedOptions}`;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const localData = localStorage.getItem('aldeifyCart');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error("Could not parse cart from localStorage", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('aldeifyCart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (newItemData: Omit<CartItem, 'id'>) => {
        const itemId = generateCartItemId(newItemData.product_id, newItemData.options);
        const newItem: CartItem = { ...newItemData, id: itemId };

        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.id === newItem.id);
            if (existingItem) {
                return prevCart.map(item =>
                    item.id === newItem.id ? { ...item, qty: item.qty + newItem.qty } : item
                );
            } else {
                return [...prevCart, newItem];
            }
        });
    };

    const updateQuantity = (itemId: string, newQty: number) => {
        setCart(prevCart => {
            if (newQty <= 0) {
                return prevCart.filter(item => item.id !== itemId);
            }
            return prevCart.map(item =>
                item.id === itemId ? { ...item, qty: newQty } : item
            );
        });
    };

    const removeFromCart = (itemId: string) => {
        setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    };
    
    const removeItemsFromCart = (itemIds: string[]) => {
        setCart(prevCart => prevCart.filter(item => !itemIds.includes(item.id)));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartItemCount = useMemo(() => {
        return cart.reduce((count, item) => count + item.qty, 0);
    }, [cart]);

    return (
        <CartContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, removeItemsFromCart, clearCart, cartItemCount }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
