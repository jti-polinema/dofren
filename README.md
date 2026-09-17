# Dofren — Friend Donat dan Bakery

Landing page satu halaman untuk promosi UMKM donat Malang.

> **Jargon:** Produsen Donat Premium dan Ekonomis Malang

Pengunjung bisa lihat carousel promo, menu populer, pricelist, lalu pesan via **GoFood / ShopeeFood / GrabFood / WA Bisnis**. Admin bisa **login dan edit menu, harga, foto carousel & populer** langsung dari HP — tanpa deploy ulang, tanpa ngoding.

Arsitektur: frontend statis (HTML + Tailwind + Vanilla JS) di **GitHub Pages** + backend gratis **Supabase** (Auth + Postgres + Storage). Detail rancangan: lihat [PLAN.md](PLAN.md).

## Struktur repo

```
├── index.html               # single page utama
├── 404.html                 # fallback GitHub Pages
├── robots.txt / sitemap.xml / manifest.json / favicon.png
├── css/style.css
├── js/config.js             # <-- ISI Supabase URL + anon key di sini
├── js/supabase-client.js | app.js | auth.js | admin.js
├── assets/                  # logo + foto fallback
├── data/seed.json           # data awal (dipakai saat DB kosong/offline)
└── supabase/schema.sql      # skema DB + RLS (jalankan 1x di Supabase)
```

## 1. Jalan lokal (tanpa backend, mode fallback)

Tanpa setup apa pun halaman sudah bisa dibuka memakai `data/seed.json`:

- Cara termudah: VS Code → extension **Live Server** → klik kanan `index.html` → *Open with Live Server*.
- Atau via terminal: `npx serve .` lalu buka `http://localhost:3000`.

> Langsung buka file via `file://` tidak disarankan (fetch `seed.json` diblokir browser).

## 2. Setup Supabase (1x saja, ±15 menit)

1. Buat project gratis di [supabase.com](https://supabase.com) (region **Singapore**).
2. Buka **SQL Editor** → jalankan isi file `supabase/schema.sql` (membuat tabel `profiles`, `menus`, `carousel_slides`, `settings` + RLS + seed awal).
3. Buka **Storage** → buat 2 bucket **public**: `foto-menu` dan `foto-carousel` (atau jalankan bagian storage di `schema.sql` bila didukung; detail di `supabase/storage.md`).
4. Buka **Authentication** → matikan *Allow new users to sign up* (hanya invite). Invite email admin via **Users → Add user**.
5. Buka **Project Settings → API** → salin `Project URL` + `anon public key` ke `js/config.js`:

```js
export const SUPABASE_URL = "https://xyzcompany.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

6. Refresh halaman → klik **Masuk** → login sebagai admin → kelola menu/carousel/pengaturan dari panel admin.

## 3. Deploy ke GitHub Pages

1. Push repo ke GitHub (branch `main`, folder `/root`).
2. **Settings → Pages** → Source: *Deploy from a branch* → Branch `main` → folder `/ (root)` → Save.
3. Tunggu 1–2 menit → situs live di `https://<username>.github.io/dofren/`.

## 4. Custom domain `dofren.my.id`

1. **Di repo:** Settings → Pages → **Custom domain** → isi `dofren.my.id` → Save. Ini membuat file `CNAME` di repo (jangan dihapus).
2. **Di DNS tempat domain dibeli** (untuk apex domain, tanpa `www`), tambah 4 record **A**:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
   - Opsional IPv6 (record **AAAA**): `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - Untuk `www.dofren.my.id`: tambah record **CNAME** `www` → `<username>.github.io`.
3. Tunggu propagasi DNS (±10 menit–24 jam), lalu centang **Enforce HTTPS** di Pages (sertifikat gratis otomatis).
4. Perbarui `sitemap.xml` + URL di `js/config.js`/meta tag bila masih menunjuk ke `github.io`.

## 5. Cara pakai panel admin (untuk owner)

1. Klik **Masuk** di navbar → email + password.
2. **Kelola Menu:** tambah/edit/hapus, ubah harga, tandai Populer/Tersedia, upload foto (JPG/PNG/WebP, max 2MB, otomatis dikompres <300KB).
3. **Kelola Carousel:** tambah slide promo 16:9, atur urutan (↑↓), aktif/nonaktif.
4. **Pengaturan:** link GoFood/ShopeeFood/GrabFood/WA, link Google Maps Bisnis, alamat, jam buka, sosmed. Link channel yang dikosongkan otomatis menyembunyikan tombolnya.
5. Klik **Keluar** bila selesai. Semua perubahan tampil ke pengunjung dalam hitungan detik.

## Catatan

- `SUPABASE_ANON_KEY` boleh publik (diamankan via RLS). **Jangan pernah** menaruh `service_role key` di frontend.
- Foto produk awal memakai file di `assets/` sebagai fallback; setelah Supabase terisi, foto dari Storage yang tampil.
