import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function useIuranConfig() {
    const [config, setConfig] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (api.hasAuthToken()) {
            fetchConfig();
        }
    }, []);

    const fetchConfig = async (tahun?: number) => {
        try {
            setLoading(true);
            let endpoint = '/iuran/config';
            if (tahun) endpoint += `?tahun=${tahun}`;
            const data = await api.get(endpoint);
            setConfig(data || []);
        } catch (err: any) {
            setError(err);
            console.error('Error fetching iuran config:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (data: any) => {
        try {
            const result = await api.post('/iuran/config', data);
            await fetchConfig();
            return { data: result, error: null };
        } catch (err: any) {
            console.error('Error saving iuran config:', err);
            return { data: null, error: err };
        }
    };

    const updateConfig = async (id: string, data: any) => {
        try {
            const result = await api.put(`/iuran/config?id=${id}`, data);
            await fetchConfig();
            return { data: result, error: null };
        } catch (err: any) {
            console.error('Error updating iuran config:', err);
            return { data: null, error: err };
        }
    };

    const deleteConfig = async (id: string) => {
        try {
            await api.delete(`/iuran/config?id=${id}`);
            await fetchConfig();
            return { error: null };
        } catch (err: any) {
            console.error('Error deleting iuran config:', err);
            return { error: err };
        }
    };

    return {
        config,
        loading,
        error,
        fetchConfig,
        saveConfig,
        updateConfig,
        deleteConfig,
    };
}

export function usePembayaranIuran() {
    const [pembayaran, setPembayaran] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (api.hasAuthToken()) {
            fetchPembayaran();
        }
    }, []);

    const fetchPembayaran = async (tahun?: number, user_id?: string) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (tahun) params.append('tahun', tahun.toString());
            if (user_id) params.append('user_id', user_id);
            
            const queryString = params.toString();
            const endpoint = `/iuran/pembayaran${queryString ? '?' + queryString : ''}`;
            const data = await api.get(endpoint);
            setPembayaran(data || []);
        } catch (err: any) {
            setError(err);
            console.error('Error fetching pembayaran iuran:', err);
        } finally {
            setLoading(false);
        }
    };

    const createPembayaran = async (data: any) => {
        try {
            const result = await api.post('/iuran/pembayaran', data);
            setPembayaran(prev => [result, ...prev]);
            return { data: result, error: null };
        } catch (err: any) {
            console.error('Error creating pembayaran:', err);
            return { data: null, error: err };
        }
    };

    const updatePembayaran = async (id: string, data: any) => {
        try {
            const result = await api.put(`/iuran/pembayaran?id=${id}`, data);
            setPembayaran(prev => prev.map(p => p.id === id ? result : p));
            return { data: result, error: null };
        } catch (err: any) {
            console.error('Error updating pembayaran:', err);
            return { data: null, error: err };
        }
    };

    const requestDeletePembayaran = async (id: string) => {
        try {
            const result = await api.put(`/iuran/pembayaran?id=${id}&action=request_delete`, {});
            setPembayaran(prev => prev.map(p => p.id === id ? result : p));
            return { error: null };
        } catch (err: any) {
            console.error('Error requesting delete pembayaran:', err);
            return { error: err };
        }
    };

    const approveDeletePembayaran = async (id: string) => {
        try {
            const result = await api.put(`/iuran/pembayaran?id=${id}&action=approve_delete`, {});
            setPembayaran(prev => prev.filter(p => p.id !== id));
            return { error: null, data: result };
        } catch (err: any) {
            console.error('Error approving delete pembayaran:', err);
            return { error: err };
        }
    };

    return {
        pembayaran,
        loading,
        error,
        fetchPembayaran,
        createPembayaran,
        updatePembayaran,
        requestDeletePembayaran,
        approveDeletePembayaran,
    };
}

export function useChecklistIuran() {
    const [checklist, setChecklist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (api.hasAuthToken()) {
            fetchChecklist();
        }
    }, []);

    const fetchChecklist = async (tahun?: number) => {
        try {
            setLoading(true);
            let endpoint = '/iuran/checklist';
            if (tahun) endpoint += `?tahun=${tahun}`;
            const data = await api.get(endpoint);
            setChecklist(data || []);
        } catch (err: any) {
            setError(err);
            console.error('Error fetching checklist iuran:', err);
        } finally {
            setLoading(false);
        }
    };

    return {
        checklist,
        loading,
        error,
        fetchChecklist,
    };
}
