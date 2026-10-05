begin;
create table public.customer_carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]' check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 100),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
create table public.cart_operations (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  request_hash text not null,
  primary key (user_id, operation_id)
);
alter table public.customer_carts enable row level security;
alter table public.cart_operations enable row level security;
grant usage on schema public to authenticated, service_role;
revoke all on public.customer_carts, public.cart_operations from public, anon, authenticated;
grant select on public.customer_carts to authenticated;
grant all on public.customer_carts, public.cart_operations to service_role;
create policy own_cart on public.customer_carts for select to authenticated
  using ((select auth.uid()) = user_id);

-- Both cart mutations and checkout take the same customer lock.
create function public.change_cart(p_user_id uuid, p_operation_id uuid, p_hash text,
  p_revision bigint, p_mode text, p_items jsonb)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  cart public.customer_carts;
  prior text;
  merged jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('cart:' || p_user_id::text, 0));
  insert into public.customer_carts(user_id) values(p_user_id) on conflict do nothing;
  select * into cart from public.customer_carts where user_id = p_user_id;
  select request_hash into prior from public.cart_operations
    where user_id = p_user_id and operation_id = p_operation_id;
  if found then
    if prior <> p_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return to_jsonb(cart);
  end if;
  if p_mode not in ('replace', 'merge') or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) > 100 then raise exception 'INVALID_ITEMS'; end if;
  if p_mode = 'replace' then
    if cart.revision <> p_revision then raise exception 'CART_CONFLICT'; end if;
    merged := p_items;
  else
    select coalesce(jsonb_agg(jsonb_build_object('productId', product, 'size', size, 'quantity', quantity)
      order by product, size), '[]'::jsonb) into merged
    from (select item->>'productId' product, item->>'size' size,
      sum((item->>'quantity')::integer) quantity
      from jsonb_array_elements(cart.items || p_items) item
      group by item->>'productId', item->>'size') lines;
  end if;
  if jsonb_array_length(merged) > 100 or exists (
    select 1 from jsonb_array_elements(merged) item
    where (item->>'quantity')::numeric not between 1 and 99
      or (item->>'quantity')::numeric <> trunc((item->>'quantity')::numeric)
      or item->>'productId' is null or item->>'size' is null
  ) then raise exception 'CART_LIMIT'; end if;
  update public.customer_carts set items = merged, revision = revision + 1, updated_at = now()
    where user_id = p_user_id returning * into cart;
  insert into public.cart_operations values(p_user_id, p_operation_id, p_hash);
  return to_jsonb(cart);
end;
$$;

-- Wrap the previously applied order function without modifying its migration.
-- Existing retry keys recover their order BEFORE any cart check or clearing.
create function public.save_cart_order(p_user_id uuid, p_key uuid, p_hash text,
  p_delivery jsonb, p_items jsonb, p_revision bigint)
returns jsonb language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  cart public.customer_carts;
  expected jsonb;
  saved jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('cart:' || p_user_id::text, 0));
  if exists(select 1 from public.orders where user_id = p_user_id and idempotency_key = p_key) then
    return public.save_order(p_user_id, p_key, p_hash, p_delivery, p_items);
  end if;
  select * into cart from public.customer_carts where user_id = p_user_id;
  if not found or cart.revision <> p_revision then raise exception 'CART_CONFLICT'; end if;
  select jsonb_agg(jsonb_build_object('productId', item->>'product_id', 'size', item->>'size',
    'quantity', (item->>'quantity')::integer) order by item->>'product_id', item->>'size')
    into expected from jsonb_array_elements(p_items) item;
  if (select jsonb_agg(item order by item->>'productId', item->>'size')
    from jsonb_array_elements(cart.items) item) is distinct from expected then
    raise exception 'CART_CONFLICT';
  end if;
  saved := public.save_order(p_user_id, p_key, p_hash, p_delivery, p_items);
  update public.customer_carts set items = '[]', revision = revision + 1, updated_at = now()
    where user_id = p_user_id;
  return saved;
end;
$$;
revoke all on function public.change_cart(uuid, uuid, text, bigint, text, jsonb) from public, anon, authenticated;
grant execute on function public.change_cart(uuid, uuid, text, bigint, text, jsonb) to service_role;
revoke all on function public.save_cart_order(uuid, uuid, text, jsonb, jsonb, bigint) from public, anon, authenticated;
grant execute on function public.save_cart_order(uuid, uuid, text, jsonb, jsonb, bigint) to service_role;
commit;
