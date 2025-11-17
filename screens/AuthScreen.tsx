import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services';
import { City, AuthResponse } from '../types';
import Spinner from '../components/Spinner';
import Message from '../components/Message';

const AuthScreen: React.FC = () => {
    const { login } = useAuth();
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [city, setCity] = useState('');
    const [isSeller, setIsSeller] = useState(false);
    const [isDelivery, setIsDelivery] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const loadCities = async () => {
            const { ok, data } = await apiFetch<any>('/cities');
            if (ok && (data as any).success) {
                setCities((data as any).data);
            } else {
                setMessage({ text: 'Failed to load cities for registration.', type: 'error' });
            }
        };
        loadCities();
    }, []);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const endpoint = isLoginMode ? '/login' : '/register';
        let payload: any = { email, password };

        if (!isLoginMode) {
            if (isSeller && isDelivery) {
                setMessage({ text: 'Please choose only one role: Seller or Delivery Person.', type: 'error' });
                setLoading(false);
                return;
            }
            payload = { ...payload, full_name: fullName, city, is_seller: isSeller, is_delivery_person: isDelivery };
        } else {
             payload.city = city; // Login needs city too based on backend code
        }

        const { ok, data } = await apiFetch<AuthResponse>(endpoint, { method: 'POST', body: JSON.stringify(payload) });

        if (ok) {
            login(data as AuthResponse);
        } else {
            setMessage({ text: (data as any).message || 'An unknown error occurred.', type: 'error' });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl border border-orange-500/30">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-orange-500 mb-2 tracking-wide">aldeify</h1>
                    <h2 className="text-xl font-light text-gray-300 mb-8">
                        {isLoginMode ? 'Welcome Back' : 'Create Your Account'}
                    </h2>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                        <input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"/>
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                        <input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"/>
                    </div>
                    
                    {!isLoginMode && (
                        <>
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                                <input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors"/>
                            </div>
                             <div className="p-4 border border-dashed border-gray-600 rounded-lg">
                                <p className="text-teal-400 font-semibold mb-3 text-sm">Choose your primary role:</p>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <input type="checkbox" id="isSeller" checked={isSeller} onChange={e => { setIsSeller(e.target.checked); if(e.target.checked) setIsDelivery(false); }} className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500" />
                                        <label htmlFor="isSeller" className="ml-3 text-sm font-medium text-gray-200">I want to be a Seller</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input type="checkbox" id="isDelivery" checked={isDelivery} onChange={e => { setIsDelivery(e.target.checked); if(e.target.checked) setIsSeller(false); }} className="w-4 h-4 text-orange-600 bg-gray-700 border-gray-600 rounded focus:ring-orange-500" />
                                        <label htmlFor="isDelivery" className="ml-3 text-sm font-medium text-gray-200">I want to be a Delivery Person</label>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    
                    <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">Your City</label>
                         <select id="city" value={city} onChange={e => setCity(e.target.value)} required className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 focus:outline-none transition-colors">
                             <option value="" disabled>-- Select Your City --</option>
                             {cities.map(c => <option key={c.id} value={c.name}>{c.name} ({c.state_province})</option>)}
                         </select>
                    </div>

                    <div>
                        <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-4 focus:ring-orange-500/50 transition-all duration-150 ease-in-out hover:scale-[1.02] active:scale-100 disabled:bg-orange-900 disabled:hover:scale-100 disabled:cursor-not-allowed flex justify-center items-center h-12">
                            {loading ? <Spinner size="sm"/> : isLoginMode ? 'Login' : 'Create Account'}
                        </button>
                    </div>
                </form>

                {message && <Message text={message.text} type={message.type} />}

                <p className="text-center text-sm text-gray-400 mt-6">
                    {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => { setIsLoginMode(!isLoginMode); setMessage(null); }} className="font-semibold text-teal-400 hover:text-teal-300 ml-2 focus:outline-none focus:underline">
                        {isLoginMode ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthScreen;
