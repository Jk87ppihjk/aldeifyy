
import React, { useState, useEffect } from 'react';
import { Product, Attribute } from '../../types';
import { apiFetch } from '../../services';
import { useCart } from '../../contexts/CartContext';
import Spinner from '../../components/Spinner';
import Message from '../../components/Message';

interface ProductDetailScreenProps {
    productId: number;
    onBack: () => void;
}

const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ productId, onBack }) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();
    const [addedMessage, setAddedMessage] = useState(false);

    useEffect(() => {
        const fetchProductAndAttributes = async () => {
            setLoading(true);
            setError(null);
            
            // Fetch product details
            const productResponse = await apiFetch<{ product: Product }>(`/products/${productId}`);
            if (!productResponse.ok) {
                setError((productResponse.data as { message: string }).message);
                setLoading(false);
                return;
            }
            
            const fetchedProduct = (productResponse.data as { product: Product }).product;
            setProduct(fetchedProduct);

            // If product has a subcategory, fetch its attributes for selection
            if (fetchedProduct.subcategory_id) {
                const attributesResponse = await apiFetch<any>(`/attributes/${fetchedProduct.subcategory_id}`);
                if (attributesResponse.ok && (attributesResponse.data as any).success) {
                    const fetchedAttributes: Attribute[] = (attributesResponse.data as any).attributes;
                    setAttributes(fetchedAttributes);
                    // Pre-fill selectedOptions with the first option for each attribute
                    const defaultOptions: Record<string, string> = {};
                    fetchedAttributes.forEach(attr => {
                        if (attr.options) {
                            defaultOptions[attr.name] = attr.options.split(',')[0];
                        }
                    });
                    setSelectedOptions(defaultOptions);
                }
            }
            
            setLoading(false);
        };
        fetchProductAndAttributes();
    }, [productId]);
    
    const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedOptions(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart({
                product_id: product.id,
                qty: quantity,
                options: selectedOptions,
                name: product.name,
                price: Number(product.price),
                image_url: product.image_url,
                stock_quantity: product.stock_quantity
            });
            setAddedMessage(true);
            setTimeout(() => setAddedMessage(false), 2000);
        }
    };

    if (loading) return <div className="p-4"><Spinner /></div>;
    if (error) return <div className="p-4"><Message text={error} type="error" /></div>;
    if (!product) return null;
    
    const staticAttributes: Record<string, string> = product.attributes_data ? JSON.parse(product.attributes_data) : {};

    return (
        <div>
            <div className="relative">
                <img src={product.image_url || `https://picsum.photos/seed/${product.id}/400/300`} alt={product.name} className="w-full h-64 object-cover" />
                <button onClick={onBack} className="absolute top-4 left-4 bg-black/50 text-white rounded-full h-10 w-10 flex items-center justify-center">
                    <i className="fas fa-arrow-left"></i>
                </button>
            </div>
            <div className="p-4">
                <p className="text-sm font-semibold text-orange-500">{product.store_name}</p>
                <h1 className="text-3xl font-bold text-white my-2">{product.name}</h1>
                <p className="text-3xl font-bold text-teal-400 mb-4">R${Number(product.price).toFixed(2)}</p>
                <p className="text-gray-400 leading-relaxed">{product.description}</p>
                
                {attributes.filter(attr => attr.options).length > 0 && (
                    <div className="mt-6 space-y-4">
                        {attributes.filter(attr => attr.options).map(attr => (
                            <div key={attr.id}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{attr.name}</label>
                                <select 
                                    name={attr.name} 
                                    value={selectedOptions[attr.name] || ''} 
                                    onChange={handleOptionChange}
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none"
                                >
                                    {attr.options?.split(',').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                )}
                
                {Object.keys(staticAttributes).length > 0 && (
                     <div className="mt-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
                        <div className="bg-gray-800 p-3 rounded-lg space-y-2">
                        {Object.entries(staticAttributes).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-400">{key}:</span>
                                <span className="font-medium text-white">{value}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 flex items-center gap-4">
                     <div className="flex items-center border border-gray-600 rounded-lg">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3 text-white"><i className="fas fa-minus"></i></button>
                        <span className="px-4 py-3 text-lg font-bold text-white">{quantity}</span>
                        <button onClick={() => setQuantity(q => q + 1)} className="px-4 py-3 text-white"><i className="fas fa-plus"></i></button>
                    </div>
                    <button onClick={handleAddToCart} className="flex-grow bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        Add to Cart
                    </button>
                </div>
                {addedMessage && <Message text={`${quantity} × ${product.name} added to cart!`} type="success" />}
            </div>
        </div>
    );
};

export default ProductDetailScreen;
