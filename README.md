# Belajar Scraping

Fondasi monorepo untuk aplikasi scraping dengan Next.js pada frontend, Go Fiber pada backend, GORM sebagai ORM, dan PostgreSQL sebagai database.

## Prasyarat

- Node.js 24 LTS
- Go 1.26 atau versi kompatibel yang lebih baru
- PostgreSQL 18, atau Docker dengan Docker Compose

## Struktur

```text
frontend/   Aplikasi Next.js
backend/    API Go Fiber dan akses PostgreSQL melalui GORM
compose.yaml
```

## Menjalankan secara lokal

1. Salin file konfigurasi contoh:

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. Jalankan PostgreSQL dengan `docker compose up -d postgres`, atau sesuaikan `DATABASE_URL` jika PostgreSQL sudah tersedia secara lokal.

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
- `GET /api/v1/ready` memeriksa kesiapan API dan koneksi PostgreSQL.

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

