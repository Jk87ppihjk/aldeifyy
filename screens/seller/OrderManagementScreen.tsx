
import React, { useState, useEffect, useCallback } from 'react';
import { Store, Order, OrderDetail } from '../../types';
import { apiFetch } from '../../services';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import Message from '../../components/Message';

const OrderManagementScreen: React.FC<{ store: Store }> = ({ store }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrderDetail | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [pickupCode, setPickupCode] = useState('');
    const [actionMessage, setActionMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const { ok, data } = await apiFetch<any>(`/delivery/orders/store/${store.id}`);
        if (ok && (data as any).success) {
            setOrders((data as any).orders);
        }
        setLoading(false);
    }, [store.id]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'Processing': return 'bg-blue-600/50 text-blue-300 border-blue-500/50';
            case 'Delivering': return 'bg-orange-600/50 text-orange-300 border-orange-500/50';
            case 'Completed': return 'bg-green-600/50 text-green-300 border-green-500/50';
            default: return 'bg-gray-600/50 text-gray-300 border-gray-500/50';
        }
    };

    const handleViewDetails = async (order: Order) => {
        setIsModalOpen(true);
        setIsLoadingDetails(true);
        setSelectedOrderDetails(null);
        setActionMessage(null);
        setPickupCode('');

        const { ok, data } = await apiFetch<any>(`/delivery/orders/${order.id}/details`);
        if (ok && (data as any).success) {
            setSelectedOrderDetails((data as any).order);
        } else {
            console.error("Failed to fetch order details");
            setActionMessage({ text: 'Failed to fetch order details.', type: 'error' });
        }
        setIsLoadingDetails(false);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrderDetails(null);
    };

    const performAction = async (promise: Promise<any>, successMessage: string) => {
        setIsLoadingDetails(true);
        setActionMessage(null);
        const { ok, data } = await promise;
        if (ok) {
            setActionMessage({ text: successMessage, type: 'success' });
            fetchOrders();
            setTimeout(handleCloseModal, 1500);
        } else {
            setActionMessage({ text: (data as any).message || 'Action failed.', type: 'error' });
        }
        setIsLoadingDetails(false);
    };

    const handleDispatch = (orderId: number) => {
        performAction(
            apiFetch(`/delivery/orders/${orderId}/dispatch`, { method: 'PUT' }),
            'Order dispatched for self-delivery!'
        );
    };

    const handleRequestMethod = (orderId: number, method: 'Marketplace' | 'Contracted') => {
        performAction(
            apiFetch(`/delivery/orders/${orderId}/delivery-method`, { method: 'PUT', body: JSON.stringify({ method }) }),
            `Delivery requested via ${method}!`
        );
    };

    const handleConfirmPickup = (orderId: number) => {
        if (!pickupCode) {
            setActionMessage({ text: 'Pickup code is required.', type: 'error' });
            return;
        }
        performAction(
            apiFetch(`/delivery/orders/${orderId}/confirm-pickup`, { method: 'PUT', body: JSON.stringify({ pickup_code: pickupCode }) }),
            'Handover confirmed!'
        );
    };

    if (loading) return <Spinner />;

    return (
        <div className="p-4 space-y-3">
            <h3 className="text-xl font-bold text-white">Incoming Orders</h3>
            {orders.length === 0 ? (
                <div className="text-center py-10 bg-gray-800 rounded-lg">
                    <i className="fas fa-receipt text-4xl text-gray-600"></i>
                    <p className="mt-4 text-gray-400">You have no orders yet.</p>
                </div>
            ) : (
                orders.map(o => (
                    <div key={o.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-bold text-white">Order #{o.id}</p>
                                <p className="text-xs text-gray-400">from {o.buyer_name}</p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(o.status)}`}>{o.status}</span>
                        </div>
                        <p className="text-sm text-gray-300">Total: <span className="text-green-400 font-semibold text-base">R$ {Number(o.total_amount).toFixed(2)}</span></p>
                        <p className="text-xs text-gray-500 mt-2">{new Date(o.created_at).toLocaleString()}</p>
                        <button onClick={() => handleViewDetails(o)} className="text-teal-400 hover:text-teal-300 mt-3 text-sm font-semibold w-full text-left">
                            View Details &rarr;
                        </button>
                    </div>
                ))
            )}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Order #${selectedOrderDetails?.id || ''}`}>
                {isLoadingDetails && !actionMessage ? (
                    <Spinner />
                ) : selectedOrderDetails ? (
                    <div className="text-gray-300 text-sm space-y-4">
                        {actionMessage && <Message text={actionMessage.text} type={actionMessage.type} />}

                        <div>
                            <h4 className="font-bold text-orange-400 mb-2">Customer Details</h4>
                            <p><strong>Name:</strong> {selectedOrderDetails.buyer.full_name}</p>
                            <p><strong>WhatsApp:</strong> {selectedOrderDetails.buyer.whatsapp_number}</p>
                            <p><strong>Address:</strong> {`${selectedOrderDetails.buyer.address_street}, ${selectedOrderDetails.buyer.address_number}, ${selectedOrderDetails.buyer.district_name}, ${selectedOrderDetails.buyer.city_name}`}</p>
                            {selectedOrderDetails.buyer.address_nearby && <p><strong>Reference:</strong> {selectedOrderDetails.buyer.address_nearby}</p>}
                        </div>

                        <div>
                            <h4 className="font-bold text-orange-400 mb-2">Items Ordered</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                {selectedOrderDetails.items.map(item => (
                                    <div key={item.product_id} className="flex gap-3 bg-gray-700/50 p-2 rounded-md">
                                        <img src={item.image_url} alt={item.product_name} className="w-12 h-12 rounded-md object-cover" />
                                        <div>
                                            <p className="font-semibold text-white">{item.qty}x {item.product_name}</p>
                                            <p className="text-xs text-gray-400">{Object.values(item.options).join(', ')}</p>
                                        </div>
                                        <p className="ml-auto font-semibold text-teal-400">R${(item.price * item.qty).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t border-gray-600 pt-3">
                            <div className="flex justify-between font-bold text-base">
                                <span>Total:</span>
                                <span className="text-teal-300">R$ {Number(selectedOrderDetails.total_amount).toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-600 pt-3 space-y-2">
                            <h4 className="font-bold text-orange-400 mb-2">Actions</h4>
                            {selectedOrderDetails.status === 'Processing' && (
                                <div className="space-y-2">
                                    <button onClick={() => handleDispatch(selectedOrderDetails.id)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors" disabled={isLoadingDetails}>
                                        Dispatch (Self-Delivery)
                                    </button>
                                    <button onClick={() => handleRequestMethod(selectedOrderDetails.id, 'Marketplace')} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition-colors" disabled={isLoadingDetails}>
                                        Request Marketplace Delivery
                                    </button>
                                </div>
                            )}
                            {selectedOrderDetails.status === 'Delivering' && selectedOrderDetails.delivery_method === 'Marketplace' && selectedOrderDetails.delivery_status === 'Accepted' && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Enter the code from the delivery person to confirm package handover.</p>
                                    <input
                                        type="text"
                                        placeholder="Enter Pickup Code"
                                        value={pickupCode}
                                        onChange={(e) => setPickupCode(e.target.value.toUpperCase())}
                                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                                    />
                                    <button onClick={() => handleConfirmPickup(selectedOrderDetails.id)} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors" disabled={isLoadingDetails}>
                                        Confirm Handover
                                    </button>
                                </div>
                            )}
                             {['Completed', 'Cancelled', 'Pending Payment'].includes(selectedOrderDetails.status) || (selectedOrderDetails.status === 'Delivering' && selectedOrderDetails.delivery_method !== 'Marketplace') || (selectedOrderDetails.status === 'Delivering' && selectedOrderDetails.delivery_status === 'PickedUp') ? (
                                <p className="text-center text-gray-500 italic">No actions available for status "{selectedOrderDetails.status}".</p>
                             ) : null}
                        </div>
                    </div>
                ) : (
                    !actionMessage && <p className="text-red-400 text-center">Could not load order details. Please try again.</p>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagementScreen;