// ─── Movimientos (ingresos / gastos) ────────────────────────────────────────

export type EntryType = 'income' | 'expense';

export interface Entry {
  id: string;
  type: EntryType;
  name: string;
  amount: number;
  date: string;
  notes?: string;
  photos?: string[];
  category?: string;
  channel?: string; // feria, online, pedido directo, etc.
  createdAt: string;
}

// Alias de compatibilidad con código anterior
export type Transaction = Entry;
export type TransactionType = EntryType;

// ─── Insumos / materiales ────────────────────────────────────────────────────

export type MaterialUnit = 'g' | 'kg' | 'ml' | 'l' | 'unidad' | 'metro' | 'cm' | string;

export interface Material {
  id: string;
  name: string;
  unit: MaterialUnit;
  stock: number;
  minStock?: number;
  costPerUnit: number;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Agenda (eventos y pedidos) ──────────────────────────────────────────────

export type ActivityType = 'event' | 'order' | 'custom';
export type ActivityStatus = 'pending' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';

export interface ActivityItem {
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;
  status: ActivityStatus;
  items?: ActivityItem[];
  totalAmount?: number;
  notes?: string;
  channel?: string;
  relatedEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Resúmenes ───────────────────────────────────────────────────────────────

export interface MonthSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
