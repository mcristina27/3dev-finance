import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Material } from '../types';

interface MaterialContextType {
  materials: Material[];
  addMaterial: (m: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMaterial: (id: string, m: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  getMaterial: (id: string) => Material | undefined;
  lowStockMaterials: Material[];
  loading: boolean;
}

const MaterialContext = createContext<MaterialContextType | null>(null);

const STORAGE_KEY = '@antiva_materials';

export function MaterialProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, []);

  async function loadMaterials() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setMaterials(JSON.parse(raw));
    } catch (e) {
      console.error('Error loading materials', e);
    } finally {
      setLoading(false);
    }
  }

  async function saveMaterials(updated: Material[]) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setMaterials(updated);
  }

  async function addMaterial(data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString();
    const newMaterial: Material = {
      ...data,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    await saveMaterials([newMaterial, ...materials]);
  }

  async function updateMaterial(id: string, data: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) {
    const updated = materials.map(m =>
      m.id === id
        ? { ...m, ...data, updatedAt: new Date().toISOString() }
        : m
    );
    await saveMaterials(updated);
  }

  async function deleteMaterial(id: string) {
    await saveMaterials(materials.filter(m => m.id !== id));
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
