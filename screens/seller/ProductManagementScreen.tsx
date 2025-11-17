import React, { useState, useEffect, useCallback } from 'react';
import { Store, User, Product } from '../../types';
import { apiFetch } from '../../services';
import Spinner from '../../components/Spinner';

interface ProductManagementScreenProps {
    store: Store;
    user: User;
    onAddProductClick: () => void;
}

const ProductManagementScreen: React.FC<ProductManagementScreenProps> = ({ store, user, onAddProductClick }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const { ok, data } = await apiFetch<any>(`/products/store/${user.id}`);
        if (ok && (data as any).success) {
            setProducts((data as any).products);
        }
        setLoading(false);
    }, [user.id]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleToggleActive = async (product: Product) => {
        // Optimistic update
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
        
        // Create a payload with only the necessary fields to avoid sending back large data
        const payload = {
            ...product,
            price: Number(product.price), // Ensure price is a number
            is_active: !product.is_active 
        };

        const { ok } = await apiFetch(`/products/${product.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });

        if (!ok) {
            // Revert on failure
            fetchProducts();
            alert("Failed to update product status.");
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="p-4 space-y-4">
             <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold text-white">Your Products</h3>
                 <button 
                    onClick={() => {
                        console.log('--- ADD PRODUCT BUTTON CLICKED ---');
                        console.log('Telling SellerDashboard to switch to the "add product" view.');
                        onAddProductClick();
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                 >
                    <i className="fas fa-plus mr-2"></i> Add Product
                 </button>
            </div>
            {products.length === 0 ? (
                <div className="text-center py-10 bg-gray-800 rounded-lg">
                    <i className="fas fa-box-open text-4xl text-gray-600"></i>
                    <p className="mt-4 text-gray-400">You haven't added any products yet.</p>
                </div>
            ) : (
                products.map(p => (
                    <div key={p.id} className={`bg-gray-800 p-3 rounded-lg flex items-center gap-4 border-l-4 ${p.is_active ? 'border-teal-500' : 'border-gray-600'}`}>
                        <img src={p.image_url || `https://picsum.photos/seed/${p.id}/100/100`} alt={p.name} className="w-16 h-16 rounded-md object-cover"/>
                        <div className="flex-grow">
                            <p className="font-bold text-white">{p.name}</p>
                            <p className="text-sm text-green-400 font-semibold">R$ {Number(p.price).toFixed(2)}</p>
                            <p className="text-xs text-gray-400">Stock: {p.stock_quantity ?? 'N/A'}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-center">
                            <button className="text-blue-400 hover:text-blue-300 text-xs font-semibold"><i className="fas fa-edit mr-1"></i> Edit</button>
                            <button onClick={() => handleToggleActive(p)} className={`text-xs font-semibold ${p.is_active ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}>
                                <i className={`fas ${p.is_active ? 'fa-toggle-on' : 'fa-toggle-off'} mr-1`}></i> {p.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default ProductManagementScreen;