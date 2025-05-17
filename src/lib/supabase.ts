import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Move these to .env file
const supabaseUrl = 'https://koimmduhmsjnerkqksmu.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaW1tZHVobXNqbmVya3Frc211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyODI5OTMsImV4cCI6MjA1ODg1ODk5M30.N90ttUoEYmPDks7027rFwR0FaiEdE1kLB1lAiY7oDuk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// SQL to run in Supabase SQL editor:
/*
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Cities table (pre-populated with Turkish cities)
create table public.cities (
  id integer primary key,
  name text not null
);

-- Insert Turkish cities
insert into public.cities (id, name) values
(1, 'Adana'), (2, 'Adıyaman'), (3, 'Afyonkarahisar'), (4, 'Ağrı'), (5, 'Amasya'),
(6, 'Ankara'), (7, 'Antalya'), (8, 'Artvin'), (9, 'Aydın'), (10, 'Balıkesir'),
(11, 'Bilecik'), (12, 'Bingöl'), (13, 'Bitlis'), (14, 'Bolu'), (15, 'Burdur'),
(16, 'Bursa'), (17, 'Çanakkale'), (18, 'Çankırı'), (19, 'Çorum'), (20, 'Denizli'),
(21, 'Diyarbakır'), (22, 'Edirne'), (23, 'Elazığ'), (24, 'Erzincan'), (25, 'Erzurum'),
(26, 'Eskişehir'), (27, 'Gaziantep'), (28, 'Giresun'), (29, 'Gümüşhane'), (30, 'Hakkari'),
(31, 'Hatay'), (32, 'Isparta'), (33, 'Mersin'), (34, 'İstanbul'), (35, 'İzmir'),
(36, 'Kars'), (37, 'Kastamonu'), (38, 'Kayseri'), (39, 'Kırklareli'), (40, 'Kırşehir'),
(41, 'Kocaeli'), (42, 'Konya'), (43, 'Kütahya'), (44, 'Malatya'), (45, 'Manisa'),
(46, 'Kahramanmaraş'), (47, 'Mardin'), (48, 'Muğla'), (49, 'Muş'), (50, 'Nevşehir'),
(51, 'Niğde'), (52, 'Ordu'), (53, 'Rize'), (54, 'Sakarya'), (55, 'Samsun'),
(56, 'Siirt'), (57, 'Sinop'), (58, 'Sivas'), (59, 'Tekirdağ'), (60, 'Tokat'),
(61, 'Trabzon'), (62, 'Tunceli'), (63, 'Şanlıurfa'), (64, 'Uşak'), (65, 'Van'),
(66, 'Yozgat'), (67, 'Zonguldak'), (68, 'Aksaray'), (69, 'Bayburt'), (70, 'Karaman'),
(71, 'Kırıkkale'), (72, 'Batman'), (73, 'Şırnak'), (74, 'Bartın'), (75, 'Ardahan'),
(76, 'Iğdır'), (77, 'Yalova'), (78, 'Karabük'), (79, 'Kilis'), (80, 'Osmaniye'),
(81, 'Düzce');

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  is_verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Routes table
create table public.routes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  main_image_url text,
  author_id uuid references public.profiles(id) on delete cascade,
  city_id integer not null references public.cities(id),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Bookmarks table
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  route_id uuid references public.routes(id) on delete cascade,
  title text not null,
  description text,
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Bookmark images table
create table public.bookmark_images (
  id uuid default uuid_generate_v4() primary key,
  bookmark_id uuid references public.bookmarks(id) on delete cascade,
  image_url text not null,
  order_index integer not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  bookmark_id uuid references public.bookmarks(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Likes table
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  bookmark_id uuid references public.bookmarks(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, bookmark_id)
);

-- Saved routes table
create table public.saved_routes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  route_id uuid references public.routes(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, route_id)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.routes enable row level security;
alter table public.bookmarks enable row level security;
alter table public.bookmark_images enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.saved_routes enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Routes are viewable by everyone"
  on routes for select
  using ( true );

create policy "Users can insert their own routes"
  on routes for insert
  with check ( auth.uid() = author_id );

create policy "Users can update own routes"
  on routes for update
  using ( auth.uid() = author_id );

create policy "Users can delete own routes"
  on routes for delete
  using ( auth.uid() = id );

create policy "Bookmarks are viewable by everyone"
  on bookmarks for select
  using ( true );

create policy "Users can insert bookmarks to their routes"
  on bookmarks for insert
  with check (
    exists (
      select 1 from routes
      where routes.id = bookmarks.route_id
      and routes.author_id = auth.uid()
    )
  );

create policy "Users can update bookmarks in their routes"
  on bookmarks for update
  using (
    exists (
      select 1 from routes
      where routes.id = bookmarks.route_id
      and routes.author_id = auth.uid()
    )
  );

create policy "Users can delete bookmarks from their routes"
  on bookmarks for delete
  using (
    exists (
      select 1 from routes
      where routes.id = bookmarks.route_id
      and routes.author_id = auth.uid()
    )
  );

create policy "Bookmark images are viewable by everyone"
  on bookmark_images for select
  using ( true );

create policy "Users can insert images to their bookmarks"
  on bookmark_images for insert
  with check (
    exists (
      select 1 from bookmarks
      join routes on routes.id = bookmarks.route_id
      where bookmarks.id = bookmark_images.bookmark_id
      and routes.author_id = auth.uid()
    )
  );

create policy "Users can update images in their bookmarks"
  on bookmark_images for update
  using (
    exists (
      select 1 from bookmarks
      join routes on routes.id = bookmarks.route_id
      where bookmarks.id = bookmark_images.bookmark_id
      and routes.author_id = auth.uid()
    )
  );

create policy "Users can delete images from their bookmarks"
  on bookmark_images for delete
  using (
    exists (
      select 1 from bookmarks
      join routes on routes.id = bookmarks.route_id
      where bookmarks.id = bookmark_images.bookmark_id
      and routes.author_id = auth.uid()
    )
  );

create policy "Comments are viewable by everyone"
  on comments for select
  using ( true );

create policy "Users can insert their own comments"
  on comments for insert
  with check ( auth.uid() = author_id );

create policy "Users can update own comments"
  on comments for update
  using ( auth.uid() = id );

create policy "Users can delete own comments"
  on comments for delete
  using ( auth.uid() = id );

create policy "Likes are viewable by everyone"
  on likes for select
  using ( true );

create policy "Users can insert their own likes"
  on likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own likes"
  on likes for delete
  using ( auth.uid() = user_id );

create policy "Saved routes are viewable by owner"
  on saved_routes for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own saved routes"
  on saved_routes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete own saved routes"
  on saved_routes for delete
  using ( auth.uid() = user_id );
*/
