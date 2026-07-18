import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string>;
  deleteTransaction: (id: string) => Promise<void>;
  totalIncome: number;
  totalExpense: number;
  /** Suma de ingresos con paymentStatus 'pending' — aún no cuentan en totalIncome/balance. */
  pendingIncome: number;
  balance: number;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

const STORAGE_KEY = '@antiva_transactions';

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setTransactions(JSON.parse(raw));
    } catch (e) {
      console.error('Error loading transactions', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveTransactions(updated: Transaction[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTransactions(updated);
  }

  async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
    const newTransaction: Transaction = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    await saveTransactions([newTransaction, ...transactions]);
    return newTransaction.id;
  }

  async function deleteTransaction(id: string) {
    await saveTransactions(transactions.filter(t => t.id !== id));
  }

  // paymentStatus sin definir = registros manuales viejos, se asumen pagados.
  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.paymentStatus !== 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingIncome = transactions
    .filter(t => t.type === 'income' && t.paymentStatus === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <TransactionContext.Provider value={{
      transactions,
      addTransaction,
      deleteTransaction,
      totalIncome,
      totalExpense,
      pendingIncome,
      balance,
      loading,
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used inside TransactionProvider');
  return ctx;
}
