create table if not exists public.saved_collections (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  note text,
  visibility text not null default 'private',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint saved_collections_visibility_check check (visibility in ('private', 'shared')),
  constraint saved_collections_name_not_empty check (length(trim(name)) > 0)
);

create unique index if not exists saved_collections_owner_name_unique
  on public.saved_collections (owner_user_id, lower(name));

create unique index if not exists saved_collections_owner_default_unique
  on public.saved_collections (owner_user_id)
  where is_default = true;

create table if not exists public.saved_collection_members (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.saved_collections(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'contributor',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint saved_collection_members_role_check check (role in ('owner', 'contributor', 'viewer')),
  constraint saved_collection_members_unique unique (collection_id, user_id)
);

create index if not exists saved_collection_members_user_idx
  on public.saved_collection_members (user_id, created_at desc);

create table if not exists public.saved_collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.saved_collections(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  added_by_user_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  constraint saved_collection_items_entity_type_check check (entity_type in ('route'))
);

create unique index if not exists saved_collection_items_unique_entity
  on public.saved_collection_items (collection_id, entity_type, entity_id);

create index if not exists saved_collection_items_entity_idx
  on public.saved_collection_items (entity_type, entity_id, created_at desc);

create index if not exists saved_collection_items_collection_idx
  on public.saved_collection_items (collection_id, created_at desc);

comment on table public.saved_collection_members is
  'Future contributor support table. App keeps owner-only writes in first phase.';

comment on column public.saved_collections.note is
  'Optional list-level note text (feature placeholder for future list notes).';

comment on column public.saved_collection_items.note is
  'Optional per-item note text (feature placeholder for future item notes).';

alter table public.saved_collections enable row level security;
alter table public.saved_collection_members enable row level security;
alter table public.saved_collection_items enable row level security;

drop policy if exists "saved collections owner read" on public.saved_collections;
create policy "saved collections owner read"
  on public.saved_collections
  for select
  using (auth.uid() = owner_user_id);

drop policy if exists "saved collections owner insert" on public.saved_collections;
create policy "saved collections owner insert"
  on public.saved_collections
  for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "saved collections owner update" on public.saved_collections;
create policy "saved collections owner update"
  on public.saved_collections
  for update
  using (auth.uid() = owner_user_id);

drop policy if exists "saved collections owner delete" on public.saved_collections;
create policy "saved collections owner delete"
  on public.saved_collections
  for delete
  using (auth.uid() = owner_user_id);

drop policy if exists "saved collection members owner read" on public.saved_collection_members;
create policy "saved collection members owner read"
  on public.saved_collection_members
  for select
  using (
    exists (
      select 1
      from public.saved_collections collections
      where collections.id = saved_collection_members.collection_id
        and collections.owner_user_id = auth.uid()
    )
  );

drop policy if exists "saved collection members owner write" on public.saved_collection_members;
create policy "saved collection members owner write"
  on public.saved_collection_members
  for all
  using (
    exists (
      select 1
      from public.saved_collections collections
      where collections.id = saved_collection_members.collection_id
        and collections.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.saved_collections collections
      where collections.id = saved_collection_members.collection_id
        and collections.owner_user_id = auth.uid()
    )
  );

drop policy if exists "saved collection items owner and member read" on public.saved_collection_items;
create policy "saved collection items owner and member read"
  on public.saved_collection_items
  for select
  using (
    exists (
      select 1
      from public.saved_collections collections
      where collections.id = saved_collection_items.collection_id
        and collections.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.saved_collection_members members
      where members.collection_id = saved_collection_items.collection_id
        and members.user_id = auth.uid()
    )
  );

drop policy if exists "saved collection items owner insert" on public.saved_collection_items;
create policy "saved collection items owner insert"
  on public.saved_collection_items
  for insert
  with check (
    exists (
      select 1
      from public.saved_collections collections
      where collections.id = saved_collection_items.collection_id
        and collections.owner_user_id = auth.uid()
    )
  );

drop policy if exists "saved collection items owner delete" on public.saved_collection_items;
create policy "saved collection items owner delete"
  on public.saved_collection_items
  for delete
  using (
    exists (
      select 1
      from public.saved_collections collections
      where collections.id = saved_collection_items.collection_id
        and collections.owner_user_id = auth.uid()
    )
  );

drop policy if exists "saved collection items owner update" on public.saved_collection_items;
create policy "saved collection items owner update"
  on public.saved_collection_items
  for update
  using (
    exists (
      select 1
      from public.saved_collections collections
      where collections.id = saved_collection_items.collection_id
        and collections.owner_user_id = auth.uid()
    )
  );

insert into public.saved_collections (owner_user_id, name, note, is_default)
select distinct
  saved_routes.user_id,
  'Kaydedilenler',
  null,
  true
from public.saved_routes
where not exists (
  select 1
  from public.saved_collections collections
  where collections.owner_user_id = saved_routes.user_id
    and collections.is_default = true
);

insert into public.saved_collection_items (collection_id, entity_type, entity_id, added_by_user_id)
select
  collections.id as collection_id,
  'route' as entity_type,
  saved_routes.route_id as entity_id,
  saved_routes.user_id as added_by_user_id
from public.saved_routes
join public.saved_collections collections
  on collections.owner_user_id = saved_routes.user_id
  and collections.is_default = true
on conflict (collection_id, entity_type, entity_id) do nothing;
