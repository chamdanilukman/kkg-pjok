import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface GalleryPhoto {
    id: string;
    title: string;
    description?: string;
    file_url: string;
    uploaded_at: string;
    uploaded_by?: string;
}

export function useGallery() {
    const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (api.hasAuthToken()) {
            fetchGallery();
        }
    }, []);

    const fetchGallery = async () => {
        try {
            const data = await api.get('/gallery');
            setGallery(data || []);
        } catch (error) {
            console.error('Error fetching gallery:', error);
        } finally {
            setLoading(false);
        }
    };

    const uploadPhoto = async (photoData: Partial<GalleryPhoto>) => {
        try {
            const data = await api.post('/gallery', photoData);
            setGallery(prev => [data, ...prev]);
            return { data, error: null };
        } catch (error: any) {
            console.error('Error uploading photo:', error);
            return { data: null, error };
        }
    };

    const deletePhoto = async (id: string) => {
        try {
            await api.delete(`/gallery?id=${id}`);
            setGallery(prev => prev.filter(p => p.id !== id));
            return { error: null };
        } catch (error: any) {
            console.error('Error deleting photo:', error);
            return { error };
        }
    };

    return {
        gallery,
        loading,
        fetchGallery,
        uploadPhoto,
        deletePhoto,
    };
}
