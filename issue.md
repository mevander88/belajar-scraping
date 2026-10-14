# Planning Penambahan Tabel `data_anime`

## Tujuan

Tambahkan tabel `data_anime` pada PostgreSQL untuk menyimpan informasi utama anime. Implementasi harus mengikuti pola GORM dan mekanisme migrasi yang sudah tersedia pada backend.

## Struktur Data

Tabel `data_anime` memiliki kolom berikut:

| Kolom | Tipe | Ketentuan |
| --- | --- | --- |
| `id` | integer | Primary key dan bertambah otomatis |
| `title` | varchar(255) | Judul utama anime |
| `title_japan` | varchar(255) | Judul anime dalam bahasa Jepang |
| `cover_url` | text | URL gambar sampul |
| `skor` | varchar(10) | Nilai atau skor anime |
| `produesur` | varchar(100) | Informasi produser |
| `tipe` | varchar(100) | Tipe anime |
| `status` | enum atau varchar | Hanya menerima `ongoing` atau `complete` |
| `total_episode` | varchar(100) | Jumlah episode |
| `duration` | varchar(100) | Durasi episode |
| `release_date` | date | Tanggal rilis |
| `studion` | varchar(100) | Nama studio |
| `genre` | varchar(255) | Daftar genre |
| `created_at` | timestamp | Otomatis menggunakan waktu saat data dibuat |
| `updated_at` | timestamp | Waktu perubahan terakhir |
| `deleted_at` | timestamp | Mendukung soft delete dan boleh kosong |

## Rencana Implementasi

1. Buat model GORM yang merepresentasikan tabel `data_anime` dan seluruh kolom di atas.
2. Gunakan tipe data Go dan tag GORM yang sesuai dengan tipe kolom PostgreSQL.
3. Batasi nilai `status` menjadi `ongoing` atau `complete` melalui validasi atau constraint database.
4. Daftarkan model pada mekanisme migrasi backend agar tabel dibuat atau diperbarui ketika migrasi dijalankan.
5. Pastikan `id`, timestamp pembuatan, timestamp pembaruan, dan soft delete dikelola secara konsisten oleh GORM.
6. Tambahkan pengujian yang memastikan model dapat dimigrasikan dan aturan penting pada schema diterapkan.
7. Perbarui dokumentasi backend dengan cara menjalankan migrasi.

## Catatan Implementasi

- Gunakan penamaan tabel `data_anime` secara eksplisit agar GORM tidak mengubahnya menjadi bentuk plural lain.
- Pertahankan nama kolom `produesur` dan `studion` sesuai kebutuhan saat ini.
- `deleted_at` harus memiliki index agar query soft delete tetap efisien.
- Jangan menambahkan endpoint CRUD atau proses scraping dalam pekerjaan ini.

## Kriteria Selesai

- Model GORM untuk `data_anime` tersedia dan dapat dikompilasi.
- Migrasi berhasil membuat tabel dengan tipe dan batasan kolom yang sesuai.
- Nilai `status` di luar `ongoing` dan `complete` ditolak.
- `created_at` memiliki nilai default waktu pembuatan.
- `updated_at` dapat diperbarui ketika data berubah.
- `deleted_at` mendukung mekanisme soft delete GORM.
- Test backend dan dokumentasi migrasi berhasil diperbarui.
