# PLAN.md — Landing Page Single Page UMKM Donat (Dofren)

![Logo DoFren](assets/logo-dofren-transparent.png)

> Tujuan: satu halaman web promosi donat yang cepat, SEO-friendly, bisa dibuka di HP, + bisa **login admin untuk edit pricelist menu & foto carousel/populer** tanpa ngoding.

## 0. Branding UMKM

- **Nama UMKM:** Dofren — Friend Donat dan Bakery
- **Jargon:** Produsen Donat Premium dan Ekonomis Malang
- **Logo:** `assets/logo-dofren-transparent.png` (diekstrak dari pojok kanan bawah `assets/donat+logo_1.png`, background sudah dihapus)
  - Donat coklat + aksen kuning/oranye, teks "DoFren" oranye dengan outline coklat.
  - Warna brand (untuk dipakai di Tailwind/CSS): coklat `#6B4226` / `#7A4A21`, oranye/kuning `#F5A623` / `#FBBF24`, krem/putih `#FFF8F0`.
  - Judul tab & hero memakai nama lengkap "Dofren — Friend Donat dan Bakery", tagline memakai jargon di atas.
  - File `assets/logo-dofren.png` adalah crop mentah (dengan background) — arsip saja, yang dipakai production adalah versi `-transparent`.

---

## 1. Ringkasan Saran Arsitektur

Pertanyaan umum: *"Apakah cukup GitHub Pages + HTML+JS atau SQLite?"*

Jawaban singkat:

| Opsi | Cara kerja | Cocok? |
|------|------------|--------|
| **A. GitHub Pages + HTML/CSS/JS saja** | Semua data di file `menu.json` / `localStorage` browser | ❌ Edit hanya tersimpan di HP/laptop itu saja, tidak sinkron. Login hanya bohongan (tidak aman). Tidak cocok kalau admin ganti HP atau ada 2 admin. |
| **B. GitHub Pages + SQLite (file .db)** | SQLite butuh server untuk baca/tulis. GitHub Pages itu hosting **statis**, tidak bisa menjalankan SQLite server-side. `sql.js` hanya bisa simulasi di browser, tetap tidak sinkron antar pengunjung. | ❌ Jangan dipakai untuk data bersama. |
| **C. ✅ Static Frontend + BaaS (REKOMENDASI)** | Frontend tetap single page di GitHub Pages / Netlify / Vercel. Data, login, dan foto disimpan di **Supabase (gratis)**. | ✅ Paling sederhana + aman + gratis untuk UMKM. Tanpa kelola server. Edit dari HP langsung update ke semua pengunjung. |
| **D. PocketBase (SQLite server)** | 1 file binary Go + SQLite built-in + admin panel jadi. Wajib hosting VPS / Fly.io / Railway (tidak bisa di GitHub Pages). | ⚠️ Bagus kalau mau self-host murah, tapi overkill untuk 1 landing page. |
| **E. Decap CMS + GitHub** | Edit via commit Git, login via Netlify Identity / GitHub OAuth. | ⚠️ Cocok kalau admin terbiasa Git, tapi UX upload foto lebih ribet di HP. |

**Keputusan yang diusulkan: Opsi C.**

```
Pengunjung (HP) ---> index.html (GitHub Pages)
                         |
                         +--> Supabase Auth (login admin)
                         +--> Supabase Postgres (tabel menus, carousel_slides, settings)
                         +--> Supabase Storage (foto-menu/, foto-carousel/)
```

Kenapa ini best practice 2026 untuk UMKM:
1. Tetap **single web page** (1x deploy, cepat, murah).
2. **Gratis**: GitHub Pages (frontend) + Supabase Free Tier (500MB DB + 1GB storage + 50rb user auth — lebih dari cukup).
3. Tidak perlu backend Node/PHP sendiri.
4. Foto di-CDN-kan otomatis, loading cepat untuk marketing IG/WA.
5. Aman: Row Level Security (RLS) — pengunjung hanya bisa baca, admin yang login saja bisa tulis.

Alternatif jika benar-benar mau **nol backend**: pakai Opsi A dengan `data/menu.json` + mode edit `?admin=1` + password lokal. Tapi harus terima konsekuensi data tidak sinkron. Tidak disarankan untuk jangka panjang.

---

## 2. Visi Produk & Pengguna

**Nama UMKM:** Dofren — Friend Donat dan Bakery
**Jargon:** Produsen Donat Premium dan Ekonomis Malang

**Pengguna:**
1. **Pengunjung:** buka link dari WA/IG/QR, lihat carousel promo, menu populer, pricelist, klik **Pesan** via GoFood / ShopeeFood / GrabFood / WA Bisnis (redirect langsung ke aplikasinya), lihat lokasi/jam buka.
2. **Admin/Owner UMKM (1-2 orang):** login email+password, tambah/edit/hapus menu, ganti harga, tandai "Populer", upload/ganti foto carousel, ganti link order (GoFood/ShopeeFood/GrabFood/WA) + link Google Maps Bisnis & jam buka. Semua dari HP.

**Non-tujuan MVP:** keranjang + pembayaran online di web, multi-cabang, stok otomatis, kasir/POS. Order cukup deep-link ke aplikasi (`wa.me/62xxx?text=...`, link GoFood/ShopeeFood/GrabFood merchant).

---

## 3. Struktur Halaman (Single Page Sections)

Satu file `index.html` dengan anchor nav (smooth scroll):

1. **Navbar sticky:** logo (`assets/logo-dofren-transparent.png`), link (Beranda, Menu, Populer, Pesan, Lokasi), tombol `Masuk` + tombol `Pesan Sekarang` (scroll ke section Pesan).
2. **Hero Carousel:** 3-5 slide foto (autoplay 5 detik, swipe di HP, dot + panah). Data dari tabel `carousel_slides` yang `is_active=true`, urut `urutan`. Fallback ke 3 gambar lokal jika offline/DB kosong.
3. **Badge trust:** Halal, Fresh Daily, Rating, tombol IG/TikTok.
4. **Menu Populer:** grid 4-6 kartu dari `menus WHERE is_populer=true AND is_available=true`. Foto besar, harga, tombol pesan per item (buka section Pesan / WA dengan prefill nama + harga).
5. **Pricelist / Semua Menu:** filter kategori (Klasik, Glaze, Premium, Paket Box), search, kartu menu + harga. Data dari `menus`.
6. **Promo / Paket Hemat:** bisa reuse `menus kategori='paket'` atau `settings.promo_text`.
7. **Pesan / Order Online:** 4 tombol channel besar (icon + nama) — GoFood, ShopeeFood, GrabFood, WA Bisnis — masing-masing redirect langsung ke aplikasinya. URL diambil dari `settings` (`gofood_url`, `shopeefood_url`, `grabfood_url`, `wa_order_link`) sehingga bisa diganti admin tanpa ngoding. Perilaku di HP: skema deep-link aplikasi dulu (`gojek://`, `grab://`, `shopee://`), fallback ke URL https web jika aplikasi tidak terinstal. WA Bisnis via `wa.me/62xxx?text=...` prefill. Tombol yang URL-nya kosong otomatis disembunyikan.
8. **Testimoni:** statis 3-4 kartu (tahap awal hardcode, nanti bisa jadi tabel).
9. **Lokasi & Jam:** embed Google Maps, alamat, jam, tombol rute (buka aplikasi Google Maps).
10. **CTA floating:** tombol bulat kanan bawah (default: WA Bisnis; opsional sheet pilihan 4 channel).
11. **Footer:** copyright, sosmed, **link Google Maps Bisnis** (profil bisnis `gmaps_url` — untuk ulasan + rute), jam operasional ringkas, link admin.
12. **Modal Login + Panel Admin (hidden):** hanya muncul setelah login. Bukan halaman terpisah agar tetap "single page".

Persyaratan marketing digital:
- `<title>`, meta description, Open Graph + Twitter Card (foto donat + harga mulai).
- `og:image` 1200x630, favicon, `sitemap.xml` + `robots.txt`.
- Schema.org `Bakery` JSON-LD (nama, alamat, jam, telepon).
- PageSpeed: gambar WebP/avif, `loading="lazy"` kecuali hero, total < 1.5MB awal.
- Share button: WA, IG (link), TikTok, salin link.

---

## 4. Arsitektur Teknis (MVP)

**Frontend (GitHub Pages):**
- `HTML + Tailwind CSS via CDN + Vanilla JS (ES Module)` — tanpa build step, 1 orang non-programmer tetap bisa baca.
- Lib: `@supabase/supabase-js@2` via CDN ESM, Swiper.js atau CSS scroll-snap untuk carousel (pilih Swiper agar swipe HP enak).
- PWA ringan opsional tahap 2 (`manifest.json`, service worker cache hero).

**Backend (Supabase Cloud, tanpa server sendiri):**
- **Auth:** Email+Password (1 admin). Matikan sign-up publik, hanya invite.
- **Database:** Postgres + RLS.
- **Storage:** bucket `foto-menu` (public read), `foto-carousel` (public read), kompresi client-side max 1200px / 300KB sebelum upload.

**Kenapa bukan framework (Next.js/React)?**
Untuk 1 landing page, Vanilla + Tailwind lebih cepat dibuka, lebih mudah dihost di GitHub Pages, dan lebih murah dirawat UMKM. Upgrade ke Vite/React hanya jika nanti butuh multi-page/kasir.

---

## 5. Struktur File yang Diusulkan

```
/ (root repo dofren)
├── PLAN.md                  # file ini
├── README.md                # cara jalan + deploy
├── index.html               # single page utama
├── 404.html                 # redirect GitHub Pages (copy index.html)
├── robots.txt
├── sitemap.xml
├── manifest.json            # PWA opsional
├── favicon.ico / icon.png
├── css/
│   └── style.css            # custom kecil, sisanya Tailwind CDN
├── js/
│   ├── config.js            # SUPABASE_URL + ANON_KEY (public, aman via RLS)
│   ├── supabase-client.js   # init client
│   ├── app.js               # render carousel + menu + filter + WA link
│   ├── auth.js              # login/logout/session
│   └── admin.js             # CRUD menu + carousel + settings (hanya jika login)
├── assets/
│   ├── fallback/            # 3 hero + 6 menu default (WebP)
│   └── icons/
├── data/
│   └── seed.json            # data awal untuk import manual jika DB kosong
└── supabase/
    ├── schema.sql           # tabel + RLS (lihat §6)
    └── storage.md           # setting bucket + policy
```

Prinsip: **tidak ada build**. Clone → buka `index.html` via Live Server → jalan (mode fallback). Isi `.env`? Tidak perlu — cukup `js/config.js`.

---

## 6. Skema Data (Supabase Postgres)

```sql
-- profiles: 1 baris per admin
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text default 'admin' check (role in ('admin','owner')),
  created_at timestamptz default now()
);

-- menus: pricelist
create table menus (
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

-- carousel_slides: hero marketing
create table carousel_slides (
  id bigint generated always as identity primary key,
  judul text not null,
  subjudul text default '',
  foto_url text not null,
  cta_text text default 'Pesan Sekarang',
  cta_link text default 'https://wa.me/6281234567890',
  urutan int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- settings: key-value untuk WA, alamat, jam, sosmed
create table settings (
  key text primary key,
  value text not null
);
-- seed: site_name='Dofren — Friend Donat dan Bakery', tagline='Produsen Donat Premium dan Ekonomis Malang', wa_number, wa_order_link, gofood_url, shopeefood_url, grabfood_url, gmaps_url, alamat, jam_buka, instagram, tiktok, maps_embed_url, promo_text
```

**RLS (wajib):**
- `menus, carousel_slides, settings`: `SELECT` untuk `anon` + `authenticated` (publik bisa baca).
- `INSERT/UPDATE/DELETE`: hanya `authenticated` dengan `exists (select 1 from profiles where id = auth.uid())`.
- Storage: `SELECT` public, `INSERT/UPDATE/DELETE` hanya authenticated.

### Spesifikasi upload gambar (pricelist & promo)

> Prinsip: GitHub Pages tidak bisa menerima upload (statis), jadi **semua upload dari panel admin dikirim ke Supabase Storage**, URL publiknya disimpan di DB. Pengunjung hanya membaca URL-nya (via CDN).

| Kebutuhan | Bucket tujuan | Kolom DB | Format didukung | Batas & olahan |
|-----------|---------------|----------|-----------------|----------------|
| Foto menu / pricelist | `foto-menu/` (public read) | `menus.foto_url` | JPG, PNG, WebP (disarankan WebP hasil kompres) | File asli max 2MB; dikompres client-side ke max sisi 1200px, target <300KB; rasio bebas (disarankan 1:1 / 4:3); nama file `menu-{id}-{timestamp}.webp` |
| Foto carousel / promo hero | `foto-carousel/` (public read) | `carousel_slides.foto_url` | JPG, PNG, WebP | Sama (max 2MB → <300KB); rasio **16:9 landscape** (mis. 1280x720) agar pas di hero HP & desktop; nama file `slide-{id}-{timestamp}.webp` |
| Logo / fallback | Tidak diupload admin — file statis di repo `assets/` | — | PNG transparan, SVG, WebP | Logo production: `assets/logo-dofren-transparent.png`; fallback hero/menu: `assets/fallback/*.webp` |

Alur upload (HP admin):
1. Pilih dari galeri / kamera → validasi tipe (tolak selain jpg/png/webp; file HEIC iPhone dikonversi otomatis via canvas/gambar—jika gagal, minta admin pilih JPG).
2. Kompres + resize di browser (canvas) sebelum dikirim — hemat kuota & cepat.
3. Upload ke bucket sesuai tabel → dapat URL publik → `INSERT/UPDATE` baris menu/slide dengan URL itu → tampilan pengunjung update <10 detik.
4. Hapus/ganti foto: upload baru menimpa URL baris; file lama dihapus via `storage.remove()` agar bucket tidak penuh (Free Tier 1GB).
5. Jika upload gagal / offline: tampilkan error + data lama tetap dipakai; pengunjung tetap melihat foto lama atau fallback `assets/fallback/`.

---

## 7. Alur Login & Edit (UX Admin via HP)

1. Klik `Masuk` di navbar → modal email+password → `supabase.auth.signInWithPassword()`.
2. Sukses → navbar berubah jadi `Halo, Admin` + tombol `Kelola` + `Keluar`. Muncul tab admin (drawer bawah / section tersembunyi).
3. **Kelola Menu:** tabel mini (foto, nama, harga, populer, tersedia) + tombol Tambah/Edit/Hapus. Form: nama, harga (number + format Rp), kategori (dropdown), deskripsi, checkbox populer/tersedia, upload foto (preview + kompres otomatis). Simpan → `upsert menus` + upload ke `foto-menu/` → langsung re-render tanpa reload.
4. **Kelola Carousel:** daftar slide + urutan drag/naik-turun sederhana (tombol ↑↓), toggle aktif, upload foto 16:9. Simpan → re-render hero.
5. **Pengaturan Toko & Channel Order:** nomor + link WA Bisnis (`wa_order_link`), link GoFood (`gofood_url`), ShopeeFood (`shopeefood_url`), GrabFood (`grabfood_url`), link Google Maps Bisnis (`gmaps_url`), jam, alamat, link IG/TikTok, teks promo. Simpan ke `settings`. Link channel yang kosong otomatis menyembunyikan tombolnya di landing.
6. Logout → panel hilang. Session persist via localStorage Supabase.

Validasi: harga > 0, foto < 2MB (kompres ke <300KB), nama wajib, cegah XSS via `textContent` (jangan `innerHTML` untuk input admin).

---

## 8. Hosting & Deploy

- **Frontend:** GitHub Pages (branch `main`, folder `/root`). Custom domain opsional (`dofren.com`) + HTTPS otomatis + Cloudflare gratis untuk cache.
- **Backend:** Supabase project `dofren` (region Singapore). Simpan `SUPABASE_URL` + `ANON_KEY` di `js/config.js`. **Jangan** pakai `service_role` di frontend.
- **Deploy:** push ke `main` → Pages update 1-2 menit. Rollback via revert commit.
- **Biaya:** Rp0 (Pages + Supabase Free). Upgrade hanya jika foto >1GB atau traffic sangat tinggi.

Langkah setup (nanti di README):
1. Buat repo `dofren`, aktifkan Pages.
2. Buat project Supabase → jalankan `supabase/schema.sql` → buat bucket → set policy.
3. Invite admin via Supabase Auth → copy URL+anon key ke `js/config.js`.
4. Seed 6 menu + 3 slide awal via panel admin atau `data/seed.json`.

---

## 9. Keamanan, Performa, SEO (Checklist MVP)

- [ ] RLS aktif + sign-up publik mati.
- [ ] Upload validasi tipe (jpg/png/webp) + limit + kompres.
- [ ] `ANON_KEY` boleh publik, `SERVICE_KEY` tidak pernah di frontend.
- [ ] Gambar `alt` deskriptif, lazy-load, dimensi eksplisit (hindari CLS).
- [ ] Lighthouse mobile ≥ 90 (perf, a11y, SEO).
- [ ] OG/Twitter/JSON-LD terisi, link WA dengan teks prefill per produk.
- [ ] Deep-link order: GoFood/ShopeeFood/GrabFood coba buka aplikasi dulu, fallback https; WA via `wa.me`; tombol channel tanpa URL disembunyikan.
- [ ] Footer wajib ada link Google Maps Bisnis (`gmaps_url`) + tombol rute di section Lokasi.
- [ ] Fallback offline: jika Supabase gagal, tampilkan `data/seed.json` + banner "mode offline".

---

## 10. Roadmap

**Minggu 1 (MVP):** `index.html` + Tailwind + render dari seed → Supabase schema + auth + CRUD menu → deploy Pages. Target: bisa demo order WA.
**Minggu 2:** Carousel admin + upload foto + settings toko + SEO/OG + QR cetak untuk kemasan.
**Next (opsional):** Testimoni DB, multi-bahasa ID/EN, PWA install, analitik (Cloudflare Web Analytics, tanpa cookie), paket bundling + kalkulator harga di WA.

---

## 11. Kriteria Selesai (Definition of Done)

1. Buka 1 URL di HP: hero carousel jalan, menu populer & pricelist muncul dari Supabase.
2. Admin bisa login, tambah menu + foto dari HP, dalam <10 detik terlihat pengunjung tanpa deploy ulang.
3. Skor Lighthouse mobile ≥ 90, tombol order per produk & section Pesan benar (WA `wa.me` + nama + harga; GoFood/ShopeeFood/GrabFood membuka aplikasi/URL merchant).
4. Repo hanya berisi file di §5, README menjelaskan setup <15 menit.

---

*Dipilih: Opsi C (GitHub Pages + Supabase). Jika nanti traffic naik / butuh kasir, migrasi ke Vercel + Supabase tanpa ganti skema.*
