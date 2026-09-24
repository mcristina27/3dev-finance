-- 3Dev Finanzas — esquema inicial Supabase
-- Aplicar con: supabase db push, o pegar en el SQL Editor del proyecto.

create extension if not exists "pgcrypto";

-- ─── Función helper: updated_at automático ─────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── transactions (Entry) ───────────────────────────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  name text not null,
  amount numeric(12,2) not null,
  date date not null,
  notes text,
  photos text[],               -- rutas dentro del bucket 'receipts'
  category text,
  channel text,
  payment_status text check (payment_status in ('paid','pending')),
  source_activity_id uuid,     -- FK a activities, se agrega luego (orden de creación)
  created_at timestamptz not null default now()
);

-- ─── materials (Material / insumos) ─────────────────────────────────────────
create table materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  unit text not null,
  stock numeric(12,3) not null default 0,
  min_stock numeric(12,3),
  cost_per_unit numeric(12,4) not null default 0,
  category text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger materials_set_updated_at before update on materials
  for each row execute function set_updated_at();

-- ─── agenda_events ───────────────────────────────────────────────────────────
create table agenda_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  date date not null,
  location text,
  notes text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger agenda_events_set_updated_at before update on agenda_events
  for each row execute function set_updated_at();

-- ─── activities (pedidos y ventas de evento) ────────────────────────────────
create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('order','event_sale','custom')),
  title text not null,
  date date not null,
  confirmed boolean not null default false,
  paid boolean not null default false,
  delivered boolean not null default false,
  total_amount numeric(12,2),
  notes text,
  channel text,
  event_id uuid references agenda_events(id) on delete set null,
  related_entry_id uuid references transactions(id) on delete set null,
  stock_deducted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger activities_set_updated_at before update on activities
  for each row execute function set_updated_at();

alter table transactions
  add constraint transactions_source_activity_id_fkey
  foreign key (source_activity_id) references activities(id) on delete set null;

-- ─── activity_items (ActivityItem[], tabla aparte para reportes por producto) ─
create table activity_items (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references activities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text,             -- id del CatalogProduct remoto, como texto
  name text not null,
  qty numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  image text,
  qty_sold numeric(12,3),      -- solo event_sale: cuánto se vendió realmente
  created_at timestamptz not null default now()
);

-- ─── product_stock (ProductStock) ───────────────────────────────────────────
create table product_stock (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  qty numeric(12,3) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ─── stock_movements (StockMovement) ────────────────────────────────────────
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  delta numeric(12,3) not null,
  resulting_qty numeric(12,3) not null,
  reason text check (reason in ('venta','reposicion','manual')),
  created_at timestamptz not null default now()
);

-- ─── recipes + recipe_ingredients ───────────────────────────────────────────
create table recipes (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  material_id uuid not null references materials(id) on delete cascade,
  qty numeric(12,4) not null,
  foreign key (user_id, product_id) references recipes(user_id, product_id) on delete cascade
);

-- ─── Índices ─────────────────────────────────────────────────────────────────
create index on transactions (user_id, date desc);
create index on activities (user_id, date desc);
create index on activity_items (activity_id);
create index on stock_movements (user_id, product_id, created_at desc);

-- ─── RLS: cada quien ve y toca solo lo suyo ─────────────────────────────────
alter table transactions       enable row level security;
alter table materials          enable row level security;
alter table agenda_events      enable row level security;
alter table activities         enable row level security;
alter table activity_items     enable row level security;
alter table product_stock      enable row level security;
alter table stock_movements    enable row level security;
alter table recipes            enable row level security;
alter table recipe_ingredients enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'transactions','materials','agenda_events','activities',
    'activity_items','product_stock','stock_movements','recipes','recipe_ingredients'
  ]
  loop
    execute format(
      'create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t
    );
  end loop;
end $$;

-- ─── RPC: pagar un pedido/venta en una sola transacción ─────────────────────
-- Descuenta stock por cada item, registra el movimiento, crea el ingreso y
-- marca stock_deducted — todo o nada, y nunca se duplica si ya estaba hecho.
create or replace function pay_activity(p_activity_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_activity activities%rowtype;
  v_item activity_items%rowtype;
  v_new_qty numeric;
  v_entry_id uuid;
begin
  select * into v_activity from activities
    where id = p_activity_id and user_id = auth.uid()
    for update;

  if not found then
    raise exception 'Actividad no encontrada';
  end if;

  if v_activity.stock_deducted then
    return v_activity.related_entry_id; -- ya se procesó, no repetir
  end if;

  for v_item in
    select * from activity_items where activity_id = p_activity_id
  loop
    if v_item.product_id is not null then
      insert into product_stock (user_id, product_id, qty)
        values (auth.uid(), v_item.product_id, -coalesce(v_item.qty_sold, v_item.qty))
      on conflict (user_id, product_id)
        do update set qty = product_stock.qty - coalesce(v_item.qty_sold, v_item.qty),
                       updated_at = now()
      returning qty into v_new_qty;

      insert into stock_movements (user_id, product_id, delta, resulting_qty, reason)
        values (auth.uid(), v_item.product_id, -coalesce(v_item.qty_sold, v_item.qty), v_new_qty, 'venta');
    end if;
  end loop;

  insert into transactions (user_id, type, name, amount, date, channel, payment_status, source_activity_id)
    values (
      auth.uid(), 'income', v_activity.title, coalesce(v_activity.total_amount, 0),
      v_activity.date, v_activity.channel,
      case when v_activity.paid then 'paid' else 'pending' end,
      v_activity.id
    )
    returning id into v_entry_id;

  update activities
    set stock_deducted = true, related_entry_id = v_entry_id
    where id = p_activity_id;

  return v_entry_id;
end;
$$;

-- ─── Storage: bucket privado para fotos de movimientos ──────────────────────
insert into storage.buckets (id, name, public)
  values ('receipts', 'receipts', false)
  on conflict (id) do nothing;

create policy "own receipts read" on storage.objects for select
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own receipts write" on storage.objects for insert
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own receipts update" on storage.objects for update
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own receipts delete" on storage.objects for delete
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);
