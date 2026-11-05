import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ProductStock, StockMovement } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { uuid } from '../lib/ids';
import { stockFromRow, movementFromRow } from '../lib/mappers';
import { readCache, writeCache } from '../lib/cache';

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
  /** Recarga stock e historial desde Supabase (p.ej. tras pagar un pedido). */
  refresh: () => Promise<void>;
  loading: boolean;
}

const InventoryContext = createContext<InventoryContextType | null>(null);

const CACHE_STOCK = '@3devfinance_cache_stock';
const CACHE_HIST = '@3devfinance_cache_stock_history';

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [stockList, setStockList] = useState<ProductStock[]>([]);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFromServer(): Promise<{ stock: ProductStock[]; hist: StockMovement[] }> {
    const [stockRes, histRes] = await Promise.all([
      supabase.from('product_stock').select('*'),
      supabase.from('stock_movements').select('*').order('created_at', { ascending: false }),
    ]);
    if (stockRes.error) throw stockRes.error;
    if (histRes.error) throw histRes.error;
    return {
      stock: (stockRes.data ?? []).map(stockFromRow),
      hist: (histRes.data ?? []).map(movementFromRow),
    };
  }

  useEffect(() => {
    let active = true;
    if (!userId) {
      setStockList([]);
      setHistory([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const [cStock, cHist] = await Promise.all([
        readCache<ProductStock[]>(CACHE_STOCK),
        readCache<StockMovement[]>(CACHE_HIST),
      ]);
      if (active) {
        if (cStock) setStockList(cStock);
        if (cHist) setHistory(cHist);
      }
      try {
        const { stock, hist } = await fetchFromServer();
        if (active) {
          setStockList(stock);
          setHistory(hist);
          writeCache(CACHE_STOCK, stock);
          writeCache(CACHE_HIST, hist);
        }
      } catch (e) {
        console.warn('Error cargando inventario', e);
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
      const { stock, hist } = await fetchFromServer();
      setStockList(stock);
      setHistory(hist);
      writeCache(CACHE_STOCK, stock);
      writeCache(CACHE_HIST, hist);
    } catch (e) {
      console.warn('Error refrescando inventario', e);
    }
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

  // Escribe el nuevo stock + registra el movimiento en Supabase, y actualiza
  // el estado local. Compartido por adjustStock y setStock.
  async function applyStockChange(
    productId: string,
    newQty: number,
    delta: number,
    reason?: StockMovement['reason'],
  ) {
    if (!userId) throw new Error('No hay sesión activa');
    const now = new Date().toISOString();

    const { error: e1 } = await supabase
      .from('product_stock')
      .upsert(
        { user_id: userId, product_id: productId, qty: newQty, updated_at: now },
        { onConflict: 'user_id,product_id' },
      );
    if (e1) throw e1;

    const existing = stockList.find(s => s.productId === productId);
    const updatedStock: ProductStock[] = existing
      ? stockList.map(s => (s.productId === productId ? { ...s, qty: newQty, updatedAt: now } : s))
      : [...stockList, { productId, qty: newQty, updatedAt: now }];
    setStockList(updatedStock);
    writeCache(CACHE_STOCK, updatedStock);

    if (delta !== 0) {
      const mv: StockMovement = {
        id: uuid(),
        productId,
        delta,
        resultingQty: newQty,
        reason,
        createdAt: now,
      };
      const { error: e2 } = await supabase.from('stock_movements').insert({
        id: mv.id,
        user_id: userId,
        product_id: productId,
        delta,
        resulting_qty: newQty,
        reason: reason ?? null,
        created_at: now,
      });
      if (e2) throw e2;
      const updatedHist = [mv, ...history];
      setHistory(updatedHist);
      writeCache(CACHE_HIST, updatedHist);
    }
  }

  async function adjustStock(productId: string, delta: number, reason?: StockMovement['reason']) {
    const newQty = getStock(productId) + delta;
    await applyStockChange(productId, newQty, delta, reason);
  }

  async function setStock(productId: string, qty: number, reason?: StockMovement['reason']) {
    const delta = qty - getStock(productId);
    await applyStockChange(productId, qty, delta, reason ?? 'manual');
  }

  return (
    <InventoryContext.Provider value={{
      stockList,
      getStock,
      getLastUpdated,
      getHistory,
      adjustStock,
      setStock,
      refresh,
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
