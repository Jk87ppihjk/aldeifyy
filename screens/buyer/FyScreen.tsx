import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../../services';
import { FyVideo, Comment } from '../../types';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';

const FyScreen: React.FC = () => {
    const [videos, setVideos] = useState<FyVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

    // State for comments modal
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [selectedVideoForComments, setSelectedVideoForComments] = useState<FyVideo | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState('');


    const fetchVideos = async () => {
        setLoading(true);
        const { ok, data } = await apiFetch<{ videos: FyVideo[] }>('/fy');
        if (ok) {
            setVideos((data as { videos: FyVideo[] }).videos);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const videoElement = entry.target as HTMLVideoElement;
                    if (entry.isIntersecting) {
                        const playPromise = videoElement.play();
                        if (playPromise !== undefined) {
                            playPromise.catch(error => {
                                if (error.name !== 'AbortError') {
                                    console.error("Video play failed:", error);
                                }
                            });
                        }
                    } else {
                        videoElement.pause();
                        videoElement.currentTime = 0; // Reset video on scroll away
                    }
                });
            },
            { threshold: 0.6 } // 60% of the video must be visible
        );

        const currentVideoRefs = videoRefs.current;
        currentVideoRefs.forEach(video => {
            if (video) observer.observe(video);
        });

        return () => {
            currentVideoRefs.forEach(video => {
                if (video) observer.unobserve(video);
            });
        };
    }, [videos]);

    const handleLikeToggle = async (videoId: number, index: number) => {
        const originalVideoState = { ...videos[index] };
        
        // Optimistic update
        setVideos(currentVideos => 
            currentVideos.map((video, i) => {
                if (i === index) {
                    return {
                        ...video,
                        user_has_liked: !video.user_has_liked,
                        likes_count: video.user_has_liked ? video.likes_count - 1 : video.likes_count + 1
                    };
                }
                return video;
            })
        );
        
        // API call
        const { ok } = await apiFetch(`/fy/${videoId}/like`, { method: 'POST' });

        // Revert if API call fails
        if (!ok) {
            setVideos(currentVideos => 
                currentVideos.map((video, i) => i === index ? originalVideoState : video)
            );
            alert("Failed to update like status. Please try again.");
        }
    };
    
    const handleOpenComments = async (video: FyVideo) => {
        setSelectedVideoForComments(video);
        setIsCommentModalOpen(true);
        setIsLoadingComments(true);
        const { ok, data } = await apiFetch<{ comments: Comment[] }>(`/fy/${video.id}/comments`);
        if (ok) {
            setComments((data as { comments: Comment[] }).comments);
        }
        setIsLoadingComments(false);
    };

    const handlePostComment = async () => {
        if (!newCommentText.trim() || !selectedVideoForComments) return;
        
        const { ok, data } = await apiFetch<{ comment: Comment }>(`/fy/${selectedVideoForComments.id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ comment_text: newCommentText })
        });

        if (ok) {
            const newComment = (data as { comment: Comment }).comment;
            setComments(prev => [...prev, newComment]);
            setNewCommentText('');
            // also update comment count on the main video list
            setVideos(videos.map(v => v.id === selectedVideoForComments.id ? {...v, comments_count: v.comments_count + 1} : v));
        } else {
            alert("Failed to post comment.");
        }
    };
    
    const handleShare = async (video: FyVideo) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out this video from ${video.store_name} on aldeify!`,
                    text: video.product_name || `Discover amazing products on aldeify.`,
                    url: window.location.href, // In a real app, this would be a deep link
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            alert('Sharing is not supported on this browser.');
        }
    };

    if (loading) {
        return <div className="h-screen flex items-center justify-center"><Spinner /></div>;
    }

    return (
        <>
            <div className="relative h-[calc(100vh-130px)] overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black">
                {videos.map((video, index) => (
                    <div key={video.id} className="h-full w-full snap-start relative flex items-center justify-center">
                        <video
                            ref={el => { videoRefs.current[index] = el; }}
                            src={video.video_url}
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                            {/* Bottom Info */}
                            <div className="absolute bottom-4 left-4">
                                <p className="font-bold drop-shadow-lg">{video.store_name}</p>
                                {video.product_name && <p className="text-sm drop-shadow-lg">{video.product_name}</p>}
                            </div>

                            {/* Side Actions */}
                            <div className="absolute bottom-4 right-4 flex flex-col items-center space-y-4">
                                <button onClick={() => handleLikeToggle(video.id, index)} className="flex flex-col items-center text-white">
                                    <i className={`${video.user_has_liked ? 'fa-solid' : 'fa-regular'} fa-heart text-3xl ${video.user_has_liked ? 'text-red-500' : ''}`}></i>
                                    <span className="text-xs font-semibold">{video.likes_count}</span>
                                </button>
                                <button onClick={() => handleOpenComments(video)} className="flex flex-col items-center text-white">
                                    <i className="fa-regular fa-comment-dots text-3xl"></i>
                                    <span className="text-xs font-semibold">{video.comments_count}</span>
                                </button>
                                <button onClick={() => handleShare(video)} className="flex flex-col items-center text-white">
                                    <i className="fa-regular fa-paper-plane text-3xl"></i>
                                    <span className="text-xs font-semibold">Share</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} title={`Comments for ${selectedVideoForComments?.store_name || ''}'s video`}>
                <div className="flex flex-col h-[60vh]">
                    <div className="flex-grow overflow-y-auto space-y-3 pr-2">
                        {isLoadingComments ? (
                            <Spinner />
                        ) : comments.length > 0 ? (
                            comments.map(comment => (
                                <div key={comment.id} className="bg-gray-700/50 p-2 rounded-lg">
                                    <p className="font-bold text-sm text-teal-300">{comment.user_name}</p>
                                    <p className="text-gray-200">{comment.comment_text}</p>
                                    <p className="text-xs text-gray-500 mt-1 text-right">{new Date(comment.created_at).toLocaleString()}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center pt-8">No comments yet. Be the first!</p>
                        )}
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-gray-600 pt-3">
                        <input
                            type="text"
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
                        <button onClick={handlePostComment} className="bg-orange-600 text-white font-bold px-4 rounded-lg">Post</button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default FyScreen;