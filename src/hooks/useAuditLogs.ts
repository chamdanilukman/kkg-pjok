import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  user_id?: string;
  created_at: string;
  user?: {
    name: string;
    role: string;
  };
}

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async (
    tableName?: string,
    recordId?: string,
    userId?: string,
    limit = 50
  ) => {
    try {
      let endpoint = '/audit-logs';
      const params = new URLSearchParams();
      if (tableName) params.append('table_name', tableName);
      if (recordId) params.append('record_id', recordId);
      if (userId) params.append('user_id', userId);
      params.append('limit', limit.toString());

      const data = await api.get(`${endpoint}?${params.toString()}`);
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivitySummary = async () => {
    return {
      data: {
        summary: {},
        dailyActivity: {},
        totalActions: auditLogs.length
      },
      error: null
    };
  };

  return {
    auditLogs,
    loading,
    fetchAuditLogs,
    getActivitySummary,
  };
}
