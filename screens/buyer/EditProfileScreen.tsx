
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { City, District } from '../../types';
import Spinner from '../../components/Spinner';
import Message from '../../components/Message';

interface EditProfileScreenProps {
    onProfileUpdated: () => void;
    onBack: () => void;
}

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ onProfileUpdated, onBack }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        whatsapp_number: user?.whatsapp_number || '',
        city_id: user?.city_id?.toString() || '',
        district_id: user?.district_id?.toString() || '',
        address_street: user?.address_street || '',
        address_number: user?.address_number || '',
        address_nearby: user?.address_nearby || '',
    });
    const [cities, setCities] = useState<City[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    // Fetch initial data (cities, and districts for the user's city)
    useEffect(() => {
        const loadInitialData = async () => {
            const citiesResponse = await apiFetch<any>('/cities');
            if (citiesResponse.ok) {
                setCities((citiesResponse.data as any).data);
            }

            if (user?.city_id) {
                const districtsResponse = await apiFetch<any>(`/districts/city/${user.city_id}`);
                if (districtsResponse.ok) {
                    setDistricts((districtsResponse.data as any).districts);
                }
            }
        };
        loadInitialData();
    }, [user?.city_id]);

    const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityId = e.target.value;
        setFormData(prev => ({ ...prev, city_id: cityId, district_id: '' }));
        setDistricts([]);
        if (cityId) {
            const { ok, data } = await apiFetch<any>(`/districts/city/${cityId}`);
            if (ok) setDistricts((data as any).districts);
        }
    };
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const { ok, data } = await apiFetch('/user/me', {
            method: 'PUT',
            body: JSON.stringify(formData)
        });

        if (ok) {
            setMessage({ text: 'Profile updated successfully!', type: 'success' });
            setTimeout(onProfileUpdated, 1500);
        } else {
            setMessage({ text: (data as any).message || 'Failed to update profile.', type: 'error' });
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center mb-6">
                 <button onClick={onBack} className="text-gray-400 hover:text-white mr-4">
                    <i className="fas fa-arrow-left fa-lg"></i>
                </button>
                <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                 <input type="text" name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none" />
                 <input type="tel" name="whatsapp_number" placeholder="WhatsApp Number" value={formData.whatsapp_number} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none" />
                 
                 <hr className="border-gray-700" />
                 <h2 className="text-lg font-semibold text-orange-500 pt-2">Delivery Address</h2>

                 <select name="city_id" value={formData.city_id} onChange={handleCityChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none">
                     <option value="">Select Your City</option>
                     {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                 <select name="district_id" value={formData.district_id} onChange={handleChange} required disabled={!formData.city_id} className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none disabled:opacity-50">
                     <option value="">Select Your District</option>
                     {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                 </select>
                 <input type="text" name="address_street" placeholder="Street Name" value={formData.address_street} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none"/>
                 <input type="text" name="address_number" placeholder="House/Apt Number" value={formData.address_number} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none"/>
                 <input type="text" name="address_nearby" placeholder="Reference Point (optional)" value={formData.address_nearby} onChange={handleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none"/>
                
                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onBack} className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded transition-colors">
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

export default EditProfileScreen;
