-- MÎJAH shop schema
-- This migration stores catalogue data and orders. Payment confirmation will be
-- handled later by a server-side Edge Function/webhook.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  image_url text,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null,
  last_name text not null,
  address text not null,
  postal_code text not null,
  city text not null,
  country text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  status text not null default 'pending' check (status in ('pending','paid','preparing','shipped','delivered','cancelled','refunded')),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  shipping numeric(10,2) not null default 0 check (shipping >= 0),
  total numeric(10,2) not null check (total >= 0),
  currency text not null default 'EUR' check (currency = 'EUR'),
  payment_provider text,
  payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists products_active_idx on public.products(active);
create index if not exists orders_customer_idx on public.orders(customer_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- Keep updated_at current when catalogue records are edited.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Public visitors may read active products only. Orders/customers are private
-- and will be written by a server-side Edge Function using the service role.
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "Public can view active products" on public.products;
create policy "Public can view active products"
on public.products for select
to anon, authenticated
using (active = true);

-- Initial MÎJAH catalogue. Prices match the current storefront.
insert into public.products (slug, name, description, price, image_url, stock)
values
  ('elixir', 'Élixir Anti-Chute', 'Sérum botanique renforçant pour réduire la chute et la casse.', 18.10, 'photosAndvideos/mijah-elixir-anti-chute.jpg', 0),
  ('rosemary', 'Huile de Croissance Rosemary', 'Huile botanique pressée à froid pour nourrir le cuir chevelu.', 12.80, 'photosAndvideos/mijah-rosemary-huile-croissance.jpg', 0),
  ('mango', 'Beurre Capillaire Mango', 'Beurre nourrissant pour hydrater et définir les boucles.', 14.90, 'photosAndvideos/mijah-mango-beurre-capillaire.jpg', 0)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  price = excluded.price,
  image_url = excluded.image_url,
  updated_at = now();
