import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProductStock, StockMovement } from '../types';

interface InventoryContextType {
  stockList: ProductStock[];
  getStock: (productId: string) => number;
  /** Fecha del último movimiento registrado para este producto, si existe. */
  getLastUpdated: (productId: string) => string | undefined;
  /** Historial de movimientos de un producto, más reciente primero. */
  getHistory: (productId: string) => StockMovement[];
  /** Suma (o resta, con delta negativo) a la cantidad actual. Crea el registro si no existía. */
  adjustStock: (productId: string, delta: number, reason?: StockMovement['reason']) => Promise<void>;
  /** Fija la cantidad exacta (ej: recuento manual). */
  setStock: (productId: string, qty: number, reason?: StockMovement['reason']) => Promise<void>;
  loading: boolean;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

const STORAGE_KEY = '@3devfinance_stock';
const HISTORY_KEY = '@3devfinance_stock_history';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [stockList, setStockList] = useState<ProductStock[]>([]);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStock();
    loadHistory();
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

  async function loadHistory() {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch (e) {
      console.error('Error loading stock history', e);
    }
  }

  async function saveStock(updated: ProductStock[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setStockList(updated);
  }

  async function recordMovement(
    productId: string,
    delta: number,
    resultingQty: number,
    reason?: StockMovement['reason'],
  ) {
    if (delta === 0) return;
    const movement: StockMovement = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      productId,
      delta,
      resultingQty,
      reason,
      createdAt: new Date().toISOString(),
    };
    const updated = [movement, ...history];
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    setHistory(updated);
  }

  function getStock(productId: string) {
    return stockList.find(s => s.productId === productId)?.qty ?? 0;
  }

  function getLastUpdated(productId: string) {
    return stockList.find(s => s.productId === productId)?.updatedAt;
  }

  function getHistory(productId: string) {
    return history
      .filter(m => m.productId === productId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async function adjustStock(productId: string, delta: number, reason?: StockMovement['reason']) {
    const now = new Date().toISOString();
    const existing = stockList.find(s => s.productId === productId);
    const newQty = (existing?.qty ?? 0) + delta;
    let updated: ProductStock[];
    if (existing) {
      updated = stockList.map(s =>
        s.productId === productId ? { ...s, qty: newQty, updatedAt: now } : s
      );
    } else {
      updated = [...stockList, { productId, qty: newQty, updatedAt: now }];
    }
    await saveStock(updated);
    await recordMovement(productId, delta, newQty, reason);
  }

  async function setStock(productId: string, qty: number, reason?: StockMovement['reason']) {
    const now = new Date().toISOString();
    const existing = stockList.find(s => s.productId === productId);
    const delta = qty - (existing?.qty ?? 0);
    let updated: ProductStock[];
    if (existing) {
      updated = stockList.map(s =>
        s.productId === productId ? { ...s, qty, updatedAt: now } : s
      );
    } else {
      updated = [...stockList, { productId, qty, updatedAt: now }];
    }
    await saveStock(updated);
    await recordMovement(productId, delta, qty, reason ?? 'manual');
  }

  return (
    <InventoryContext.Provider value={{
      stockList,
      getStock,
      getLastUpdated,
      getHistory,
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
