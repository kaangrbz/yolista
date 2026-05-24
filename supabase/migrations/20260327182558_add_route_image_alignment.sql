-- Per route row (each stop / image): aspect classification for layout and future use.
-- Suggested values: portrait | square | landscape | unknown — app may store other labels later.
alter table public.routes
  add column if not exists image_alignment text;

comment on column public.routes.image_alignment is
  'Photo aspect/orientation class (e.g. portrait, square, landscape, unknown). NULL until measured.';
