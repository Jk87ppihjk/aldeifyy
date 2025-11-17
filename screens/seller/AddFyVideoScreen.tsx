
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services';
import { Product } from '../../types';
import Spinner from '../../components/Spinner';
import Message from '../../components/Message';

interface AddFyVideoScreenProps {
    onVideoAdded: () => void;
    onCancel: () => void;
}

const AddFyVideoScreen: React.FC<AddFyVideoScreenProps> = ({ onVideoAdded, onCancel }) => {
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [linkedProductId, setLinkedProductId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        // Fetch seller's products to link to the video
        const fetchProducts = async () => {
            const token = localStorage.getItem('userToken');
            if (!token) return;
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            const sellerId = decodedToken.id;

            const { ok, data } = await apiFetch<any>(`/products/store/${sellerId}`);
            if (ok) {
                setProducts((data as any).products);
            }
        };
        fetchProducts();
    }, []);

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!videoFile) {
            setMessage({ text: 'Please select a video file.', type: 'error' });
            return;
        }
        setLoading(true);
        setMessage(null);

        try {
            // Step 1: Upload video file
            const videoFormData = new FormData();
            videoFormData.append('media_file', videoFile);
            const uploadRes = await apiFetch<{ url: string }>('/upload/media', { method: 'POST', body: videoFormData });
            if (!uploadRes.ok) throw new Error('Failed to upload video.');
            const video_url = (uploadRes.data as {url: string}).url;

            // Step 2: Create Fy video entry
            const payload = {
                video_url,
                product_id: linkedProductId ? parseInt(linkedProductId, 10) : null,
            };
            const fyRes = await apiFetch('/fy', { method: 'POST', body: JSON.stringify(payload) });
            if (!fyRes.ok) throw new Error((fyRes.data as any).message || 'Failed to create Fy entry.');
            
            setMessage({ text: 'Video uploaded successfully!', type: 'success' });
            setTimeout(onVideoAdded, 1500);

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
                <h2 className="text-xl font-bold text-white">Add New 'Fy' Video</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Video File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {videoPreview ? (
                                <video src={videoPreview} controls className="mx-auto h-40 rounded-md" />
                            ) : (
                                <i className="fas fa-video mx-auto h-12 w-12 text-gray-500"></i>
                            )}
                            <div className="flex text-sm text-gray-400 justify-center">
                                <label htmlFor="video-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-orange-500 hover:text-orange-400 p-1">
                                    <span>Upload a video</span>
                                    <input id="video-upload" name="video-upload" type="file" className="sr-only" accept="video/mp4, video/quicktime" onChange={handleVideoChange} required/>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                 <select
                    value={linkedProductId}
                    onChange={(e) => setLinkedProductId(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded text-white focus:border-orange-500 focus:outline-none"
                >
                    <option value="">Link to a product (Optional)</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded disabled:bg-orange-800">
                    {loading ? <Spinner size="sm" /> : 'Upload Video'}
                </button>
            </form>
             {message && <Message text={message.text} type={message.type} />}
        </div>
    );
};

export default AddFyVideoScreen;
