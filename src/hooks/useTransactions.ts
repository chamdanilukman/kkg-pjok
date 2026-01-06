import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Transaction } from '../lib/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (api.hasAuthToken()) {
      fetchTransactions();
    }
  }, []);

  const fetchTransactions = async (category?: string, type?: 'income' | 'expense') => {
    try {
      let endpoint = '/transactions';
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (type) params.append('type', type);

      const queryString = params.toString();
      if (queryString) endpoint += `?${queryString}`;

      const data = await api.get(endpoint);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const data = await api.post('/transactions', transactionData);
      setTransactions(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      return { data: null, error };
    }
  };

  const getFinancialSummary = async () => {
    // For now, calculate client-side to simplify API handlers
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
      transaction_count: transactions.length
    };
  };

  const updateTransaction = async (id: string, transactionData: Partial<Transaction>) => {
    try {
      const data = await api.put(`/transactions?id=${id}`, transactionData);
      setTransactions(prev => prev.map(t => t.id === id ? data : t));
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      return { data: null, error };
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`/transactions?id=${id}`);
      setTransactions(prev => prev.filter(t => t.id !== id));
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      return { error };
    }
  };

  return {
    transactions,
    loading,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getFinancialSummary,
  };
}
