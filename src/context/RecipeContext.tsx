import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe, RecipeIngredient } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { uuid } from '../lib/ids';
import { readCache, writeCache } from '../lib/cache';

interface RecipeContextType {
  recipes: Recipe[];
  getRecipe: (productId: string) => Recipe | undefined;
  /** Crea/actualiza la receta de un producto. Si queda sin insumos, la elimina. */
  saveRecipe: (productId: string, ingredients: RecipeIngredient[]) => Promise<void>;
  deleteRecipe: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
  loading: boolean;
}

const RecipeContext = createContext<RecipeContextType | null>(null);

const CACHE_KEY = '@3devfinance_cache_recipes';

export function RecipeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchFromServer(): Promise<Recipe[]> {
    const [recRes, ingRes] = await Promise.all([
      supabase.from('recipes').select('*'),
      supabase.from('recipe_ingredients').select('*'),
    ]);
    if (recRes.error) throw recRes.error;
    if (ingRes.error) throw ingRes.error;

    const byProduct: Record<string, RecipeIngredient[]> = {};
    for (const r of ingRes.data ?? []) {
      if (!byProduct[r.product_id]) byProduct[r.product_id] = [];
      byProduct[r.product_id].push({ materialId: r.material_id, qty: Number(r.qty) });
    }
    return (recRes.data ?? []).map((r: any) => ({
      productId: r.product_id,
      ingredients: byProduct[r.product_id] ?? [],
      updatedAt: r.updated_at,
    }));
  }

  useEffect(() => {
    let active = true;
    if (!userId) {
      setRecipes([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const cached = await readCache<Recipe[]>(CACHE_KEY);
      if (cached && active) setRecipes(cached);
      try {
        const list = await fetchFromServer();
        if (active) {
          setRecipes(list);
          writeCache(CACHE_KEY, list);
        }
      } catch (e) {
        console.warn('Error cargando recetas', e);
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
      setRecipes(list);
      writeCache(CACHE_KEY, list);
    } catch (e) {
      console.warn('Error refrescando recetas', e);
    }
  }

  function getRecipe(productId: string) {
    return recipes.find(r => r.productId === productId);
  }

  async function saveRecipe(productId: string, ingredients: RecipeIngredient[]) {
    if (!userId) throw new Error('No hay sesión activa');

    if (ingredients.length === 0) {
      await deleteRecipe(productId);
      return;
    }

    const now = new Date().toISOString();
    // 1) la cabecera de receta (padre de los ingredientes por la FK).
    const { error: e1 } = await supabase
      .from('recipes')
      .upsert(
        { user_id: userId, product_id: productId, updated_at: now },
        { onConflict: 'user_id,product_id' },
      );
    if (e1) throw e1;

    // 2) reemplaza los ingredientes.
    const { error: e2 } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('product_id', productId);
    if (e2) throw e2;

    const rows = ingredients.map(ing => ({
      id: uuid(),
      user_id: userId,
      product_id: productId,
      material_id: ing.materialId,
      qty: ing.qty,
    }));
    const { error: e3 } = await supabase.from('recipe_ingredients').insert(rows);
    if (e3) throw e3;

    const recipe: Recipe = { productId, ingredients, updatedAt: now };
    const list = recipes.some(r => r.productId === productId)
      ? recipes.map(r => (r.productId === productId ? recipe : r))
      : [...recipes, recipe];
    setRecipes(list);
    writeCache(CACHE_KEY, list);
  }

  async function deleteRecipe(productId: string) {
    if (!userId) throw new Error('No hay sesión activa');
    // recipe_ingredients se borra en cascada por la FK, pero lo hacemos explícito.
    await supabase.from('recipe_ingredients').delete().eq('product_id', productId);
    const { error } = await supabase.from('recipes').delete().eq('product_id', productId);
    if (error) throw error;
    const list = recipes.filter(r => r.productId !== productId);
    setRecipes(list);
    writeCache(CACHE_KEY, list);
  }

  return (
    <RecipeContext.Provider value={{ recipes, getRecipe, saveRecipe, deleteRecipe, refresh, loading }}>
      {children}
    </RecipeContext.Provider>
  );
}

export function useRecipes() {
  const ctx = useContext(RecipeContext);
  if (!ctx) throw new Error('useRecipes must be used inside RecipeProvider');
  return ctx;
}
