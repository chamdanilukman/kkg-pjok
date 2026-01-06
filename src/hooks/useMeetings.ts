import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface Meeting {
  id: string;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  agenda?: string;
  notes?: string;
  meeting_type: 'regular' | 'emergency' | 'planning' | 'evaluation';
  activity_id?: string;
  activity_title?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (api.hasAuthToken()) {
      fetchMeetings();
    }
  }, []);

  const fetchMeetings = async (type?: string) => {
    try {
      const endpoint = type ? `/meetings?type=${type}` : '/meetings';
      const data = await api.get(endpoint);
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (meetingData: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const data = await api.post('/meetings', meetingData);
      setMeetings(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      return { data: null, error };
    }
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>) => {
    try {
      const data = await api.put(`/meetings?id=${id}`, updates);
      setMeetings(prev => prev.map(meeting =>
        meeting.id === id ? data : meeting
      ));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      return { data: null, error };
    }
  };

  const deleteMeeting = async (id: string) => {
    try {
      await api.delete(`/meetings?id=${id}`);
      setMeetings(prev => prev.filter(meeting => meeting.id !== id));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting meeting:', error);
      return { error };
    }
  };

  return {
    meetings,
    loading,
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  };
}
