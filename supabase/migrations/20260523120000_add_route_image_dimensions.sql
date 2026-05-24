-- Per route row: original photo dimensions (pixels) at publish time.
alter table public.routes
  add column if not exists image_width integer,
  add column if not exists image_height integer;

comment on column public.routes.image_width is
  'Photo width in pixels when published. NULL for legacy rows.';

comment on column public.routes.image_height is
  'Photo height in pixels when published. NULL for legacy rows.';
