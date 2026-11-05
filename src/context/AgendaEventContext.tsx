import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AgendaEvent } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { uuid } from '../lib/ids';
import { eventFromRow, eventToRow } from '../lib/mappers';
import { readCache, writeCache } from '../lib/cache';

interface AgendaEventContextType {
  events: AgendaEvent[];
  addEvent: (e: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateEvent: (id: string, e: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => AgendaEvent | undefined;
  refresh: () => Promise<void>;
  loading: boolean;
}

const AgendaEventContext = createContext<AgendaEventContextType | null>(null);

const CACHE_KEY = '@3devfinance_cache_agenda_events';

export function AgendaEventProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFromServer(): Promise<AgendaEvent[]> {
    const { data, error } = await supabase
      .from('agenda_events')
      .select('*')
      .order('date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(eventFromRow);
  }

  useEffect(() => {
    let active = true;
    if (!userId) {
      setEvents([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const cached = await readCache<AgendaEvent[]>(CACHE_KEY);
      if (cached && active) setEvents(cached);
      try {
        const list = await fetchFromServer();
        if (active) {
          setEvents(list);
          writeCache(CACHE_KEY, list);
        }
      } catch (e) {
        console.warn('Error cargando agenda', e);
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
      setEvents(list);
      writeCache(CACHE_KEY, list);
    } catch (e) {
      console.warn('Error refrescando agenda', e);
    }
  }

  async function addEvent(data: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!userId) throw new Error('No hay sesión activa');
    const now = new Date().toISOString();
    const ev: AgendaEvent = { ...data, id: uuid(), createdAt: now, updatedAt: now };
    const { error } = await supabase.from('agenda_events').insert(eventToRow(ev, userId));
    if (error) throw error;
    const list = [ev, ...events];
    setEvents(list);
    writeCache(CACHE_KEY, list);
    return ev.id;
  }

  async function updateEvent(id: string, data: Omit<AgendaEvent, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!userId) throw new Error('No hay sesión activa');
    const current = events.find(e => e.id === id);
    const merged: AgendaEvent = {
      ...(current ?? ({ id, createdAt: new Date().toISOString() } as AgendaEvent)),
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('agenda_events')
      .update(eventToRow(merged, userId))
      .eq('id', id);
    if (error) throw error;
    const list = events.map(e => (e.id === id ? merged : e));
    setEvents(list);
    writeCache(CACHE_KEY, list);
  }

  async function deleteEvent(id: string) {
    if (!userId) throw new Error('No hay sesión activa');
    const { error } = await supabase.from('agenda_events').delete().eq('id', id);
    if (error) throw error;
    const list = events.filter(e => e.id !== id);
    setEvents(list);
    writeCache(CACHE_KEY, list);
  }

  function getEvent(id: string) {
    return events.find(e => e.id === id);
  }

  return (
    <AgendaEventContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, getEvent, refresh, loading }}>
      {children}
    </AgendaEventContext.Provider>
  );
}

export function useAgendaEvents() {
  const ctx = useContext(AgendaEventContext);
  if (!ctx) throw new Error('useAgendaEvents must be used inside AgendaEventProvider');
  return ctx;
}
