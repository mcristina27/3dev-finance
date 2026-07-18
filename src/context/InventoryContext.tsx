import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductStock } from '../types';

interface InventoryContextType {
  stockList: ProductStock[];
  getStock: (productId: string) => number;
  /** Suma (o resta, con delta negativo) a la cantidad actual. Crea el registro si no existía. */
  adjustStock: (productId: string, delta: number) => Promise<void>;
  /** Fija la cantidad exacta (ej: recuento manual). */
  setStock: (productId: string, qty: number) => Promise<void>;
  loading: boolean;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

const STORAGE_KEY = '@antiva_stock';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [stockList, setStockList] = useState<ProductStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStock();
  }, []);

  async function loadStock() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setStockList(JSON.parse(raw));
    } catch (e) {
      console.error('Error loading stock', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveStock(updated: ProductStock[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setStockList(updated);
  }

  function getStock(productId: string) {
    return stockList.find(s => s.productId === productId)?.qty ?? 0;
  }

  async function adjustStock(productId: string, delta: number) {
    const now = new Date().toISOString();
    const existing = stockList.find(s => s.productId === productId);
    let updated: ProductStock[];
    if (existing) {
      updated = stockList.map(s =>
        s.productId === productId ? { ...s, qty: s.qty + delta, updatedAt: now } : s
      );
    } else {
      updated = [...stockList, { productId, qty: delta, updatedAt: now }];
    }
    await saveStock(updated);
  }

  async function setStock(productId: string, qty: number) {
    const now = new Date().toISOString();
    const existing = stockList.find(s => s.productId === productId);
    let updated: ProductStock[];
    if (existing) {
      updated = stockList.map(s =>
        s.productId === productId ? { ...s, qty, updatedAt: now } : s
      );
    } else {
      updated = [...stockList, { productId, qty, updatedAt: now }];
    }
    await saveStock(updated);
  }

  return (
    <InventoryContext.Provider value={{
      stockList,
      getStock,
      adjustStock,
      setStock,
      loading,
    }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside InventoryProvider');
  return ctx;
}
