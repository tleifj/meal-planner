-- ============================================================================
-- Functions, triggers, RPCs
-- ============================================================================

-- Auto-create profile row on signup. display_name from user metadata, fallback to local-part of email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generate unambiguous 8-char invite code (no 0/O/1/I).
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text := '';
  i int;
begin
  for i in 1..8 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end;
$$;

-- Populate invite_code on insert if not set.
create or replace function public.families_before_insert()
returns trigger
language plpgsql
as $$
begin
  if new.invite_code is null or length(new.invite_code) = 0 then
    loop
      new.invite_code := public.generate_invite_code();
      exit when not exists(select 1 from public.families where invite_code = new.invite_code);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_families_before_insert on public.families;
create trigger trg_families_before_insert
  before insert on public.families
  for each row execute function public.families_before_insert();

-- Create a family, set caller as owner, and join caller.
create or replace function public.create_family(p_name text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  fid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.families (name, created_by)
  values (p_name, auth.uid())
  returning id into fid;

  insert into public.family_members (family_id, user_id, role)
  values (fid, auth.uid(), 'owner');

  update public.profiles set family_id = fid where id = auth.uid();

  return fid;
end;
$$;

-- Join a family via invite code.
create or replace function public.join_family(p_code text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  fid uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select id into fid from public.families where invite_code = upper(p_code);
  if fid is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (fid, auth.uid(), 'member')
  on conflict do nothing;

  update public.profiles set family_id = fid where id = auth.uid();

  return fid;
end;
$$;

-- Regenerate a family's invite code (owner only).
create or replace function public.regenerate_invite_code(p_family_id uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  new_code text;
begin
  if not exists(
    select 1 from public.family_members
    where family_id = p_family_id and user_id = auth.uid() and role = 'owner'
  ) and not public.auth_is_admin() then
    raise exception 'only family owners can regenerate invite code';
  end if;

  loop
    new_code := public.generate_invite_code();
    exit when not exists(select 1 from public.families where invite_code = new_code);
  end loop;

  update public.families set invite_code = new_code where id = p_family_id;
  return new_code;
end;
$$;

-- Atomic upsert: add a library item to a list, or bump its quantity.
create or replace function public.add_to_grocery_list(
  p_list_id uuid,
  p_library_item_id uuid,
  p_quantity numeric default 1,
  p_unit text default null,
  p_note text default null
) returns public.grocery_list_items
language plpgsql security invoker set search_path = public
as $$
declare
  result public.grocery_list_items;
begin
  insert into public.grocery_list_items
    (list_id, library_item_id, quantity, unit, note, added_by)
  values (p_list_id, p_library_item_id, p_quantity, p_unit, p_note, auth.uid())
  on conflict (list_id, library_item_id) do update set
    quantity = public.grocery_list_items.quantity + excluded.quantity,
    unit = coalesce(excluded.unit, public.grocery_list_items.unit),
    note = coalesce(excluded.note, public.grocery_list_items.note),
    checked = false,
    checked_by = null,
    checked_at = null
  returning * into result;
  return result;
end;
$$;

-- Flush a meal's ingredients onto a list (merges per library item).
create or replace function public.add_meal_to_list(
  p_list_id uuid,
  p_meal_id uuid,
  p_mult numeric default 1
) returns setof public.grocery_list_items
language plpgsql security invoker set search_path = public
as $$
begin
  return query
    insert into public.grocery_list_items
      (list_id, library_item_id, quantity, unit, added_by)
    select p_list_id, mi.library_item_id, mi.quantity * p_mult, mi.unit, auth.uid()
      from public.meal_ingredients mi
     where mi.meal_id = p_meal_id
    on conflict (list_id, library_item_id) do update set
      quantity = public.grocery_list_items.quantity + excluded.quantity,
      checked = false,
      checked_by = null,
      checked_at = null
    returning *;
end;
$$;

grant execute on function public.create_family(text)                          to authenticated;
grant execute on function public.join_family(text)                            to authenticated;
grant execute on function public.regenerate_invite_code(uuid)                 to authenticated;
grant execute on function public.add_to_grocery_list(uuid, uuid, numeric, text, text) to authenticated;
grant execute on function public.add_meal_to_list(uuid, uuid, numeric)        to authenticated;
