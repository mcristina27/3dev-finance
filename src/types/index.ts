// ─── Movimientos (ingresos / gastos) ────────────────────────────────────────

export type EntryType = "income" | "expense";

/** Estado de cobro de un ingreso. Sin definir = se asume 'paid' (compatibilidad con registros viejos). */
export type PaymentStatus = "paid" | "pending";

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
  /** Solo relevante para ingresos generados desde un pedido/evento. Sin definir = pagado. */
  paymentStatus?: PaymentStatus;
  /** Id de la Activity (pedido/evento) que generó este ingreso, si aplica. */
  sourceActivityId?: string;
  createdAt: string;
}

// Alias de compatibilidad con código anterior
export type Transaction = Entry;
export type TransactionType = EntryType;

// ─── Insumos / materiales ────────────────────────────────────────────────────

export type MaterialUnit =
  | "g"
  | "kg"
  | "ml"
  | "l"
  | "unidad"
  | "metro"
  | "cm"
  | string;

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

// ─── Pedidos (pedidos individuales y ventas registradas en eventos) ──────────
// Nota: los EVENTOS COMO FECHA (el calendario "vamos a la feria X") viven en
// AgendaEvent, más abajo. Una Activity es una VENTA (individual o de evento)
// que genera ingreso y descuenta stock — no es una fecha en el calendario.

export type ActivityType = "order" | "event_sale" | "custom";

export interface ActivityItem {
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  /** Imagen del producto (del catálogo remoto), si aplica. */
  image?: string;
  /** Solo ventas de evento: cuántas unidades de este ítem se vendieron realmente (qty = cuántas llevaste). */
  qtySold?: number;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  date: string;
  /** Los 3 pasos de un pedido — independientes entre sí, no son un solo estado. */
  confirmed: boolean;
  /** Al marcarse true se genera el ingreso en Movimientos y se descuenta el stock (una sola vez). */
  paid: boolean;
  /** Al marcarse true, editar el pedido pide confirmación antes de abrir el formulario. */
  delivered: boolean;
  items?: ActivityItem[];
  totalAmount?: number;
  notes?: string;
  channel?: string;
  /** Solo type 'event_sale': a qué AgendaEvent (fecha del calendario) pertenece esta venta. */
  eventId?: string;
  relatedEntryId?: string;
  /** true = ya se descontó del stock y se generó el ingreso (evita duplicarlo si se vuelve a marcar 'paid'). */
  stockDeducted?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Agenda (calendario de eventos futuros) ──────────────────────────────────
// Puro planeamiento: fecha, lugar, notas. NO genera ingresos ni descuenta stock.
// Las ventas que se hacen en el evento se registran aparte, en Activity
// (type: 'event_sale'), y pueden anclarse acá vía Activity.eventId.

export interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Catálogo remoto (productos de 3devlabs.app) ─────────────────────────────

export interface CatalogProduct {
  id: number;
  code: string | null;
  name: string;
  category: string;
  price: number | null;
  image: string | null;
  tag: string;
  inStock: boolean;
}

// ─── Stock de productos (ligado al catálogo web) ─────────────────────────────

/**
 * Cantidad en stock de un producto del catálogo. `productId` es el id del
 * CatalogProduct (como string) — el API web solo trae inStock: boolean,
 * no cantidades, así que el conteo real vive acá, localmente.
 */
export interface ProductStock {
  productId: string;
  qty: number;
  updatedAt: string;
}

/**
 * Un movimiento de stock (suma, resta o fijado exacto). Sirve como mini
 * historial por producto — a futuro, base para métricas de reposición
 * y de qué tanto se vende cada producto.
 */
export interface StockMovement {
  id: string;
  productId: string;
  /** Cuánto cambió (positivo = entrada, negativo = salida). */
  delta: number;
  /** Cantidad resultante después de este movimiento. */
  resultingQty: number;
  /** 'venta' = descontado automáticamente por un pedido pagado. */
  reason?: "venta" | "reposicion" | "manual";
  createdAt: string;
}

// ─── Recetas (insumos por producto → costo real) ─────────────────────────────

export interface RecipeIngredient {
  materialId: string;
  qty: number; // cantidad de ese insumo que usa 1 unidad del producto
}

export interface Recipe {
  productId: string; // id del CatalogProduct (como string)
  ingredients: RecipeIngredient[];
  updatedAt: string;
}

// ─── Resúmenes ───────────────────────────────────────────────────────────────

export interface MonthSummary {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}
