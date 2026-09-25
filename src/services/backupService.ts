import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Todo lo que consideramos "tus datos" — no incluye el cache del catálogo
 * remoto (@antiva_catalog_cache), porque eso se puede volver a jalar de
 * la web en cualquier momento.
 */
export const BACKUP_KEYS = [
  "@antiva_transactions",
  "@antiva_materials",
  "@antiva_activities",
  "@antiva_agenda_events",
  "@antiva_stock",
  "@antiva_stock_history",
] as const;

const BACKUP_APP_ID = "antiva";
const BACKUP_VERSION = 1;

export interface BackupPayload {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
}

/** Junta todo lo guardado en el celular en un solo objeto listo para exportar. */
export async function buildBackupPayload(): Promise<BackupPayload> {
  const pairs = await AsyncStorage.multiGet(BACKUP_KEYS);
  const data: Record<string, unknown> = {};
  for (const [key, value] of pairs) {
    data[key] = value ? JSON.parse(value) : null;
  }
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export async function buildBackupString(): Promise<string> {
  const payload = await buildBackupPayload();
  return JSON.stringify(payload);
}

/** Valida (sin escribir nada todavía) que el texto pegado sea un respaldo de 3Dev Finance. */
export function parseBackupString(raw: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    throw new Error(
      "Ese texto no es un respaldo válido (no se pudo leer como JSON).",
    );
  }
  const payload = parsed as Partial<BackupPayload>;
  if (!payload || payload.app !== BACKUP_APP_ID || typeof payload.data !== "object") {
    throw new Error("Ese texto no parece ser un respaldo de 3Dev Finance.");
  }
  return payload as BackupPayload;
}

/** Sobrescribe los datos actuales del celular con los del respaldo. */
export async function restoreFromPayload(payload: BackupPayload): Promise<void> {
  const entries: [string, string][] = BACKUP_KEYS.filter(
    (key) => payload.data[key] !== undefined && payload.data[key] !== null,
  ).map((key) => [key, JSON.stringify(payload.data[key])]);

  if (entries.length === 0) {
    throw new Error("El respaldo no tiene datos para restaurar.");
  }
  await AsyncStorage.multiSet(entries);
}

/** Cuenta cuántos registros trae cada sección — para mostrarle un resumen antes de restaurar. */
export function summarizeBackup(payload: BackupPayload): string {
  const counts: string[] = [];
  const label: Record<string, string> = {
    "@antiva_transactions": "movimientos",
    "@antiva_materials": "insumos",
    "@antiva_activities": "pedidos",
    "@antiva_agenda_events": "eventos de agenda",
    "@antiva_stock": "productos con stock",
    "@antiva_stock_history": "movimientos de stock",
  };
  for (const key of BACKUP_KEYS) {
    const value = payload.data[key];
    if (Array.isArray(value) && value.length > 0) {
      counts.push(`${value.length} ${label[key] ?? key}`);
    }
  }
  return counts.length > 0 ? counts.join(" · ") : "sin datos";
}
