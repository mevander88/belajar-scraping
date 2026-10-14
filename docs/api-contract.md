# Kontrak API internal

Dokumen ini mencatat kontrak yang dipakai bersama oleh backend Go dan frontend Next.js. Perubahan nama field, status error, atau format media harus diperbarui dan diuji pada kedua aplikasi.

## Respons data scraping

Endpoint data mengembalikan envelope dengan dua bagian:

- `meta`: kategori data, URL halaman sumber, waktu pengambilan, jumlah item, status cache, dan peringatan opsional.
- `data`: payload sesuai kategori endpoint.

Status cache yang didukung adalah `hit`, `miss`, `stale`, dan `bypass`. `stale` hanya dipakai ketika data lama sengaja disajikan karena gangguan sementara atau struktur sumber tidak dapat diproses. `bypass` berarti Redis tidak tersedia dan hasil berasal langsung dari sumber.

Field URL dari sumber merupakan informasi hasil scraping. Navigasi internal aplikasi harus menggunakan `slug`, bukan meneruskan URL sumber sebagai parameter publik.

## Respons error

Error HTTP menggunakan bentuk berikut:

- `status`: selalu bernilai `error`.
- `message`: pesan aman untuk pengguna dan tidak memuat detail internal atau URL bertoken.

Status utama adalah 400 untuk parameter tidak valid, 404 untuk konten yang tidak ditemukan, 422 untuk server atau media yang belum didukung, 502 untuk kegagalan sumber, 503 untuk service yang tidak tersedia, dan 504 untuk timeout.

## Readiness

PostgreSQL dan Redis saat ini merupakan dependency opsional bagi endpoint scraping. Readiness tetap HTTP 200 dengan status `degraded` ketika salah satunya terputus, serta menyertakan status masing-masing dependency. Health tetap hanya menyatakan proses API hidup.

## Resolusi dan proxy media

Endpoint resolusi stream menerima slug episode dan ID server yang sebelumnya diberikan oleh endpoint episode. Respons resolusi berisi `server_id`, `provider`, `quality`, `url`, `kind`, dan `content_type`.

Route Handler Next.js hanya meneruskan media file langsung berjenis MP4 atau WebM dari host yang diizinkan. Walaupun parser backend mengenali label HLS dan DASH untuk validasi sumber, keduanya belum menjadi kemampuan player/proxy. Dukungan tidak boleh diumumkan sebelum playlist, segment, dan resource terkait ikut diproxy dan diuji.

Frontend tetap memvalidasi host, HTTPS, content type, redirect, dan Range secara independen. Validasi ganda ini merupakan batas keamanan, bukan alasan untuk membiarkan daftar dukungan berbeda tanpa test.

URL media langsung tidak boleh dikirim ke URL publik player. Player selalu memakai route internal berbasis slug episode dan ID server.
