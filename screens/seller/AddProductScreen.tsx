import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services';
import { Category, Subcategory, Store, Attribute } from '../../types';
import Spinner from '../../components/Spinner';
import Message from '../../components/Message';

interface AddProductScreenProps {
    store: Store;
    onProductAdded: () => void;
    onCancel: () => void;
}

const AddProductScreen: React.FC<AddProductScreenProps> = ({ store, onProductAdded, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock_quantity: '',
        category_id: '',
        subcategory_id: '',
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [attributes, setAttributes] = useState<Attribute[]>([]);
    const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingAttributes, setLoadingAttributes] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            const { ok, data } = await apiFetch<any>('/categories');
            if (ok && (data as any).success) {
                setCategories((data as any).categories);
            } else {
                setMessage({ text: 'Could not load categories.', type: 'error' });
            }
        };
        fetchCategories();
    }, []);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const catId = e.target.value;
        setFormData(prev => ({ ...prev, category_id: catId, subcategory_id: '' }));
        setSubcategories([]);
        setAttributes([]);
        setAttributeValues({});
        if (catId) {
            const { ok, data } = await apiFetch<any>(`/subcategories/${catId}`);
            if (ok && (data as any).success) {
                setSubcategories((data as any).subcategories);
            }
        }
    };

    const handleSubcategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subcatId = e.target.value;
        setFormData(prev => ({ ...prev, subcategory_id: subcatId }));
        setAttributes([]);
        setAttributeValues({});
        if (subcatId) {
            setLoadingAttributes(true);
            const { ok, data } = await apiFetch<any>(`/attributes/${subcatId}`);
            if (ok && (data as any).success) {
                setAttributes((data as any).attributes);
            } else {
                setMessage({ text: 'Could not load attributes for this subcategory.', type: 'error' });
            }
            setLoadingAttributes(false);
        }
    };
    
    const handleAttributeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setAttributeValues(prev => ({...prev, [name]: value}));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) {
            setMessage({ text: 'Please select a product image.', type: 'error' });
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            // Step 1: Upload the image to Cloudinary via our backend
            const imageFormData = new FormData();
            imageFormData.append('media_file', imageFile);

            const uploadResponse = await apiFetch<{ url: string }>('/upload/media', {
                method: 'POST',
                body: imageFormData,
            });

            if (!uploadResponse.ok) {
                throw new Error((uploadResponse.data as any).message || 'Failed to upload image.');
            }
            
            const imageUrl = (uploadResponse.data as { url: string }).url;

            // Step 2: Create the product with the returned image URL
            const productPayload = {
                name: formData.name,
                description: formData.description,
                price: formData.price,
                stock_quantity: formData.stock_quantity,
                subcategory_id: formData.subcategory_id,
                image_url: imageUrl,
                attributes_data: attributeValues,
            };

            const productResponse = await apiFetch('/products', {
                method: 'POST',
                body: JSON.stringify(productPayload),
            });

            if (productResponse.ok) {
                setMessage({ text: 'Product added successfully!', type: 'success' });
                setTimeout(onProductAdded, 1500);
            } else {
                throw new Error((productResponse.data as any).message || 'An error occurred while creating the product.');
            }

        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center mb-6">
                 <button onClick={onCancel} className="text-gray-400 hover:text-white mr-4">
                    <i className="fas fa-arrow-left fa-lg"></i>
                </button>
                <h2 className="text-xl font-bold text-white">Add a New Product</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <input type="text" name="name" placeholder="Product Name" value={formData.name} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none transition-colors" />
                 <textarea name="description" placeholder="Product Description" value={formData.description} onChange={handleChange} required rows={3} className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none transition-colors"></textarea>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Product Image</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Product preview" className="mx-auto h-24 w-24 object-cover rounded-md"/>
                            ) : (
                                <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            )}
                            <div className="flex text-sm text-gray-400 justify-center">
                                <label htmlFor="image-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-orange-500 hover:text-orange-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-orange-500 px-1">
                                    <span>Upload a file</span>
                                    <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleImageChange} required/>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500">PNG or JPG</p>
                        </div>
                    </div>
                </div>

                 <div className="flex gap-4">
                    <input type="number" name="price" placeholder="Price (R$)" value={formData.price} onChange={handleChange} required className="w-1/2 p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none transition-colors" step="0.01" />
                    <input type="number" name="stock_quantity" placeholder="Stock" value={formData.stock_quantity} onChange={handleChange} required className="w-1/2 p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none transition-colors" />
                 </div>
                 <select name="category_id" value={formData.category_id} onChange={handleCategoryChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none">
                     <option value="">-- Select Category --</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                 <select name="subcategory_id" value={formData.subcategory_id} onChange={handleSubcategoryChange} required disabled={!formData.category_id} className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none disabled:opacity-50">
                     <option value="">-- Select Subcategory --</option>
                     {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>

                 {loadingAttributes && <div className="py-4"><Spinner size="sm" /></div>}

                 {attributes.length > 0 && !loadingAttributes && (
                    <div className="p-4 border border-dashed border-gray-600 rounded-lg space-y-4">
                        <h3 className="text-lg font-semibold text-teal-400">Product Specifics</h3>
                        {attributes.map(attr => (
                            <div key={attr.id}>
                                <label htmlFor={`attr-${attr.id}`} className="block text-sm font-medium text-gray-300 mb-2">{attr.name}</label>
                                <input
                                    type="text"
                                    id={`attr-${attr.id}`}
                                    name={attr.name}
                                    value={attributeValues[attr.name] || ''}
                                    onChange={handleAttributeChange}
                                    required
                                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none transition-colors"
                                    placeholder={`Enter ${attr.name}`}
                                />
                            </div>
                        ))}
                    </div>
                 )}

                 <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition-transform duration-150 ease-in-out hover:scale-105 disabled:bg-orange-800 disabled:cursor-not-allowed">
                    {loading ? <Spinner size="sm" /> : 'Add Product'}
                </button>
            </form>
            {message && <Message text={message.text} type={message.type} />}
        </div>
    );
};

export default AddProductScreen;