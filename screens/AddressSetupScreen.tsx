
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services';
import { City, District } from '../types';
import Spinner from '../components/Spinner';
import Message from '../components/Message';

interface AddressSetupProps {
    onSetupComplete: () => void;
}

const AddressSetupScreen: React.FC<AddressSetupProps> = ({ onSetupComplete }) => {
    const [cities, setCities] = useState<City[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);
    const [formData, setFormData] = useState({ city_id: '', district_id: '', address_street: '', address_number: '', address_nearby: '', whatsapp_number: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const loadCities = async () => {
            const { ok, data } = await apiFetch<any>('/cities');
            if (ok) setCities((data as any).data);
        };
        loadCities();
    }, []);

    const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const cityId = e.target.value;
        setFormData(prev => ({ ...prev, city_id: cityId, district_id: '' }));
        setDistricts([]);
        if (cityId) {
            const { ok, data } = await apiFetch<any>(`/districts/city/${cityId}`);
            if (ok) setDistricts((data as any).districts);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        const { ok, data } = await apiFetch('/user/address', {
            method: 'PUT',
            body: JSON.stringify(formData)
        });
        if (ok) {
            setMessage({ text: 'Address saved! Welcome to aldeify.', type: 'success' });
            setTimeout(onSetupComplete, 1500);
        } else {
            setMessage({ text: (data as any).message, type: 'error' });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-900 p-4 text-white flex items-center justify-center">
             <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-2xl border border-teal-500/30">
                <h1 className="text-2xl text-teal-400 font-bold mb-4">Complete Your Profile</h1>
                <p className="text-gray-400 mb-6">Your delivery address and contact are required to start shopping.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select name="city_id" value={formData.city_id} onChange={handleCityChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-teal-500 focus:outline-none">
                        <option value="">Select Your City</option>
                        {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select name="district_id" value={formData.district_id} onChange={handleChange} required disabled={!formData.city_id} className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-teal-500 focus:outline-none disabled:opacity-50">
                        <option value="">Select Your District</option>
                        {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <input type="text" name="address_street" placeholder="Street Name" value={formData.address_street} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-teal-500 focus:outline-none"/>
                    <input type="text" name="address_number" placeholder="House/Apt Number" value={formData.address_number} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-teal-500 focus:outline-none"/>
                    <input type="text" name="address_nearby" placeholder="Reference Point (optional)" value={formData.address_nearby} onChange={handleChange} className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-teal-500 focus:outline-none"/>
                    <input type="tel" name="whatsapp_number" placeholder="WhatsApp Number (e.g., 55119...)" value={formData.whatsapp_number} onChange={handleChange} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-teal-500 focus:outline-none"/>
                    <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition-colors disabled:bg-teal-800">
                        {loading ? <Spinner size="sm" /> : 'Save and Continue'}
                    </button>
                </form>
                 {message && <Message text={message.text} type={message.type} />}
            </div>
        </div>
    );
};

export default AddressSetupScreen;
