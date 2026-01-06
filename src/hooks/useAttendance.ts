import { useState } from 'react';
import { api } from '../lib/api';

export function useAttendance() {
  const [attendances, setAttendances] = useState<any[]>([]);

  const fetchAttendance = async (activityId?: string, userId?: string) => {
    try {
      let endpoint = '/attendance';
      const params = new URLSearchParams();
      if (activityId) params.append('activity_id', activityId);
      if (userId) params.append('user_id', userId);

      const queryString = params.toString();
      if (queryString) endpoint += `?${queryString}`;

      const data = await api.get(endpoint);
      setAttendances(data || []);
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching attendance:', error);
      return { data: null, error };
    }
  };

  const getUserAttendance = (userId: string) => fetchAttendance(undefined, userId);

  const markAttendance = async (attendanceData: {
    activity_id: string;
    user_id: string;
    check_in_method: 'qr_code' | 'manual';
    notes?: string;
  }) => {
    try {
      const data = await api.post('/attendance', attendanceData);
      setAttendances(prev => {
        const index = prev.findIndex((a: any) => a.activity_id === data.activity_id && a.user_id === data.user_id);
        if (index > -1) {
          const newAttendances = [...prev];
          newAttendances[index] = data;
          return newAttendances;
        }
        return [data, ...prev];
      });
      return { data, error: null };
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      return { data: null, error };
    }
  };

  return {
    attendances,
    fetchAttendance,
    markAttendance,
    getUserAttendance,
  };
}
