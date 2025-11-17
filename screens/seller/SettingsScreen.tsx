import React, { useState } from 'react';
import { User } from '../../types';
import { apiFetch } from '../../services';
import Message from '../../components/Message';
import Spinner from '../../components/Spinner';


const BASE_URL = 'https://prp-jiww.onrender.com/api';

interface SettingsScreenProps {
    user: User;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ user }) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationMessage, setSimulationMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    
    const handleConnectMercadoPago = () => {
        const oauthUrl = `${BASE_URL}/mp/conectar-vendedor?seller_id=${user.id}`;
        // In a real mobile app, this would open a web browser view.
        // For this web-based simulation, window.open is appropriate.
        window.open(oauthUrl, '_blank');
    };

    const handleSimulatePayment = async () => {
        setIsSimulating(true);
        setSimulationMessage(null);

        const { ok, data } = await apiFetch('/mp/simular-pagamento', {
            method: 'POST',
            body: JSON.stringify({ seller_id: user.id }),
        });

        if (ok) {
            setSimulationMessage({ text: (data as any).message || 'Simulated payment successful! An order should be updated.', type: 'success' });
        } else {
            setSimulationMessage({ text: (data as any).message || 'Failed to simulate payment.', type: 'error' });
        }

        setIsSimulating(false);
    };


    return (
        <div className="p-4 space-y-6">
            <h3 className="text-xl font-bold text-white">Settings</h3>

            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h4 className="text-lg font-bold text-orange-500 mb-2">Payment Setup</h4>
                <p className="text-sm text-gray-400 mb-4">
                    To sell products and receive payments, you must connect your Mercado Pago account. This allows us to securely process payments and split the funds between you and the marketplace.
                </p>
                <button
                    onClick={handleConnectMercadoPago}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                    <i className="fas fa-link mr-2"></i> Connect with Mercado Pago
                </button>

                {/* New Section for Simulated Payment */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <h5 className="text-md font-semibold text-yellow-400 mb-2">For Testing Only</h5>
                    <p className="text-xs text-gray-400 mb-3">
                        Use this button to simulate a successful payment for one of your pending orders. This is a developer tool to test the order flow without making a real payment.
                    </p>
                    <button
                        onClick={handleSimulatePayment}
                        disabled={isSimulating}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:bg-teal-800 h-10"
                    >
                        {isSimulating ? <Spinner size="sm" /> : <><i className="fas fa-vial mr-2"></i> Simulate Payment</>}
                    </button>
                    {simulationMessage && (
                        <div className="mt-3">
                            <Message text={simulationMessage.text} type={simulationMessage.type} />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Placeholder for other settings */}
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                 <h4 className="text-lg font-bold text-orange-500 mb-2">Notifications</h4>
                 <p className="text-sm text-gray-400">Notification settings coming soon.</p>
            </div>
        </div>
    );
};

export default SettingsScreen;