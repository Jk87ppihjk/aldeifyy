
import React, { useState, useEffect, useCallback } from 'react';
import { Category, Subcategory, Product } from '../../types';
import { apiFetch } from '../../services';
import { useCart } from '../../contexts/CartContext';
import Spinner from '../../components/Spinner';

interface HomeScreenProps {
    onNavigateToProduct: (productId: number) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToProduct }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const { addToCart } = useCart();

    const fetchProducts = useCallback(async (catId: string, subcatId: string) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (catId) params.append('category_id', catId);
        if (subcatId) params.append('subcategory_id', subcatId);
        
        const { ok, data } = await apiFetch<any>(`/products?${params.toString()}`);
        if (ok && (data as any).success) {
            setProducts((data as any).products);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            const { ok, data } = await apiFetch<any>('/categories');
            if (ok && (data as any).success) {
                setCategories((data as any).categories);
            }
        };
        fetchCategories();
        fetchProducts('', '');
    }, [fetchProducts]);

    const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const catId = e.target.value;
        setSelectedCategory(catId);
        setSelectedSubcategory('');
        setSubcategories([]);
        if (catId) {
            const { ok, data } = await apiFetch<any>(`/subcategories/${catId}`);
            if (ok && (data as any).success) setSubcategories((data as any).subcategories);
        }
        fetchProducts(catId, '');
    };
    
    const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subcatId = e.target.value;
        setSelectedSubcategory(subcatId);
        fetchProducts(selectedCategory, subcatId);
    };
    
    const handleQuickAddToCart = (e: React.MouseEvent, product: Product) => {
        e.stopPropagation(); // Prevent navigation when clicking the cart button
        addToCart({
            product_id: product.id,
            qty: 1,
            options: {},
            name: product.name,
            price: Number(product.price),
            image_url: product.image_url,
            stock_quantity: product.stock_quantity,
        });
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3 text-gray-200">Filters</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <select value={selectedCategory} onChange={handleCategoryChange} className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500">
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                    </select>
                    <select value={selectedSubcategory} onChange={handleSubcategoryChange} className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-orange-500 focus:border-orange-500" disabled={!selectedCategory}>
                        <option value="">All Subcategories</option>
                        {subcategories.map(s => <option key={s.id} value={s.id.toString()}>{s.name}</option>)}
                    </select>
                </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4 text-white">Featured Products</h2>
            {loading ? <Spinner /> : products.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(product => (
                        <div key={product.id} onClick={() => onNavigateToProduct(product.id)} className="cursor-pointer bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 flex flex-col group">
                            <img src={product.image_url || `https://picsum.photos/seed/${product.id}/300/300`} alt={product.name} className="w-full h-32 object-cover" />
                            <div className="p-3 flex flex-col flex-grow">
                                <h3 className="text-gray-200 font-semibold text-sm truncate">{product.name}</h3>
                                <p className="text-xs text-gray-400 truncate mb-2">{product.store_name}</p>
                                <div className="mt-auto flex justify-between items-center">
                                    <span className="text-teal-400 font-bold text-lg">R${Number(product.price).toFixed(2)}</span>
                                    <button onClick={(e) => handleQuickAddToCart(e, product)} className="bg-orange-600 text-white rounded-full h-8 w-8 flex items-center justify-center transform transition-transform group-hover:scale-110">
                                        <i className="fas fa-cart-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <i className="fas fa-search text-4xl text-gray-600"></i>
                    <p className="mt-4 text-gray-400">No products found for the selected filters.</p>
                </div>
            )}
        </div>
    );
};

export default HomeScreen;