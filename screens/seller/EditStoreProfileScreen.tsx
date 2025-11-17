
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services';
import { Store, Category, City, District } from '../../types';
import Spinner from '../../components/Spinner';
import Message from '../../components/Message';

interface EditStoreProfileScreenProps {
    store: Store;
    onStoreUpdate: () => void;
    onCancel: () => void;
}

const ImageInput: React.FC<{
    label: string;
    currentImageUrl: string;
    onFileChange: (file: File) => void;
    preview: string | null;
}> = ({ label, currentImageUrl, onFileChange, preview }) => {
    const id = `file-upload-${label.toLowerCase().replace(' ', '-')}`;
    return (
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
            <div className="flex items-center gap-4">
                <img src={preview || currentImageUrl} alt={`${label} Preview`} className="w-20 h-20 object-cover rounded-lg bg-gray-700" />
                <label htmlFor={id} className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg border border-gray-500 transition-colors">
                    Change Image
                </label>
                <input id={id} type="file" className="sr-only" accept="image/png, image/jpeg" onChange={(e) => e.target.files && onFileChange(e.target.files[0])} />
            </div>
        </div>
    );
};

const EditStoreProfileScreen: React.FC<EditStoreProfileScreenProps> = ({ store, onStoreUpdate, onCancel }) => {
    const [formData, setFormData] = useState({
        name: store.name,
        bio: store.bio || '',
        whatsapp_number: store.whatsapp_number,
        address_street: store.address_street,
        address_number: store.address_number,
        address_nearby: store.address_nearby || '',
        category_id: store.category_id.toString(),
        city_id: store.city_id.toString(),
        district_id: store.district_id.toString(),
    });
    const [categories, setCategories] = useState<Category[]>([]);
    const [cities, setCities] = useState<City[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

     useEffect(() => {
        const loadDropdownData = async () => {
            const [catRes, cityRes] = await Promise.all([
                apiFetch<any>('/categories'),
                apiFetch<any>('/cities'),
            ]);
            if (catRes.ok) setCategories((catRes.data as any).categories);
            if (cityRes.ok) setCities((cityRes.data as any).data);

            if (store.city_id) {
                const distRes = await apiFetch<any>(`/districts/city/${store.city_id}`);
                if (distRes.ok) setDistricts((distRes.data as any).districts);
            }
        };
        loadDropdownData();
    }, [store.city_id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

     const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityId = e.target.value;
        setFormData(prev => ({ ...prev, city_id: cityId, district_id: '' }));
        setDistricts([]);
        if (cityId) {
            const { ok, data } = await apiFetch<any>(`/districts/city/${cityId}`);
            if (ok) setDistricts((data as any).districts);
        }
    };

    const handleFileChange = (setter: (file: File) => void, previewSetter: (url: string) => void) => (file: File) => {
        setter(file);
        previewSetter(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (
            !formData.name.trim() ||
            !formData.category_id ||
            !formData.whatsapp_number.trim() ||
            !formData.city_id ||
            !formData.district_id ||
            !formData.address_street.trim() ||
            !formData.address_number.trim()
        ) {
            setMessage({
                text: 'Name, Category, Address (Street, Number, City, District) and WhatsApp are required.',
                type: 'error',
            });
            return;
        }
        
        setLoading(true);

        try {
            let logoUrl = store.logo_url;
            let bannerUrl = store.banner_url;

            const uploadFile = async (file: File) => {
                const mediaFormData = new FormData();
                mediaFormData.append('media_file', file);
                const res = await apiFetch<{ url: string }>('/upload/media', { method: 'POST', body: mediaFormData });
                if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
                return (res.data as { url: string }).url;
            };

            if (logoFile) logoUrl = await uploadFile(logoFile);
            if (bannerFile) bannerUrl = await uploadFile(bannerFile);

            const payload = { ...formData, logo_url: logoUrl, banner_url: bannerUrl };

            const { ok, data } = await apiFetch(`/stores/${store.id}`, {
                method: 'PUT',
                body: JSON.stringify(payload),
            });

            if (ok) {
                setMessage({ text: 'Store updated successfully!', type: 'success' });
                setTimeout(onStoreUpdate, 1500);
            } else {
                throw new Error((data as any).message || 'Failed to update store.');
            }

        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' });
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center mb-6">
                <button onClick={onCancel} className="text-gray-400 hover:text-white mr-4">
                    <i className="fas fa-arrow-left fa-lg"></i>
                </button>
                <h2 className="text-xl font-bold text-white">Edit Store Profile</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <ImageInput label="Logo" currentImageUrl={store.logo_url} onFileChange={handleFileChange(setLogoFile, setLogoPreview)} preview={logoPreview} />
                <ImageInput label="Banner" currentImageUrl={store.banner_url} onFileChange={handleFileChange(setBannerFile, setBannerPreview)} preview={bannerPreview} />
                
                <hr className="border-gray-700" />
                
                <input type="text" name="name" placeholder="Store Name" value={formData.name} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none" />
                <textarea name="bio" placeholder="Store Bio (Optional)" value={formData.bio} onChange={handleChange} rows={3} className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none"></textarea>
                 <select name="category_id" value={formData.category_id} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none">
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="tel" name="whatsapp_number" placeholder="WhatsApp Number" value={formData.whatsapp_number} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none" />
                
                <hr className="border-gray-700" />
                <h3 className="text-lg font-semibold text-orange-500 pt-2">Store Address</h3>

                <select name="city_id" value={formData.city_id} onChange={handleCityChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none">
                    <option value="">Select City</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select name="district_id" value={formData.district_id} onChange={handleChange} required disabled={!formData.city_id} className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none disabled:opacity-50">
                    <option value="">Select Neighborhood</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="text" name="address_street" placeholder="Street" value={formData.address_street} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none" />
                <input type="text" name="address_number" placeholder="Number" value={formData.address_number} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none" />
                <input type="text" name="address_nearby" placeholder="Nearby Reference (Optional)" value={formData.address_nearby} onChange={handleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none" />
                
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded transition-colors disabled:bg-orange-800">
                        {loading ? <Spinner size="sm" /> : 'Save Changes'}
                    </button>
                </div>
            </form>
            {message && <Message text={message.text} type={message.type} />}
        </div>
    );
};

export default EditStoreProfileScreen;
