import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity, ActivityItem } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useTransactions } from './TransactionContext';
import { useInventory } from './InventoryContext';
import { uuid } from '../lib/ids';
import { activityFromRow, activityToRow, itemFromRow, itemToRow } from '../lib/mappers';
import { readCache, writeCache } from '../lib/cache';

interface ActivityContextType {
  activities: Activity[];
  addActivity: (a: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateActivity: (id: string, a: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  getActivity: (id: string) => Activity | undefined;
  linkToEntry: (activityId: string, entryId: string) => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

const CACHE_KEY = '@3devfinance_cache_activities';

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const { refresh: refreshTransactions } = useTransactions();
  const { refresh: refreshInventory } = useInventory();

  // ─── Lectura ────────────────────────────────────────────────────────────────
  async function fetchItems(activityId: string): Promise<ActivityItem[]> {
    const { data, error } = await supabase
      .from('activity_items')
      .select('*')
      .eq('activity_id', activityId);
    if (error) throw error;
    return (data ?? []).map(itemFromRow);
  }

  async function fetchFromServer(): Promise<Activity[]> {
    const [actRes, itemRes] = await Promise.all([
      supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('activity_items').select('*'),
    ]);
    if (actRes.error) throw actRes.error;
    if (itemRes.error) throw itemRes.error;

    const byAct: Record<string, ActivityItem[]> = {};
    for (const r of itemRes.data ?? []) {
      if (!byAct[r.activity_id]) byAct[r.activity_id] = [];
      byAct[r.activity_id].push(itemFromRow(r));
    }
    return (actRes.data ?? []).map(r => activityFromRow(r, byAct[r.id] ?? []));
  }

  useEffect(() => {
    let active = true;
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const cached = await readCache<Activity[]>(CACHE_KEY);
      if (cached && active) setActivities(cached);
      try {
        const list = await fetchFromServer();
        if (active) {
          setActivities(list);
          writeCache(CACHE_KEY, list);
        }
      } catch (e) {
        console.warn('Error cargando pedidos', e);
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
      setActivities(list);
      writeCache(CACHE_KEY, list);
    } catch (e) {
      console.warn('Error refrescando pedidos', e);
    }
  }

  // ─── Escritura ──────────────────────────────────────────────────────────────
  async function persistItems(activityId: string, items: ActivityItem[]) {
    if (!userId) throw new Error('No hay sesión activa');
    const { error: delErr } = await supabase
      .from('activity_items')
      .delete()
      .eq('activity_id', activityId);
    if (delErr) throw delErr;
    if (items && items.length) {
      const rows = items.map(it => itemToRow(it, activityId, userId));
      const { error: insErr } = await supabase.from('activity_items').insert(rows);
      if (insErr) throw insErr;
    }
  }

  /**
   * Marca el pedido como pagado de forma atómica en el servidor: descuenta el
   * stock de cada ítem, registra los movimientos, crea el ingreso en Movimientos
   * y marca stock_deducted — todo en el RPC pay_activity (idempotente). Luego
   * refresca Movimientos e Inventario y devuelve la actividad ya actualizada.
   */
  async function payActivity(id: string): Promise<Activity | null> {
    const { error } = await supabase.rpc('pay_activity', { p_activity_id: id });
    if (error) throw error;
    await refreshTransactions();
    await refreshInventory();
    const { data, error: e2 } = await supabase.from('activities').select('*').eq('id', id).single();
    if (e2 || !data) {
      console.warn('No se pudo releer el pedido tras pagar', e2);
      return null;
    }
    const items = await fetchItems(id);
    return activityFromRow(data, items);
  }

  async function addActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!userId) throw new Error('No hay sesión activa');
    const now = new Date().toISOString();
    let activity: Activity = { ...data, id: uuid(), createdAt: now, updatedAt: now };

    const { error } = await supabase.from('activities').insert(activityToRow(activity, userId));
    if (error) throw error;
    await persistItems(activity.id, activity.items ?? []);

    if (activity.paid && !activity.stockDeducted) {
      const paid = await payActivity(activity.id);
      if (paid) activity = paid;
    }

    const list = [activity, ...activities];
    setActivities(list);
    writeCache(CACHE_KEY, list);
    return activity.id;
  }

  async function updateActivity(id: string, data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!userId) throw new Error('No hay sesión activa');
    const now = new Date().toISOString();
    const current = activities.find(a => a.id === id);
    let merged: Activity = current
      ? { ...current, ...data, id, updatedAt: now }
      : { ...data, id, createdAt: now, updatedAt: now };

    const { error } = await supabase
      .from('activities')
      .update(activityToRow(merged, userId))
      .eq('id', id);
    if (error) throw error;
    await persistItems(id, merged.items ?? []);

    if (merged.paid && !merged.stockDeducted) {
      const paid = await payActivity(id);
      if (paid) merged = paid;
    }

    const list = activities.map(a => (a.id === id ? merged : a));
    setActivities(list);
    writeCache(CACHE_KEY, list);
  }

  async function deleteActivity(id: string) {
    if (!userId) throw new Error('No hay sesión activa');
    // activity_items se borra en cascada por la FK.
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw error;
    const list = activities.filter(a => a.id !== id);
    setActivities(list);
    writeCache(CACHE_KEY, list);
  }

  function getActivity(id: string) {
    return activities.find(a => a.id === id);
  }

  async function linkToEntry(activityId: string, entryId: string) {
    if (!userId) throw new Error('No hay sesión activa');
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('activities')
      .update({ related_entry_id: entryId, updated_at: now })
      .eq('id', activityId);
    if (error) throw error;
    const list = activities.map(a =>
      a.id === activityId ? { ...a, relatedEntryId: entryId, updatedAt: now } : a,
    );
    setActivities(list);
    writeCache(CACHE_KEY, list);
  }

  return (
    <ActivityContext.Provider value={{
      activities,
      addActivity,
      updateActivity,
      deleteActivity,
      getActivity,
      linkToEntry,
      refresh,
      loading,
    }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivities() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivities must be used inside ActivityProvider');
  return ctx;
}
