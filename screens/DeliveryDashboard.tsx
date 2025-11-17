
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services';
import { DeliveryJob, CurrentDelivery } from '../types';
import Spinner from '../components/Spinner';
import Message from '../components/Message';

const DeliveryDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const [view, setView] = useState<'loading' | 'available' | 'current'>('loading');
    const [jobs, setJobs] = useState<DeliveryJob[]>([]);
    const [currentDelivery, setCurrentDelivery] = useState<CurrentDelivery | null>(null);
    const [confirmationCode, setConfirmationCode] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchCurrentDelivery = useCallback(async () => {
        setView('loading');
        const { ok, data } = await apiFetch<{ delivery: CurrentDelivery | null }>('/delivery/current');
        if (ok) {
            const deliveryData = (data as { delivery: CurrentDelivery | null }).delivery;
            if (deliveryData) {
                setCurrentDelivery(deliveryData);
                setView('current');
            } else {
                setCurrentDelivery(null);
                fetchAvailableJobs(); // No current job, so look for new ones
            }
        } else {
            setMessage({ text: (data as any).message || 'Failed to fetch current job.', type: 'error' });
            setView('available');
        }
    }, []);

    const fetchAvailableJobs = async () => {
        setView('loading');
        const { ok, data } = await apiFetch<{ orders: DeliveryJob[] }>('/delivery/available');
        if (ok) {
            setJobs((data as { orders: DeliveryJob[] }).orders);
        } else {
            setMessage({ text: (data as any).message || 'Failed to fetch available jobs.', type: 'error' });
        }
        setView('available');
    };

    useEffect(() => {
        fetchCurrentDelivery();
    }, [fetchCurrentDelivery]);

    const handleAcceptJob = async (orderId: number) => {
        setIsSubmitting(true);
        setMessage(null);
        const { ok, data } = await apiFetch(`/delivery/accept/${orderId}`, { method: 'PUT' });
        if (ok) {
            setMessage({ text: 'Job accepted! Fetching details...', type: 'success' });
            setTimeout(fetchCurrentDelivery, 1500);
        } else {
            setMessage({ text: (data as any).message || 'Could not accept job.', type: 'error' });
        }
        setIsSubmitting(false);
    };

    const handleConfirmDelivery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentDelivery) return;
        setIsSubmitting(true);
        setMessage(null);

        const payload = {
            order_id: currentDelivery.order.id,
            confirmation_code: confirmationCode
        };

        const { ok, data } = await apiFetch('/delivery/confirm', { method: 'POST', body: JSON.stringify(payload) });
        if (ok) {
            setMessage({ text: 'Delivery confirmed! Well done.', type: 'success' });
            setConfirmationCode('');
            setTimeout(() => {
                setCurrentDelivery(null);
                fetchAvailableJobs();
            }, 2000);
        } else {
            setMessage({ text: (data as any).message || 'Confirmation failed.', type: 'error' });
        }
        setIsSubmitting(false);
    };

    const renderContent = () => {
        if (view === 'loading') {
            return <div className="mt-10"><Spinner /></div>;
        }

        if (view === 'current' && currentDelivery) {
            return (
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-teal-500">
                        <h3 className="text-lg font-bold text-teal-400 mb-2">Current Delivery: Order #{currentDelivery.order.id}</h3>
                        <div className="space-y-3">
                            <div>
                                <h4 className="font-semibold text-orange-400">1. Pickup from Store</h4>
                                <p className="text-sm">{currentDelivery.order.store_name}</p>
                                <p className="text-xs text-gray-400">{currentDelivery.order.store_address}</p>
                                <p className="text-sm mt-1"><strong>Pickup Code:</strong> <span className="font-mono text-lg text-yellow-300 bg-gray-700 px-2 py-1 rounded">{currentDelivery.delivery_pickup_code}</span></p>
                            </div>
                             <div>
                                <h4 className="font-semibold text-orange-400">2. Deliver to Customer</h4>
                                <p className="text-sm">{currentDelivery.order.buyer_name}</p>
                                <p className="text-xs text-gray-400">{currentDelivery.order.delivery_address}</p>
                            </div>
                        </div>
                    </div>
                     <form onSubmit={handleConfirmDelivery} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="font-bold text-white mb-2">Confirm Delivery</h3>
                        <p className="text-xs text-gray-400 mb-3">Enter the code provided by the customer to complete the job.</p>
                        <input 
                            type="text"
                            value={confirmationCode}
                            onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                            placeholder="Enter Confirmation Code"
                            required
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none transition-colors"
                        />
                        <button type="submit" disabled={isSubmitting} className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-green-800">
                            {isSubmitting ? <Spinner size="sm" /> : 'Complete Delivery'}
                        </button>
                    </form>
                </div>
            );
        }

        if (view === 'available') {
            return jobs.length > 0 ? (
                <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">Available Jobs</h3>
                    {jobs.map(job => (
                        <div key={job.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <p className="font-bold text-white">Delivery for {job.store_name}</p>
                            <p className="text-sm text-gray-300">To: {job.buyer_name}</p>
                            <p className="text-lg font-semibold text-teal-400 mt-2">R$ 5.00</p>
                            <button onClick={() => handleAcceptJob(job.id)} disabled={isSubmitting} className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-teal-800">
                                {isSubmitting ? <Spinner size="sm" /> : 'Accept Job'}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <i className="fas fa-motorcycle text-6xl text-gray-700"></i>
                    <p className="mt-4 text-gray-500">No available delivery jobs right now. Check back soon!</p>
                </div>
            );
        }

        return null;
    };


    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl text-teal-400 font-bold">Delivery Dashboard</h1>
                <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors">
                    <i className="fas fa-sign-out-alt fa-lg"></i>
                </button>
            </div>
            <div className="bg-gray-800 p-5 rounded-lg border border-teal-500/30 mb-6">
                <p className="text-lg">Welcome, <span className="font-bold text-teal-300">{user?.full_name}!</span></p>
                <p className="text-gray-400 text-sm mt-1">Your hub for finding and managing delivery jobs.</p>
            </div>
            {message && <div className="my-4"><Message text={message.text} type={message.type} /></div>}
            {renderContent()}
        </div>
    );
}

export default DeliveryDashboard;
