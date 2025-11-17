
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services';
import { Store, User, FyVideo } from '../../types';
import Spinner from '../../components/Spinner';

interface FyManagementScreenProps {
    store: Store;
    user: User;
    onAddVideoClick: () => void;
}

const FyManagementScreen: React.FC<FyManagementScreenProps> = ({ store, onAddVideoClick }) => {
    const [videos, setVideos] = useState<FyVideo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        const { ok, data } = await apiFetch<{ videos: FyVideo[] }>(`/fy/store/${store.id}`);
        if (ok) {
            setVideos((data as { videos: FyVideo[] }).videos);
        }
        setLoading(false);
    }, [store.id]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    const handleDelete = async (videoId: number) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this video?");
        if (confirmDelete) {
            const { ok } = await apiFetch(`/fy/${videoId}`, { method: 'DELETE' });
            if (ok) {
                fetchVideos(); // Refresh list after deleting
            } else {
                alert('Failed to delete video.');
            }
        }
    };

    if (loading) return <Spinner />;

    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Your 'Fy' Videos</h3>
                <button
                    onClick={onAddVideoClick}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                >
                    <i className="fas fa-plus mr-2"></i> Add Video
                </button>
            </div>
            {videos.length === 0 ? (
                <div className="text-center py-10 bg-gray-800 rounded-lg">
                    <i className="fas fa-video-slash text-4xl text-gray-600"></i>
                    <p className="mt-4 text-gray-400">You haven't uploaded any videos yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {videos.map(video => (
                        <div key={video.id} className="relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700 group">
                            <video src={video.video_url} className="w-full h-40 object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-2">
                                <p className="text-xs text-white truncate">{video.product_name || 'General promo'}</p>
                            </div>
                            <button
                                onClick={() => handleDelete(video.id)}
                                className="absolute top-1 right-1 bg-red-600/80 text-white rounded-full h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <i className="fas fa-trash-alt fa-xs"></i>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FyManagementScreen;
