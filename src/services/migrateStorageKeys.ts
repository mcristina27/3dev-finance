import AsyncStorage from '@react-native-async-storage/async-storage';

// Migración única: copia los datos guardados bajo las claves viejas
// (@antiva_*, de cuando la app se llamaba Antiva) a las nuevas claves
// @3devfinance_*. No borra las claves viejas — solo copia si el destino
// todavía no existe — así nunca se pierde nada aunque la migración se
// interrumpa o corra más de una vez.
const KEY_MIGRATIONS: [oldKey: string, newKey: string][] = [
  ['@antiva_transactions', '@3devfinance_transactions'],
  ['@antiva_materials', '@3devfinance_materials'],
  ['@antiva_activities', '@3devfinance_activities'],
  ['@antiva_agenda_events', '@3devfinance_agenda_events'],
  ['@antiva_stock', '@3devfinance_stock'],
  ['@antiva_stock_history', '@3devfinance_stock_history'],
  ['@antiva_catalog_cache', '@3devfinance_catalog_cache'],
];

export async function migrateStorageKeys(): Promise<void> {
  try {
    for (const [oldKey, newKey] of KEY_MIGRATIONS) {
      const already = await AsyncStorage.getItem(newKey);
      if (already !== null) continue;
      const old = await AsyncStorage.getItem(oldKey);
      if (old !== null) {
        await AsyncStorage.setItem(newKey, old);
      }
    }
  } catch (e) {
    console.warn('No se pudo migrar las claves de almacenamiento antiguas', e);
  }
}
