-- Profile badge system: catalog of badge types (icon/color metadata) +
-- admin-assigned profile_badges (verified, business, yolista_linked, untrusted, bot, spam).
-- Two badges are computed at read time: email_verified (auth.users.email_confirmed_at)
-- and new_account (profiles.created_at within last 30 days).
--
-- The legacy profiles.is_verified column is kept and synced via trigger from
-- the 'verified' badge so existing feed/card queries that read is_verified
-- keep working.

-- ============================================================================
-- 1. TABLES
-- ============================================================================

create table if not exists public.profile_badge_types (
  key          text primary key,
  label        text not null,
  description  text not null,
  category     text not null check (category in ('positive', 'neutral', 'negative')),
  source       text not null check (source in ('admin', 'computed')),
  icon_type    text not null check (icon_type in ('material_icon', 'asset_key', 'svg_url')),
  icon_value   text not null,
  color        text not null,
  sort_order   integer not null default 0,
  is_system    boolean not null default true,
  created_at   timestamptz not null default timezone('utc'::text, now())
);

comment on table public.profile_badge_types is
  'Catalog of profile badge types. Seeded by migration; rendered identically on web and mobile.';

create table if not exists public.profile_badges (
  user_id     uuid not null references auth.users (id) on delete cascade,
  badge_key   text not null references public.profile_badge_types (key) on update cascade,
  assigned_by uuid references auth.users (id) on delete set null,
  reason      text,
  assigned_at timestamptz not null default timezone('utc'::text, now()),
  primary key (user_id, badge_key)
);

create index if not exists profile_badges_user_idx  on public.profile_badges (user_id);
create index if not exists profile_badges_badge_idx on public.profile_badges (badge_key);

comment on table public.profile_badges is
  'Admin-assigned profile badges. Only badge_keys with source=admin may be inserted.';

-- ============================================================================
-- 2. RLS
-- ============================================================================

alter table public.profile_badge_types enable row level security;
alter table public.profile_badges      enable row level security;

drop policy if exists "Badge types are public" on public.profile_badge_types;
create policy "Badge types are public"
  on public.profile_badge_types
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Profile badges are public" on public.profile_badges;
create policy "Profile badges are public"
  on public.profile_badges
  for select
  to anon, authenticated
  using (true);

-- Writes only via service role (admin actions).

-- ============================================================================
-- 3. GUARDS
-- ============================================================================

-- Only allow assigning badges whose type has source='admin'.
create or replace function public.guard_profile_badge_source()
returns trigger
language plpgsql
as $$
declare
  src text;
begin
  select source into src from public.profile_badge_types where key = NEW.badge_key;
  if src is null then
    raise exception 'Unknown badge key "%"', NEW.badge_key
      using errcode = 'foreign_key_violation';
  end if;
  if src <> 'admin' then
    raise exception 'Badge "%" is computed and cannot be assigned manually', NEW.badge_key
      using errcode = 'check_violation';
  end if;
  return NEW;
end;
$$;

drop trigger if exists guard_profile_badge_source on public.profile_badges;
create trigger guard_profile_badge_source
  before insert or update on public.profile_badges
  for each row execute function public.guard_profile_badge_source();

-- Prevent altering system badge type identity.
create or replace function public.guard_system_profile_badge_type()
returns trigger
language plpgsql
as $$
begin
  if TG_OP = 'DELETE' then
    if OLD.is_system then
      raise exception 'System profile badge type "%" cannot be deleted', OLD.key
        using errcode = 'check_violation';
    end if;
    return OLD;
  end if;

  if TG_OP = 'UPDATE' and OLD.is_system then
    if NEW.key <> OLD.key or NEW.source <> OLD.source then
      raise exception 'System badge type "%" identity (key/source) is immutable', OLD.key
        using errcode = 'check_violation';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists guard_system_profile_badge_type on public.profile_badge_types;
create trigger guard_system_profile_badge_type
  before update or delete on public.profile_badge_types
  for each row execute function public.guard_system_profile_badge_type();

-- ============================================================================
-- 4. is_verified <-> 'verified' badge SYNC
-- ============================================================================

-- When a 'verified' badge row is inserted/deleted, mirror the change onto
-- profiles.is_verified. Older code paths still read is_verified directly.
create or replace function public.sync_profile_is_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' and NEW.badge_key = 'verified' then
    update public.profiles set is_verified = true where id = NEW.user_id;
  elsif TG_OP = 'DELETE' and OLD.badge_key = 'verified' then
    update public.profiles set is_verified = false where id = OLD.user_id;
  end if;
  return case when TG_OP = 'DELETE' then OLD else NEW end;
end;
$$;

drop trigger if exists sync_profile_is_verified on public.profile_badges;
create trigger sync_profile_is_verified
  after insert or delete on public.profile_badges
  for each row execute function public.sync_profile_is_verified();

-- ============================================================================
-- 5. AUDIT (reuses log_admin_change from RBAC migration)
-- ============================================================================

drop trigger if exists log_profile_badge_types_change on public.profile_badge_types;
drop trigger if exists log_profile_badges_change      on public.profile_badges;

create trigger log_profile_badge_types_change
  after insert or update or delete on public.profile_badge_types
  for each row execute function public.log_admin_change();

create trigger log_profile_badges_change
  after insert or update or delete on public.profile_badges
  for each row execute function public.log_admin_change();

-- ============================================================================
-- 6. SEED: BADGE TYPES
-- ============================================================================

insert into public.profile_badge_types
  (key, label, description, category, source, icon_type, icon_value, color, sort_order, is_system)
values
  ('verified',       'Doğrulanmış hesap',
   'Bu hesap Yolista tarafından incelenmiş ve doğrulanmıştır. Güvenilir içerik üreticisi veya resmi hesap statüsüne sahiptir.',
   'positive', 'admin',    'material_icon', 'verified',         '#1DA1F2',  10, true),
  ('yolista_linked', 'Yolista bağlantılı hesap',
   'Bu hesap Yolista ekibi veya resmi iş ortakları ile doğrudan bağlantılıdır.',
   'positive', 'admin',    'asset_key',     'yolista_logo_green','#16A34A', 20, true),
  ('business',       'İşletme hesabı',
   'Bu hesap bir işletme veya kurumsal hesap olarak işaretlenmiştir.',
   'positive', 'admin',    'material_icon', 'store',            '#6366F1',  30, true),
  ('email_verified', 'E-posta doğrulandı',
   'Bu hesabın e-posta adresi doğrulanmıştır. Giriş güvenliği, hesap kurtarma ve önemli bildirimler bu adrese gönderilir.',
   'neutral',  'computed', 'material_icon', 'mark-email-read',  '#16A34A',  50, true),
  ('new_account',    'Yeni hesap',
   'Bu hesap son 30 gün içinde oluşturulmuştur.',
   'neutral',  'computed', 'material_icon', 'fiber-new',        '#F59E0B',  60, true),
  ('untrusted',      'Güvenilir değil',
   'Bu hesap moderatörler tarafından güvenilir olmayan olarak işaretlenmiştir. İçeriklerine dikkatle yaklaşın.',
   'negative', 'admin',    'material_icon', 'warning',          '#EF4444',  80, true),
  ('bot',            'Bot hesap',
   'Bu hesap otomatik bir bot olarak işaretlenmiştir.',
   'negative', 'admin',    'material_icon', 'smart-toy',        '#6B7280',  90, true),
  ('spam',           'Spam',
   'Bu hesap spam içerik üretmesi nedeniyle işaretlenmiştir.',
   'negative', 'admin',    'material_icon', 'report',           '#DC2626', 100, true)
on conflict (key) do update
  set label       = excluded.label,
      description = excluded.description,
      category    = excluded.category,
      source      = excluded.source,
      icon_type   = excluded.icon_type,
      icon_value  = excluded.icon_value,
      color       = excluded.color,
      sort_order  = excluded.sort_order,
      is_system   = excluded.is_system;

-- ============================================================================
-- 7. BACKFILL: profiles.is_verified -> 'verified' badge
-- ============================================================================

insert into public.profile_badges (user_id, badge_key)
select id, 'verified' from public.profiles where is_verified = true
on conflict do nothing;

-- ============================================================================
-- 8. RPCs
-- ============================================================================

create or replace function public.list_profile_badge_types()
returns setof public.profile_badge_types
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profile_badge_types order by sort_order, key;
$$;

grant execute on function public.list_profile_badge_types() to anon, authenticated;

-- Resolve all visible badges for a user (admin-assigned + computed).
-- Returns one row per badge with the icon/color metadata inlined so the
-- client doesn't need a second lookup.
create or replace function public.get_profile_badges(p_user_id uuid)
returns table (
  key         text,
  label       text,
  description text,
  category    text,
  source      text,
  icon_type   text,
  icon_value  text,
  color       text,
  sort_order  integer,
  assigned_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with assigned as (
    select t.key, t.label, t.description, t.category, t.source,
           t.icon_type, t.icon_value, t.color, t.sort_order, pb.assigned_at
    from public.profile_badges pb
    join public.profile_badge_types t on t.key = pb.badge_key
    where pb.user_id = p_user_id
  ),
  email_badge as (
    select t.key, t.label, t.description, t.category, t.source,
           t.icon_type, t.icon_value, t.color, t.sort_order, null::timestamptz as assigned_at
    from public.profile_badge_types t
    where t.key = 'email_verified'
      and exists (
        select 1 from auth.users u
        where u.id = p_user_id and u.email_confirmed_at is not null
      )
      -- hide email badge if user already has the stronger 'verified' badge
      and not exists (
        select 1 from public.profile_badges v
        where v.user_id = p_user_id and v.badge_key = 'verified'
      )
  ),
  new_badge as (
    select t.key, t.label, t.description, t.category, t.source,
           t.icon_type, t.icon_value, t.color, t.sort_order, null::timestamptz as assigned_at
    from public.profile_badge_types t
    where t.key = 'new_account'
      and exists (
        select 1 from public.profiles p
        where p.id = p_user_id
          and p.created_at is not null
          and p.created_at > now() - interval '30 days'
      )
  )
  select key, label, description, category, source,
         icon_type, icon_value, color, sort_order, assigned_at
  from (
    select * from assigned
    union all
    select * from email_badge
    union all
    select * from new_badge
  ) merged
  order by
    case category when 'positive' then 0 when 'neutral' then 1 else 2 end,
    sort_order,
    key;
$$;

grant execute on function public.get_profile_badges(uuid) to anon, authenticated;

comment on function public.get_profile_badges(uuid) is
  'Returns all visible badges (admin-assigned + computed) for the given user, sorted.';
