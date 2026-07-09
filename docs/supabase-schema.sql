-- Prevedello Market - esquema propuesto.
-- NO ejecutar sin revisar el proyecto Supabase seleccionado, backups y politicas RLS.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  icon text,
  sort_order integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  logo_url text,
  sort_order integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  sku text,
  name text not null,
  brand text,
  category text,
  unit text,
  price numeric(12, 2),
  availability text not null default 'Disponible'
    check (availability in ('Disponible', 'A confirmar', 'Bajo pedido')),
  description text,
  uses text[] not null default '{}',
  related text[] not null default '{}',
  image_url text,
  image_tone text,
  stock_note text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_location text,
  delivery_type text not null default 'Envio a domicilio',
  notes text,
  status text not null default 'nuevo',
  source text not null default 'web',
  created_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid not null references public.quote_requests(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  unit text,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid references public.quote_requests(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  body text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid references public.quote_requests(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  title text not null,
  task_type text not null default 'recontactar',
  responsible text,
  due_at timestamptz,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'completada', 'vencida')),
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.quote_requests enable row level security;
alter table public.quote_items enable row level security;
alter table public.crm_notes enable row level security;
alter table public.crm_tasks enable row level security;

create policy "public read active categories"
on public.categories for select
using (is_active = true);

create policy "public read active brands"
on public.brands for select
using (is_active = true);

create policy "public read active products"
on public.products for select
using (is_active = true);

create policy "public create customers"
on public.customers for insert
with check (true);

create policy "public create quote requests"
on public.quote_requests for insert
with check (source = 'web');

create policy "public create quote items"
on public.quote_items for insert
with check (true);

-- Para escritura desde admin real, conviene usar usuarios autenticados con rol interno
-- o endpoints server-side. No exponer service_role en el frontend.
