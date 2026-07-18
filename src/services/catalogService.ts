import AsyncStorage from '@react-native-async-storage/async-storage';
import { CatalogProduct } from '../types';

const CATALOG_URL  = 'https://3devlabs.app/api/productos';
const CACHE_KEY     = '@antiva_catalog_cache';
const CACHE_TTL_MS  = 1000 * 60 * 30; // 30 min

interface CacheShape {
  fetchedAt: number;
  productos: CatalogProduct[];
}

/**
 * Trae el catálogo real de productos desde la web (3devlabs.app).
 * Usa cache local para funcionar offline o si la web no responde;
 * refresca en segundo plano cuando el cache está viejo.
 */
export async function getCatalog(): Promise<{ productos: CatalogProduct[]; fromCache: boolean }> {
  let cached: CacheShape | null = null;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) cached = JSON.parse(raw);
  } catch {
    // cache corrupto, ignorar
  }

  const isFresh = cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS;
  if (isFresh) {
    return { productos: cached!.productos, fromCache: true };
  }

  try {
    const res = await fetch(CATALOG_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const productos: CatalogProduct[] = data.productos ?? [];

    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
      fetchedAt: Date.now(),
      productos,
    } satisfies CacheShape));

    return { productos, fromCache: false };
  } catch (e) {
    // sin internet o la web falló: usamos lo último que tengamos guardado, aunque esté viejo
    if (cached) {
      return { productos: cached.productos, fromCache: true };
    }
    throw e;
  }
}
