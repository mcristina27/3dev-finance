import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Material } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { uuid } from '../lib/ids';
import { matFromRow, matToRow } from '../lib/mappers';
import { readCache, writeCache } from '../lib/cache';

interface MaterialContextType {
  materials: Material[];
  addMaterial: (m: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMaterial: (id: string, m: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  getMaterial: (id: string) => Material | undefined;
  refresh: () => Promise<void>;
  lowStockMaterials: Material[];
  loading: boolean;
}

const MaterialContext = createContext<MaterialContextType | null>(null);

const CACHE_KEY = '@3devfinance_cache_materials';

export function MaterialProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFromServer(): Promise<Material[]> {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(matFromRow);
  }

  useEffect(() => {
    let active = true;
    if (!userId) {
      setMaterials([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const cached = await readCache<Material[]>(CACHE_KEY);
      if (cached && active) setMaterials(cached);
      try {
        const list = await fetchFromServer();
        if (active) {
          setMaterials(list);
          writeCache(CACHE_KEY, list);
        }
      } catch (e) {
        console.warn('Error cargando insumos', e);
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
      setMaterials(list);
      writeCache(CACHE_KEY, list);
    } catch (e) {
      console.warn('Error refrescando insumos', e);
    }
  }

  async function addMaterial(data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!userId) throw new Error('No hay sesión activa');
    const now = new Date().toISOString();
    const mat: Material = { ...data, id: uuid(), createdAt: now, updatedAt: now };
    const { error } = await supabase.from('materials').insert(matToRow(mat, userId));
    if (error) throw error;
    const list = [mat, ...materials];
    setMaterials(list);
    writeCache(CACHE_KEY, list);
  }

  async function updateMaterial(id: string, data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!userId) throw new Error('No hay sesión activa');
    const current = materials.find(m => m.id === id);
    const merged: Material = {
      ...(current ?? ({ id, createdAt: new Date().toISOString() } as Material)),
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('materials')
      .update(matToRow(merged, userId))
      .eq('id', id);
    if (error) throw error;
    const list = materials.map(m => (m.id === id ? merged : m));
    setMaterials(list);
    writeCache(CACHE_KEY, list);
  }

  async function deleteMaterial(id: string) {
    if (!userId) throw new Error('No hay sesión activa');
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
    const list = materials.filter(m => m.id !== id);
    setMaterials(list);
    writeCache(CACHE_KEY, list);
  }

  function getMaterial(id: string) {
    return materials.find(m => m.id === id);
  }

  const lowStockMaterials = materials.filter(
    m => typeof m.minStock === 'number' && m.stock <= m.minStock
  );

  return (
    <MaterialContext.Provider value={{
      materials,
      addMaterial,
      updateMaterial,
      deleteMaterial,
      getMaterial,
      refresh,
      lowStockMaterials,
      loading,
    }}>
      {children}
    </MaterialContext.Provider>
  );
}

export function useMaterials() {
  const ctx = useContext(MaterialContext);
  if (!ctx) throw new Error('useMaterials must be used inside MaterialProvider');
  return ctx;
}
