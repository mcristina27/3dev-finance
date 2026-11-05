// Mapeo entre las filas de Supabase (snake_case) y los tipos de dominio
// (camelCase) que usan los contextos y las pantallas. Las funciones *ToRow
// reciben el userId para anclar cada fila al usuario (RLS: auth.uid() = user_id).
import {
  Transaction,
  Material,
  AgendaEvent,
  Activity,
  ActivityItem,
  ProductStock,
  StockMovement,
} from "../types";
import { uuid } from "./ids";

const num = (v: any): number => (v == null ? 0 : Number(v));
const dateOnly = (v: string | undefined): string => (v ?? "").slice(0, 10);

// ─── transactions ───────────────────────────────────────────────────────────
export function txFromRow(r: any): Transaction {
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    amount: num(r.amount),
    date: r.date,
    notes: r.notes ?? undefined,
    photos: r.photos ?? undefined,
    category: r.category ?? undefined,
    channel: r.channel ?? undefined,
    paymentStatus: r.payment_status ?? undefined,
    sourceActivityId: r.source_activity_id ?? undefined,
    createdAt: r.created_at,
  };
}
export function txToRow(t: Transaction, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    type: t.type,
    name: t.name,
    amount: t.amount,
    date: dateOnly(t.date),
    notes: t.notes ?? null,
    photos: t.photos ?? null,
    category: t.category ?? null,
    channel: t.channel ?? null,
    payment_status: t.paymentStatus ?? null,
    source_activity_id: t.sourceActivityId ?? null,
    created_at: t.createdAt,
  };
}

// ─── materials ──────────────────────────────────────────────────────────────
export function matFromRow(r: any): Material {
  return {
    id: r.id,
    name: r.name,
    unit: r.unit,
    stock: num(r.stock),
    minStock: r.min_stock == null ? undefined : num(r.min_stock),
    costPerUnit: num(r.cost_per_unit),
    category: r.category ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
export function matToRow(m: Material, userId: string) {
  return {
    id: m.id,
    user_id: userId,
    name: m.name,
    unit: m.unit,
    stock: m.stock,
    min_stock: m.minStock ?? null,
    cost_per_unit: m.costPerUnit,
    category: m.category ?? null,
    notes: m.notes ?? null,
    created_at: m.createdAt,
    updated_at: m.updatedAt,
  };
}

// ─── agenda_events ──────────────────────────────────────────────────────────
export function eventFromRow(r: any): AgendaEvent {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    location: r.location ?? undefined,
    notes: r.notes ?? undefined,
    color: r.color ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
export function eventToRow(e: AgendaEvent, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    title: e.title,
    date: dateOnly(e.date),
    location: e.location ?? null,
    notes: e.notes ?? null,
    color: e.color ?? null,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  };
}

// ─── activities (sin items; los items van en su propia tabla) ────────────────
export function activityFromRow(r: any, items: ActivityItem[]): Activity {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    date: r.date,
    confirmed: !!r.confirmed,
    paid: !!r.paid,
    delivered: !!r.delivered,
    items,
    totalAmount: r.total_amount == null ? undefined : num(r.total_amount),
    notes: r.notes ?? undefined,
    channel: r.channel ?? undefined,
    eventId: r.event_id ?? undefined,
    relatedEntryId: r.related_entry_id ?? undefined,
    stockDeducted: !!r.stock_deducted,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
export function activityToRow(a: Activity, userId: string) {
  return {
    id: a.id,
    user_id: userId,
    type: a.type,
    title: a.title,
    date: dateOnly(a.date),
    confirmed: a.confirmed,
    paid: a.paid,
    delivered: a.delivered,
    total_amount: a.totalAmount ?? null,
    notes: a.notes ?? null,
    channel: a.channel ?? null,
    event_id: a.eventId ?? null,
    related_entry_id: a.relatedEntryId ?? null,
    stock_deducted: a.stockDeducted ?? false,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}

// ─── activity_items ─────────────────────────────────────────────────────────
export function itemFromRow(r: any): ActivityItem {
  return {
    productId: r.product_id ?? undefined,
    name: r.name,
    qty: num(r.qty),
    unitPrice: num(r.unit_price),
    image: r.image ?? undefined,
    qtySold: r.qty_sold == null ? undefined : num(r.qty_sold),
  };
}
export function itemToRow(it: ActivityItem, activityId: string, userId: string) {
  return {
    id: uuid(),
    activity_id: activityId,
    user_id: userId,
    product_id: it.productId ?? null,
    name: it.name,
    qty: it.qty,
    unit_price: it.unitPrice,
    image: it.image ?? null,
    qty_sold: it.qtySold ?? null,
  };
}

// ─── product_stock ──────────────────────────────────────────────────────────
export function stockFromRow(r: any): ProductStock {
  return {
    productId: r.product_id,
    qty: num(r.qty),
    updatedAt: r.updated_at,
  };
}

// ─── stock_movements ────────────────────────────────────────────────────────
export function movementFromRow(r: any): StockMovement {
  return {
    id: r.id,
    productId: r.product_id,
    delta: num(r.delta),
    resultingQty: num(r.resulting_qty),
    reason: r.reason ?? undefined,
    createdAt: r.created_at,
  };
}
