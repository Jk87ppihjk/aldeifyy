
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services';
import { Order } from '../../types';
import Spinner from '../../components/Spinner';
import Message from '../../components/Message';

interface MyOrdersScreenProps {
    onBack: () => void;
}

const MyOrdersScreen: React.FC<MyOrdersScreenProps> = ({ onBack }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            const { ok, data } = await apiFetch<any>('/delivery/orders/mine');
            if (ok && (data as any).success) {
                setOrders((data as any).orders);
            } else {
                setError((data as any).message || 'Failed to load orders.');
            }
            setLoading(false);
        };
        fetchOrders();
    }, []);

    const getStatusColor = (status: Order['status']) => {
        switch(status) {
            case 'Processing': return 'text-blue-400 border-blue-500/50';
            case 'Delivering': return 'text-orange-400 border-orange-500/50';
            case 'Completed': return 'text-green-400 border-green-500/50';
            case 'Pending Payment': return 'text-yellow-400 border-yellow-500/50';
            default: return 'text-gray-400 border-gray-500/50';
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center mb-6">
                 <button onClick={onBack} className="text-gray-400 hover:text-white mr-4">
                    <i className="fas fa-arrow-left fa-lg"></i>
                </button>
                <h1 className="text-3xl font-bold text-white">My Orders</h1>
            </div>

            {loading && <Spinner />}
            {error && <Message text={error} type="error" />}

            {!loading && !error && (
                orders.length === 0 ? (
                    <div className="text-center py-10">
                        <i className="fas fa-receipt text-6xl text-gray-700 mb-4"></i>
                        <p className="text-gray-400">You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <div key={order.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-white">Order #{order.id}</p>
                                        <p className="text-sm text-gray-400">from {order.store_name}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(order.status)} bg-gray-900/50`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-300 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Date:</span>
                                        <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total:</span>
                                        <span className="font-bold text-teal-400">R$ {Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                </div>
                                {order.tracking_message && (
                                     <div className="mt-3 pt-3 border-t border-gray-700">
                                         <p className="text-xs text-teal-300 italic">{order.tracking_message}</p>
                                     </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};

export default MyOrdersScreen;