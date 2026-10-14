# Belajar Scraping

Fondasi monorepo untuk aplikasi scraping dengan Next.js pada frontend, Go Fiber pada backend, GORM sebagai ORM, dan PostgreSQL sebagai database.

## Prasyarat

- Node.js 24 LTS
- Go 1.26 atau versi kompatibel yang lebih baru
- PostgreSQL 18 dan Redis 8, atau Docker dengan Docker Compose

## Struktur

```text
frontend/   Aplikasi Next.js
backend/    API Go Fiber, scraper Goquery, cache Redis, dan akses PostgreSQL melalui GORM
compose.yaml
```

## Menjalankan secara lokal

1. Salin file konfigurasi contoh:

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. Jalankan PostgreSQL dan Redis dengan `docker compose up -d postgres redis`, atau sesuaikan `DATABASE_URL` dan `REDIS_URL` jika keduanya sudah tersedia secara lokal.

3. Jalankan backend:

   ```bash
   cd backend
   go run ./cmd/api
   ```

4. Di terminal lain, jalankan frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Buka `http://localhost:3000`. Halaman awal menampilkan status API dan koneksi database.

## Endpoint awal

- `GET /api/v1/health` memeriksa proses API.
- `GET /api/v1/ready` memeriksa koneksi PostgreSQL dan Redis.

## Endpoint scraping

- `GET /api/v1/source/home`
- `GET /api/v1/source/catalog`
- `GET /api/v1/source/schedule`
- `GET /api/v1/source/genres`
- `GET /api/v1/source/genres/{slug}?page=1`
- `GET /api/v1/source/anime?status=ongoing&page=1`
- `GET /api/v1/source/anime/{slug}`
- `GET /api/v1/source/episodes/{slug}`

Respons memiliki metadata sumber, waktu pengambilan, jumlah data, dan kondisi cache: `hit`, `miss`, `stale`, atau `bypass`. Jika website sumber gagal diakses, backend memakai salinan cache lama ketika tersedia. Jika Redis tidak tersedia, backend tetap mengambil data langsung dari sumber.

Koneksi sumber, batas waktu, jeda permintaan, dan masa berlaku cache per kategori dapat diatur melalui variabel pada `backend/.env.example`.

## Migrasi schema

Migrasi berbasis GORM berjalan otomatis ketika backend berhasil terhubung ke PostgreSQL. Migrasi saat ini membuat tabel `data_anime`, termasuk constraint status dan index untuk soft delete.

Untuk menjalankan migrasi secara lokal, cukup mulai backend:

```bash
cd backend
go run ./cmd/api
```

## Verifikasi

```bash
cd backend
go test ./...

cd ../frontend
npm run lint
npm run build
```

