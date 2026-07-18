import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AgendaEvent } from '../types';

interface AgendaEventContextType {
  events: AgendaEvent[];
  addEvent: (e: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEvent: (id: string, e: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => AgendaEvent | undefined;
  loading: boolean;
}

const AgendaEventContext = createContext<AgendaEventContextType | null>(null);

const STORAGE_KEY = '@antiva_agenda_events';

export function AgendaEventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setEvents(JSON.parse(raw));
    } catch (e) {
      console.error('Error loading agenda events', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveEvents(updated: AgendaEvent[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEvents(updated);
  }

  async function addEvent(data: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newEvent: AgendaEvent = { ...data, id: Date.now().toString(), createdAt: now, updatedAt: now };
    await saveEvents([newEvent, ...events]);
    return newEvent.id;
  }

  async function updateEvent(id: string, data: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) {
    const updated = events.map(e => e.id === id ? { ...e, ...data, updatedAt: new Date().toISOString() } : e);
    await saveEvents(updated);
  }

  async function deleteEvent(id: string) {
    await saveEvents(events.filter(e => e.id !== id));
  }

  function getEvent(id: string) {
    return events.find(e => e.id === id);
  }

  return (
    <AgendaEventContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, getEvent, loading }}>
      {children}
    </AgendaEventContext.Provider>
  );
}

export function useAgendaEvents() {
  const ctx = useContext(AgendaEventContext);
  if (!ctx) throw new Error('useAgendaEvents must be used inside AgendaEventProvider');
  return ctx;
}
