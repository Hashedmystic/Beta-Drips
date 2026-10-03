begin;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  request_hash text not null,
  delivery jsonb not null,
  total_naira bigint not null check (total_naira > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);
create index orders_user_created on public.orders(user_id, created_at desc);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null,
  name text not null,
  brand text not null,
  size text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price_naira bigint not null check (unit_price_naira > 0),
  unique (order_id, product_id, size)
);
create table public.order_emails (
  order_id uuid primary key references public.orders(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','accepted','failed','unknown','not_configured')),
  provider_message_id text,
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_emails enable row level security;
-- Explicit grants: do not depend on automatic table exposure or default privileges.
-- USAGE allows access to the schema; SELECT allows reads, which RLS then filters.
grant usage on schema public to authenticated, service_role;
revoke all on public.orders, public.order_items, public.order_emails from public, anon, authenticated;
grant select on public.orders, public.order_items, public.order_emails to authenticated;
grant all on public.orders, public.order_items, public.order_emails to service_role;
create policy own_orders on public.orders for select to authenticated using ((select auth.uid()) = user_id);
create policy own_items on public.order_items for select to authenticated using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = (select auth.uid()))
);
create policy own_emails on public.order_emails for select to authenticated using (
  exists (select 1 from public.orders where orders.id = order_emails.order_id and orders.user_id = (select auth.uid()))
);

-- Only the verified server may call this transaction. Browser roles cannot write.
create function public.save_order(p_user_id uuid, p_key uuid, p_hash text, p_delivery jsonb, p_items jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  saved public.orders;
  calculated_total bigint;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || p_key::text, 0));
  select * into saved from public.orders where user_id = p_user_id and idempotency_key = p_key;
  if found then
    if saved.request_hash <> p_hash then
      raise exception 'IDEMPOTENCY_CONFLICT';
    end if;
  else
    if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 100 then
      raise exception 'INVALID_ITEMS';
    end if;
    select sum((item->>'quantity')::bigint * (item->>'unit_price_naira')::bigint)
      into calculated_total from jsonb_array_elements(p_items) item;
    insert into public.orders(user_id, idempotency_key, request_hash, delivery, total_naira)
      values(p_user_id, p_key, p_hash, p_delivery, calculated_total) returning * into saved;
    insert into public.order_items(order_id, product_id, name, brand, size, quantity, unit_price_naira)
      select saved.id, item->>'product_id', item->>'name', item->>'brand', item->>'size',
        (item->>'quantity')::integer, (item->>'unit_price_naira')::bigint
      from jsonb_array_elements(p_items) item;
    insert into public.order_emails(order_id) values(saved.id);
  end if;
  return to_jsonb(saved) || jsonb_build_object(
    'order_items', (select jsonb_agg(to_jsonb(i)) from public.order_items i where i.order_id = saved.id),
    'order_emails', (select to_jsonb(e) from public.order_emails e where e.order_id = saved.id)
  );
end;
$$;
revoke all on function public.save_order(uuid, uuid, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_order(uuid, uuid, text, jsonb, jsonb) to service_role;
commit;
