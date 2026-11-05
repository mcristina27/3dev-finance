import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { uuid } from '../lib/ids';
import { txFromRow, txToRow } from '../lib/mappers';
import { readCache, writeCache } from '../lib/cache';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => Promise<string>;
  deleteTransaction: (id: string) => Promise<void>;
  /** Recarga desde Supabase (p.ej. tras pagar un pedido, que crea el ingreso server-side). */
  refresh: () => Promise<void>;
  totalIncome: number;
  totalExpense: number;
  /** Suma de ingresos con paymentStatus 'pending' — aún no cuentan en totalIncome/balance. */
  pendingIncome: number;
  balance: number;
  loading: boolean;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

const CACHE_KEY = '@3devfinance_cache_transactions';

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFromServer(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(txFromRow);
  }

  useEffect(() => {
    let active = true;
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const cached = await readCache<Transaction[]>(CACHE_KEY);
      if (cached && active) setTransactions(cached);
      try {
        const list = await fetchFromServer();
        if (active) {
          setTransactions(list);
          writeCache(CACHE_KEY, list);
        }
      } catch (e) {
        console.warn('Error cargando movimientos', e);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  async function refresh() {
    if (!userId) return;
    try {
      const list = await fetchFromServer();
      setTransactions(list);
      writeCache(CACHE_KEY, list);
    } catch (e) {
      console.warn('Error refrescando movimientos', e);
    }
  }

  async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
    if (!userId) throw new Error('No hay sesión activa');
    const tx: Transaction = {
      ...data,
      id: uuid(),
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('transactions').insert(txToRow(tx, userId));
    if (error) throw error;
    const list = [tx, ...transactions];
    setTransactions(list);
    writeCache(CACHE_KEY, list);
    return tx.id;
  }

  async function deleteTransaction(id: string) {
    if (!userId) throw new Error('No hay sesión activa');
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    const list = transactions.filter(t => t.id !== id);
    setTransactions(list);
    writeCache(CACHE_KEY, list);
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
      refresh,
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
