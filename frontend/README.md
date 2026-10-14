# Frontend Layar Anime

Frontend Next.js untuk membaca data scraping yang disediakan backend Go. Halaman menggunakan App Router, Tailwind CSS, dan native `fetch` dari Server Components.

## Menjalankan secara lokal

1. Pastikan backend berjalan di `http://localhost:8080`.
2. Salin `.env.example` menjadi `.env.local` bila alamat backend berbeda.
3. Pasang dependency dan jalankan development server:

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`. Variabel `API_URL` hanya dibaca di server Next.js dan tidak boleh diganti menjadi variabel publik.

## Pemeriksaan

```bash
npm run lint
npm run build
```
