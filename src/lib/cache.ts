import AsyncStorage from "@react-native-async-storage/async-storage";

// Caché local defensiva: muestra datos al instante al abrir la app (antes de
// que responda la red) y permite lectura básica sin conexión. Nunca lanza:
// si falla, simplemente no hay caché.
export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignorar: la caché es best-effort
  }
}
