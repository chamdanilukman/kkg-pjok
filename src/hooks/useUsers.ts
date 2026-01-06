import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User } from '../lib/types';

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const data = await api.get('/users');
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id: string) => {
        try {
            await api.delete(`/users?id=${id}`);
            setUsers(prev => prev.filter(u => u.id !== id));
            return { error: null };
        } catch (error: any) {
            console.error('Error deleting user:', error);
            return { error };
        }
    };

    return {
        users,
        loading,
        fetchUsers,
        deleteUser,
    };
}
