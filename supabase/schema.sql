-- ============================================================
-- Dofren — skema Supabase (jalankan 1x di SQL Editor)
-- Tabel: profiles, menus, carousel_slides, settings
-- + RLS + bucket storage + seed awal
-- ============================================================

-- ---------- TABEL ----------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text default 'admin' check (role in ('admin','owner')),
  created_at timestamptz default now()
);

create table if not exists menus (
  id bigint generated always as identity primary key,
  nama text not null,
  deskripsi text default '',
  harga integer not null check (harga >= 0),
  kategori text default 'klasik' check (kategori in ('klasik','glaze','premium','paket')),
  foto_url text,
  is_populer boolean default false,
  is_available boolean default true,
  urutan int default 0,
  created_at timestamptz default now()
);

create table if not exists carousel_slides (
  id bigint generated always as identity primary key,
  judul text not null,
  subjudul text default '',
  foto_url text not null,
  cta_text text default 'Pesan Sekarang',
  cta_link text default '#pesan',
  urutan int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists settings (
  key text primary key,
  value text not null default ''
);

-- ---------- RLS ----------

alter table profiles enable row level security;
alter table menus enable row level security;
alter table carousel_slides enable row level security;
alter table settings enable row level security;

-- profiles: tiap admin hanya bisa baca barisnya sendiri
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select to authenticated using (auth.uid() = id);

-- baca publik (pengunjung tanpa login)
drop policy if exists "public_read_menus" on menus;
create policy "public_read_menus" on menus
  for select to anon, authenticated using (true);

drop policy if exists "public_read_slides" on carousel_slides;
create policy "public_read_slides" on carousel_slides
  for select to anon, authenticated using (true);

drop policy if exists "public_read_settings" on settings;
create policy "public_read_settings" on settings
  for select to anon, authenticated using (true);

-- tulis: hanya user yang terdaftar di profiles
drop policy if exists "admin_write_menus" on menus;
create policy "admin_write_menus" on menus
  for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid()))
  with check (exists (select 1 from profiles where id = auth.uid()));

drop policy if exists "admin_write_slides" on carousel_slides;
create policy "admin_write_slides" on carousel_slides
  for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid()))
  with check (exists (select 1 from profiles where id = auth.uid()));

drop policy if exists "admin_write_settings" on settings;
create policy "admin_write_settings" on settings
  for all to authenticated
  using (exists (select 1 from profiles where id = auth.uid()))
  with check (exists (select 1 from profiles where id = auth.uid()));

-- ---------- STORAGE ----------

insert into storage.buckets (id, name, public)
values ('foto-menu','foto-menu', true),
       ('foto-carousel','foto-carousel', true)
on conflict (id) do update set public = true;

drop policy if exists "public_read_storage" on storage.objects;
create policy "public_read_storage" on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('foto-menu','foto-carousel'));

drop policy if exists "admin_write_storage" on storage.objects;
create policy "admin_write_storage" on storage.objects
  for all to authenticated
  using (bucket_id in ('foto-menu','foto-carousel')
         and exists (select 1 from profiles where id = auth.uid()))
  with check (bucket_id in ('foto-menu','foto-carousel')
         and exists (select 1 from profiles where id = auth.uid()));

-- ---------- SEED AWAL ----------

insert into settings (key, value) values
  ('site_name','Dofren — Friend Donat dan Bakery'),
  ('tagline','Produsen Donat Premium dan Ekonomis Malang'),
  ('wa_number','6281234567890'),
  ('wa_order_link','https://wa.me/6281234567890?text=Halo%20Dofren%2C%20saya%20mau%20pesan%20donat'),
  ('gofood_url',''),
  ('shopeefood_url',''),
  ('grabfood_url',''),
  ('gmaps_url',''),
  ('alamat','Malang, Jawa Timur'),
  ('jam_buka','Senin–Sabtu, 08.00–20.00 WIB'),
  ('instagram',''),
  ('tiktok',''),
  ('maps_embed_url','https://www.google.com/maps?q=Malang,Jawa+Timur&output=embed'),
  ('promo_text','Promo: Paket Box isi 6 lebih hemat! Pesan via GoFood / ShopeeFood / GrabFood / WA.')
on conflict (key) do nothing;

insert into menus (nama, deskripsi, harga, kategori, is_populer, is_available, urutan) values
  ('Donat Gula Klasik','Donat kentang tabur gula halus, favorit semua umur.',5000,'klasik',true,true,1),
  ('Donat Coklat Meses','Topping coklat + meses warna-warni.',6000,'klasik',false,true,2),
  ('Donat Glaze Strawberry','Glaze strawberry manis dengan taburan sprinkle.',8000,'glaze',true,true,3),
  ('Donat Matcha Almond','Glaze matcha premium + taburan almond.',9000,'glaze',false,true,4),
  ('Donat Premium Tiramisu','Glaze tiramisu + bubuk kakao asli.',12000,'premium',true,true,5),
  ('Paket Box Isi 6','Campur varian favorit dalam 1 box. Lebih hemat!',45000,'paket',true,true,6);

-- CATATAN: setelah invite admin di Authentication → Users,
-- daftarkan dia sebagai admin (ganti UID_UID_ADMIN dengan UUID user):
-- insert into profiles (id, email, role) values ('UID_ADMIN','admin@dofren.my.id','owner');
