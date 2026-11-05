import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { uuid } from '../lib/ids';
import {
  txToRow,
  matToRow,
  eventToRow,
  activityToRow,
  itemToRow,
} from '../lib/mappers';
import {
  Transaction,
  Material,
  Activity,
  AgendaEvent,
  ProductStock,
  StockMovement,
} from '../types';

// Migración única de los datos locales (AsyncStorage, de cuando la app era
// 100% offline) hacia Supabase, anclados al user_id de la sesión. Corre una
// sola vez por dispositivo/usuario (flag persistente). No borra lo local.
const FLAG = '@3devfinance_migrated_supabase_v1';

const OLD = {
  tx: '@3devfinance_transactions',
  mat: '@3devfinance_materials',
  act: '@3devfinance_activities',
  ev: '@3devfinance_agenda_events',
  stock: '@3devfinance_stock',
  hist: '@3devfinance_stock_history',
};

let inflight: Promise<void> | null = null;

export function migrateToSupabaseOnce(userId: string): Promise<void> {
  if (!inflight) {
    inflight = run(userId).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function readJSON<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function insertChunked(table: string, rows: any[]) {
  const CHUNK = 400;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from(table).insert(slice);
    if (error) throw error;
  }
}

async function run(userId: string): Promise<void> {
  const done = await AsyncStorage.getItem(FLAG);
  if (done) return;

  const [oldTx, oldMat, oldAct, oldEv, oldStock, oldHist] = await Promise.all([
    readJSON<Transaction>(OLD.tx),
    readJSON<Material>(OLD.mat),
    readJSON<Activity>(OLD.act),
    readJSON<AgendaEvent>(OLD.ev),
    readJSON<ProductStock>(OLD.stock),
    readJSON<StockMovement>(OLD.hist),
  ]);

  const nada =
    !oldTx.length &&
    !oldMat.length &&
    !oldAct.length &&
    !oldEv.length &&
    !oldStock.length &&
    !oldHist.length;
  if (nada) {
    await AsyncStorage.setItem(FLAG, new Date().toISOString());
    return;
  }

  // Remapeo de ids locales (numéricos) -> uuid, para respetar las FKs.
  const evMap = new Map<string, string>();
  oldEv.forEach(e => evMap.set(e.id, uuid()));
  const actMap = new Map<string, string>();
  oldAct.forEach(a => actMap.set(a.id, uuid()));
  const txMap = new Map<string, string>();
  oldTx.forEach(t => txMap.set(t.id, uuid()));

  // 1) agenda_events (sin dependencias)
  if (oldEv.length) {
    const rows = oldEv.map(e => eventToRow({ ...e, id: evMap.get(e.id)! }, userId));
    await insertChunked('agenda_events', rows);
  }

  // 2) activities — SIN related_entry_id todavía (FK circular con transactions).
  //    event_id sí se puede, los eventos ya existen.
  if (oldAct.length) {
    const rows = oldAct.map(a =>
      activityToRow(
        {
          ...a,
          id: actMap.get(a.id)!,
          eventId: a.eventId ? evMap.get(a.eventId) ?? undefined : undefined,
          relatedEntryId: undefined,
        },
        userId,
      ),
    );
    await insertChunked('activities', rows);

    // activity_items
    const itemRows: any[] = [];
    oldAct.forEach(a =>
      (a.items ?? []).forEach(it => itemRows.push(itemToRow(it, actMap.get(a.id)!, userId))),
    );
    if (itemRows.length) await insertChunked('activity_items', itemRows);
  }

  // 3) transactions — las actividades ya existen, así que source_activity_id es válido.
  if (oldTx.length) {
    const rows = oldTx.map(t =>
      txToRow(
        {
          ...t,
          id: txMap.get(t.id)!,
          sourceActivityId: t.sourceActivityId
            ? actMap.get(t.sourceActivityId) ?? undefined
            : undefined,
        },
        userId,
      ),
    );
    await insertChunked('transactions', rows);
  }

  // 4) completar related_entry_id en las actividades que lo tenían.
  for (const a of oldAct) {
    if (a.relatedEntryId && txMap.get(a.relatedEntryId)) {
      const { error } = await supabase
        .from('activities')
        .update({ related_entry_id: txMap.get(a.relatedEntryId) })
        .eq('id', actMap.get(a.id)!);
      if (error) throw error;
    }
  }

  // 5) materials (id propio)
  if (oldMat.length) {
    const rows = oldMat.map(m => matToRow({ ...m, id: uuid() }, userId));
    await insertChunked('materials', rows);
  }

  // 6) product_stock (PK user_id + product_id) -> upsert
  if (oldStock.length) {
    const rows = oldStock.map(s => ({
      user_id: userId,
      product_id: s.productId,
      qty: s.qty,
      updated_at: s.updatedAt ?? new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('product_stock')
      .upsert(rows, { onConflict: 'user_id,product_id' });
    if (error) throw error;
  }

  // 7) stock_movements (id propio)
  if (oldHist.length) {
    const rows = oldHist.map(h => ({
      id: uuid(),
      user_id: userId,
      product_id: h.productId,
      delta: h.delta,
      resulting_qty: h.resultingQty,
      reason: h.reason ?? null,
      created_at: h.createdAt,
    }));
    await insertChunked('stock_movements', rows);
  }

  await AsyncStorage.setItem(FLAG, new Date().toISOString());
}
