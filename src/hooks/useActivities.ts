import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Activity } from '../lib/types';

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (api.hasAuthToken()) {
      fetchActivities();
    }
  }, []);

  const fetchActivities = async (status?: string) => {
    try {
      const endpoint = status ? `/activities?status=${status}` : '/activities';
      const data = await api.get(endpoint);
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const data = await api.post('/activities', activityData);
      setActivities(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating activity:', error);
      return { data: null, error };
    }
  };

  const updateActivity = async (id: string, updates: Partial<Activity>) => {
    try {
      const data = await api.put(`/activities?id=${id}`, updates);
      setActivities(prev => prev.map(activity =>
        activity.id === id ? data : activity
      ));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating activity:', error);
      return { data: null, error };
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      await api.delete(`/activities?id=${id}`);
      setActivities(prev => prev.filter(activity => activity.id !== id));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting activity:', error);
      return { error };
    }
  };

  const registerForActivity = async (activityId: string, notes?: string) => {
    try {
      const data = await api.post('/activities/register', { activity_id: activityId, notes });
      return { data, error: null };
    } catch (error: any) {
      console.error('Error registering for activity:', error);
      return { data: null, error };
    }
  };

  return {
    activities,
    loading,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    registerForActivity,
  };
}
