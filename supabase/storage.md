# Storage Supabase — Dofren

Bagian `STORAGE` di `schema.sql` sudah membuat 2 bucket + policy otomatis.
File ini hanya panduan manual bila ingin cek via Dashboard.

## Bucket

| Bucket | Public? | Isi |
|--------|---------|-----|
| `foto-menu` | Ya (public read) | Foto menu/pricelist, max sisi 1200px, target <300KB |
| `foto-carousel` | Ya (public read) | Foto slide promo 16:9 (mis. 1280x720), target <300KB |

## Cek manual via Dashboard

1. **Storage** → pastikan kedua bucket ada dan *Public* = ON.
2. **Storage → Policies** → pastikan ada:
   - `public_read_storage` (SELECT untuk `anon` + `authenticated`)
   - `admin_write_storage` (ALL untuk `authenticated` yang terdaftar di `profiles`)
3. Test: upload 1 file sebagai admin → *Get URL* → buka di tab incognito (harus bisa dilihat tanpa login).

## Batas Free Tier

Kuota storage gratis ±1GB — cukup untuk ratusan foto terkompres.
Panel admin frontend otomatis: kompres client-side → upload → hapus file lama saat foto diganti.
