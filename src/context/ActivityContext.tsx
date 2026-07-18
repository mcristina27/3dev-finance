import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Activity } from '../types';

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

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function addActivity(data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newActivity: Activity = {
      ...data,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    await saveActivities([newActivity, ...activities]);
    return newActivity.id;
  }

  async function updateActivity(id: string, data: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) {
    const updated = activities.map(a =>
      a.id === id
        ? { ...a, ...data, updatedAt: new Date().toISOString() }
        : a
    );
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
