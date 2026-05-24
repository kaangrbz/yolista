-- Preview paths for profile avatar and header (storage keys relative to user folder, e.g. preview/abc.jpg)
alter table public.profiles
  add column if not exists image_preview_url text;

alter table public.profiles
  add column if not exists header_image_preview_url text;
