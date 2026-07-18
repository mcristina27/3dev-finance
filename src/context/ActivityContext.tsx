import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity } from '../types';
import { useTransactions } from './TransactionContext';
import { useInventory } from './InventoryContext';

interface ActivityContextType {
  activities: Activity[];
  addActivity: (a: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateActivity: (id: string, a: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  getActivity: (id: string) => Activity | undefined;
  linkToEntry: (activityId: string, entryId: string) => Promise<void>;
  loading: boolean;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

const STORAGE_KEY = '@antiva_activities';

/**
 * Un pedido/venta genera su ingreso en cuanto se marca "Pagado" — no depende
 * de "Confirmado" ni "Entregado", que son pasos independientes.
 */
function qualifiesToClose(a: Pick<Activity, 'paid'>) {
  return a.paid === true;
}

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const { addTransaction } = useTransactions();
  const { adjustStock } = useInventory();

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setActivities(JSON.parse(raw));
    } catch (e) {
      console.error('Error loading activities', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveActivities(updated: Activity[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setActivities(updated);
  }

  /**
   * Si la actividad recién quedó marcada como pagada y aún no se cerró:
   * descuenta el stock de cada ítem y crea el ingreso en Movimientos.
   * Devuelve la actividad con relatedEntryId + stockDeducted ya seteados.
   */
  async function closeIfNeeded(activity: Activity): Promise<Activity> {
    if (activity.stockDeducted) return activity;
    if (!qualifiesToClose(activity)) return activity;

    for (const item of activity.items ?? []) {
      if (item.productId) {
        await adjustStock(item.productId, -item.qty, 'venta');
      }
    }

    const entryId = await addTransaction({
      type: 'income',
      name: activity.title,
      amount: activity.totalAmount ?? 0,
      date: activity.date,
      notes: activity.notes,
      channel: activity.channel,
      paymentStatus: 'paid',
      sourceActivityId: activity.id,
    });

    return { ...activity, relatedEntryId: entryId, stockDeducted: true };
  }

  async function addActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    let newActivity: Activity = {
      ...data,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    newActivity = await closeIfNeeded(newActivity);
    await saveActivities([newActivity, ...activities]);
    return newActivity.id;
  }

  async function updateActivity(id: string, data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) {
    const current = activities.find(a => a.id === id);

    let merged: Activity = current
      ? { ...current, ...data, updatedAt: new Date().toISOString() }
      : { ...data, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

    merged = await closeIfNeeded(merged);

    const updated = activities.map(a => (a.id === id ? merged : a));
    await saveActivities(updated);
  }

  async function deleteActivity(id: string) {
    await saveActivities(activities.filter(a => a.id !== id));
  }

  function getActivity(id: string) {
    return activities.find(a => a.id === id);
  }

  async function linkToEntry(activityId: string, entryId: string) {
    const updated = activities.map(a =>
      a.id === activityId
        ? { ...a, relatedEntryId: entryId, updatedAt: new Date().toISOString() }
        : a
    );
    await saveActivities(updated);
  }

  return (
    <ActivityContext.Provider value={{
      activities,
      addActivity,
      updateActivity,
      deleteActivity,
      getActivity,
      linkToEntry,
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
