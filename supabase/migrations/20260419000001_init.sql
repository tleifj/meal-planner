-- ============================================================================
-- Meal Planner — Initial schema, RLS, helpers
-- ============================================================================

create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table public.families (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  invite_code   text unique not null,
  created_by    uuid,
  created_at    timestamptz not null default now()
);

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  avatar_url    text,
  family_id     uuid references public.families(id) on delete set null,
  role          text not null default 'member' check (role in ('member','admin')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_profiles_family_id on public.profiles(family_id);

alter table public.families
  add constraint families_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

create table public.family_members (
  family_id   uuid not null references public.families(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner','member')),
  joined_at   timestamptz not null default now(),
  primary key (family_id, user_id)
);
create index idx_family_members_user_id on public.family_members(user_id);

create table public.grocery_categories (
  id           smallint primary key,
  slug         text unique not null,
  name         text not null,
  sort_order   smallint not null,
  icon         text
);

create table public.grocery_library_items (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  category_id   smallint not null references public.grocery_categories(id),
  default_unit  text,
  is_global     boolean not null default true,
  created_by    uuid references public.profiles(id) on delete set null,
  family_id     uuid references public.families(id) on delete cascade,
  created_at    timestamptz not null default now()
);
create index idx_library_category on public.grocery_library_items(category_id);
create index idx_library_family   on public.grocery_library_items(family_id);
create index idx_library_name_trgm on public.grocery_library_items using gin (lower(name) gin_trgm_ops);
create unique index uq_library_global_name on public.grocery_library_items(lower(name)) where is_global = true;

create table public.grocery_lists (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  name         text not null,
  created_by   uuid references public.profiles(id) on delete set null,
  archived_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index idx_lists_family on public.grocery_lists(family_id);

create table public.grocery_list_items (
  id                uuid primary key default gen_random_uuid(),
  list_id           uuid not null references public.grocery_lists(id) on delete cascade,
  library_item_id   uuid not null references public.grocery_library_items(id),
  quantity          numeric(10,2) not null default 1,
  unit              text,
  note              text,
  checked           boolean not null default false,
  checked_by        uuid references public.profiles(id) on delete set null,
  checked_at        timestamptz,
  added_by          uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (list_id, library_item_id)
);
create index idx_list_items_list on public.grocery_list_items(list_id);

create table public.meals (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  name         text not null,
  description  text,
  image_path   text,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_meals_family on public.meals(family_id);

create table public.meal_ingredients (
  id               uuid primary key default gen_random_uuid(),
  meal_id          uuid not null references public.meals(id) on delete cascade,
  library_item_id  uuid not null references public.grocery_library_items(id),
  quantity         numeric(10,2) not null default 1,
  unit             text,
  note             text,
  unique (meal_id, library_item_id)
);
create index idx_meal_ing_meal on public.meal_ingredients(meal_id);

create table public.meal_plans (
  id           uuid primary key default gen_random_uuid(),
  family_id    uuid not null references public.families(id) on delete cascade,
  week_start   date not null,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  unique (family_id, week_start)
);

create table public.meal_plan_meals (
  id                   uuid primary key default gen_random_uuid(),
  plan_id              uuid not null references public.meal_plans(id) on delete cascade,
  meal_id              uuid not null references public.meals(id) on delete cascade,
  day_of_week          smallint check (day_of_week between 0 and 6),
  meal_slot            text check (meal_slot in ('breakfast','lunch','dinner','snack')),
  servings_multiplier  numeric(4,2) not null default 1,
  added_to_list_at     timestamptz
);
create index idx_plan_meals_plan on public.meal_plan_meals(plan_id);

create table public.meal_favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  meal_id     uuid not null references public.meals(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, meal_id)
);

-- ----------------------------------------------------------------------------
-- Helper functions for RLS
-- ----------------------------------------------------------------------------

create or replace function public.auth_family_ids()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select family_id from public.family_members where user_id = auth.uid()
$$;

create or replace function public.auth_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

alter table public.profiles              enable row level security;
alter table public.families              enable row level security;
alter table public.family_members        enable row level security;
alter table public.grocery_categories    enable row level security;
alter table public.grocery_library_items enable row level security;
alter table public.grocery_lists         enable row level security;
alter table public.grocery_list_items    enable row level security;
alter table public.meals                 enable row level security;
alter table public.meal_ingredients      enable row level security;
alter table public.meal_plans            enable row level security;
alter table public.meal_plan_meals       enable row level security;
alter table public.meal_favorites        enable row level security;

-- profiles: self, family members, admins
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or family_id in (select public.auth_family_ids()) or public.auth_is_admin());
create policy "profiles_insert_self" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles_update_self_or_admin" on public.profiles for update to authenticated
  using (id = auth.uid() or public.auth_is_admin())
  with check (id = auth.uid() or public.auth_is_admin());

-- families
create policy "families_select" on public.families for select to authenticated
  using (id in (select public.auth_family_ids()) or public.auth_is_admin());
create policy "families_insert" on public.families for insert to authenticated
  with check (true);
create policy "families_update_owner_admin" on public.families for update to authenticated
  using (
    exists(select 1 from public.family_members fm where fm.family_id = families.id and fm.user_id = auth.uid() and fm.role = 'owner')
    or public.auth_is_admin()
  );
create policy "families_delete_owner_admin" on public.families for delete to authenticated
  using (
    exists(select 1 from public.family_members fm where fm.family_id = families.id and fm.user_id = auth.uid() and fm.role = 'owner')
    or public.auth_is_admin()
  );

-- family_members
create policy "fm_select" on public.family_members for select to authenticated
  using (family_id in (select public.auth_family_ids()) or public.auth_is_admin());
create policy "fm_insert_self" on public.family_members for insert to authenticated
  with check (user_id = auth.uid());
create policy "fm_delete_self_or_owner" on public.family_members for delete to authenticated
  using (
    user_id = auth.uid()
    or exists(select 1 from public.family_members fm where fm.family_id = family_members.family_id and fm.user_id = auth.uid() and fm.role = 'owner')
    or public.auth_is_admin()
  );

-- categories: public read, admin write
create policy "cat_select_all" on public.grocery_categories for select to authenticated using (true);
create policy "cat_write_admin" on public.grocery_categories for all to authenticated
  using (public.auth_is_admin()) with check (public.auth_is_admin());

-- library items
create policy "lib_select" on public.grocery_library_items for select to authenticated
  using (is_global or family_id in (select public.auth_family_ids()) or public.auth_is_admin());
create policy "lib_insert_family_or_admin" on public.grocery_library_items for insert to authenticated
  with check (
    (is_global = false and family_id in (select public.auth_family_ids()))
    or (is_global = true and public.auth_is_admin())
  );
create policy "lib_update_admin_or_creator" on public.grocery_library_items for update to authenticated
  using (
    public.auth_is_admin()
    or (is_global = false and created_by = auth.uid() and family_id in (select public.auth_family_ids()))
  );
create policy "lib_delete_admin_or_creator" on public.grocery_library_items for delete to authenticated
  using (
    public.auth_is_admin()
    or (is_global = false and created_by = auth.uid() and family_id in (select public.auth_family_ids()))
  );

-- lists
create policy "lists_all_family" on public.grocery_lists for all to authenticated
  using (family_id in (select public.auth_family_ids()) or public.auth_is_admin())
  with check (family_id in (select public.auth_family_ids()) or public.auth_is_admin());

-- list items
create policy "list_items_all_family" on public.grocery_list_items for all to authenticated
  using (
    exists(select 1 from public.grocery_lists gl
           where gl.id = grocery_list_items.list_id
             and (gl.family_id in (select public.auth_family_ids()) or public.auth_is_admin()))
  )
  with check (
    exists(select 1 from public.grocery_lists gl
           where gl.id = grocery_list_items.list_id
             and (gl.family_id in (select public.auth_family_ids()) or public.auth_is_admin()))
  );

-- meals
create policy "meals_all_family" on public.meals for all to authenticated
  using (family_id in (select public.auth_family_ids()) or public.auth_is_admin())
  with check (family_id in (select public.auth_family_ids()) or public.auth_is_admin());

create policy "meal_ing_all_family" on public.meal_ingredients for all to authenticated
  using (
    exists(select 1 from public.meals m
           where m.id = meal_ingredients.meal_id
             and (m.family_id in (select public.auth_family_ids()) or public.auth_is_admin()))
  )
  with check (
    exists(select 1 from public.meals m
           where m.id = meal_ingredients.meal_id
             and (m.family_id in (select public.auth_family_ids()) or public.auth_is_admin()))
  );

-- plans
create policy "plans_all_family" on public.meal_plans for all to authenticated
  using (family_id in (select public.auth_family_ids()) or public.auth_is_admin())
  with check (family_id in (select public.auth_family_ids()) or public.auth_is_admin());

create policy "plan_meals_all_family" on public.meal_plan_meals for all to authenticated
  using (
    exists(select 1 from public.meal_plans mp
           where mp.id = meal_plan_meals.plan_id
             and (mp.family_id in (select public.auth_family_ids()) or public.auth_is_admin()))
  )
  with check (
    exists(select 1 from public.meal_plans mp
           where mp.id = meal_plan_meals.plan_id
             and (mp.family_id in (select public.auth_family_ids()) or public.auth_is_admin()))
  );

-- favorites
create policy "fav_all_self" on public.meal_favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Realtime
-- ----------------------------------------------------------------------------

alter table public.grocery_list_items replica identity full;
alter publication supabase_realtime add table public.grocery_list_items;
