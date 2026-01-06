const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = {
    hasAuthToken() {
        return Boolean(localStorage.getItem('auth_token'));
    },
    async fetch(endpoint: string, options: RequestInit = {}) {
        const token = localStorage.getItem('auth_token');

        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
            throw data || { message: 'An error occurred' };
        }

        return data;
    },

    get(endpoint: string) {
        return this.fetch(endpoint, { method: 'GET' });
    },

    post(endpoint: string, body: any) {
        return this.fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    put(endpoint: string, body: any) {
        return this.fetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        });
    },

    delete(endpoint: string) {
        return this.fetch(endpoint, { method: 'DELETE' });
    },
};
