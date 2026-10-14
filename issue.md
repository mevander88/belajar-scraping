# Planning Inisialisasi Project

## Tujuan

Buat project baru di folder ini dengan fondasi frontend, backend, dan database yang siap dikembangkan. Lingkup awal adalah setup project dan integrasi dasar; fitur bisnis akan ditentukan terpisah.

## Teknologi

- **Node.js LTS** sebagai runtime untuk Next.js. Gunakan versi LTS aktif saat implementasi dan catat versinya di project.
- **Next.js** untuk frontend aplikasi.
- **Go Fiber (Gofiber)** untuk backend API, dijalankan menggunakan runtime/toolchain Go.
- **GORM** sebagai ORM pada backend Go.
- **PostgreSQL** sebagai database.

Catatan: Fiber dan GORM merupakan library Go, bukan dependency Node.js. Frontend dan backend perlu dikelola sebagai dua aplikasi dalam satu repository.

## Rencana Implementasi

### 1. Siapkan Struktur Project

- Inisialisasi project di folder saat ini dengan direktori frontend dan backend yang terpisah.
- Gunakan versi stabil teknologi yang kompatibel saat implementasi.
- Siapkan konfigurasi environment, contoh konfigurasi tanpa rahasia, dan aturan Git untuk mengabaikan file lokal serta hasil build.

### 2. Siapkan Frontend

- Inisialisasi Next.js menggunakan Node.js LTS.
- Buat halaman awal sederhana sebagai tanda aplikasi berjalan.
- Siapkan konfigurasi alamat API dan integrasi dasar dengan backend.

### 3. Siapkan Backend

- Inisialisasi aplikasi Go dengan Fiber.
- Siapkan struktur dasar untuk routing, konfigurasi, dan akses database menggunakan GORM.
- Sediakan endpoint pemeriksaan kesehatan aplikasi dan koneksi database.
- Siapkan penanganan error, logging, serta pengaturan akses frontend ke API sesuai kebutuhan.

### 4. Siapkan Database

- Sediakan PostgreSQL untuk pengembangan lokal dengan cara setup yang mudah diulang.
- Hubungkan backend ke database melalui konfigurasi environment.
- Tentukan mekanisme migrasi schema yang konsisten untuk pengembangan berikutnya.
- Jangan menambahkan model bisnis sebelum kebutuhan fitur ditentukan.

### 5. Verifikasi dan Dokumentasi

- Pastikan frontend dan backend dapat dijalankan bersama secara lokal.
- Verifikasi komunikasi frontend ke backend serta koneksi backend ke PostgreSQL.
- Pastikan build frontend dan pemeriksaan dasar backend berhasil.
- Tulis README berisi prasyarat, konfigurasi environment, setup database, dan langkah menjalankan serta memverifikasi project.

## Kriteria Selesai

- Project tersedia di folder ini dengan frontend Next.js dan backend Go Fiber yang terpisah.
- Versi Node.js LTS dan Go yang digunakan terdokumentasi.
- Halaman awal frontend dapat diakses dan menampilkan hasil komunikasi sederhana dengan backend.
- Backend dapat mengakses PostgreSQL menggunakan GORM; kegagalan koneksi terlapor dengan jelas.
- Konfigurasi rahasia tidak disimpan di repository.
- Programmer berikutnya dapat menjalankan project mengikuti README.

## Di Luar Lingkup

- Fitur bisnis, autentikasi, dan desain UI lengkap.
- Deployment production dan infrastruktur lanjutan.
