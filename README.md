# LuminaStore - Katalog Produk DummyJSON (Tugas 5 PAW Antara)

Aplikasi web modern untuk mengambil (*fetch*) dan menampilkan katalog produk secara interaktif dari RESTful API **DummyJSON Products** (`https://dummyjson.com/products`). 

Aplikasi ini dibangun murni menggunakan **HTML5, Vanilla CSS3, dan Native JavaScript (ES6+)** tanpa menggunakan framework atau library eksternal (seperti React, Vue, TailwindCSS, Bootstrap, atau jQuery).

---

## 📌 Metadata Tugas
- **Mata Kuliah**: Pengembangan Aplikasi Web (PAW) Antara
- **Tugas**: Week 5 - Native JavaScript API Fetching
- **NIM**: `20240140118`
- **Format Name Repository**: `PAW-ANTARA-WEEK5-20240140118`
- **Repository Link**: [https://github.com/ilham101106/PAW-ANTARA-WEEK5-20240140118.git](https://github.com/ilham101106/PAW-ANTARA-WEEK5-20240140118.git)

---

## ✨ Fitur Utama Application

1. **Pengambilan Data API (Data Fetching)**:
   - Pengambilan data produk secara asinkron dari `https://dummyjson.com/products` menggunakan `async/await` dan native `fetch()`.
   - Pengambilan daftar kategori produk secara dinamis dari API.

2. **Pencarian Real-Time & Debouncing**:
   - Pencarian produk berdasarkan judul, deskripsi, merk, atau kategori secara langsung dengan indikator status pencarian dan tombol hapus cepat.

3. **Filter Kategori & Pengurutan (Sorting)**:
   - Filter produk berdasarkan *chips button* kategori.
   - Pengurutan harga (Terendah ke Tertinggi, Tertinggi ke Terendah), Rating Tertinggi, Nama Produk (A-Z), dan Diskon Terbesar.

4. **Desain UI Modern & Responsive**:
   - *CSS Custom Properties* (Variables) untuk sistem desain warna, bayangan, font, dan animasi.
   - Dual Mode Tampilan: **Dark Mode (Default)** & **Light Mode** yang persisten tersimpan di `localStorage`.
   - Navbar dengan efek *Glassmorphism*.
   - Grid produk responsif yang menyesuaikan ukuran layar (Desktop, Tablet, Mobile).
   - Tampilan *Skeleton Loading Shimmer Effect* saat memuat data.

5. **Modal Popup Detail Produk**:
   - Menampilkan detail informasi lengkap produk (Galeri Foto dengan *Thumbnail Switcher*, Merk, SKU, Garansi, Informasi Pengiriman, Rating, serta Ulasan Pembeli / *Customer Reviews*).

6. **Keranjang Belanja & Favorit (LocalStorage)**:
   - Fitur *Add to Cart* & *Wishlist* yang tersimpan di `localStorage` browser.
   - Modal drawer samping untuk mengelola item keranjang (tambah, kurang, hapus) dan kalkulasi total harga otomatis.
   - Sistem notifikasi *Toast* melayang untuk umpan balik aksi pengguna.

---

## 📁 Struktur Direktori

```text
PAW-ANTARA-WEEK5-20240140118/
├── index.html       # Struktur HTML5 Utama
├── styles.css       # Core Design System & Vanilla CSS Styling
├── app.js           # Native JS Logic & Fetch API Integration
└── README.md        # Dokumentasi Proyek & Panduan GitHub Push
```

---

## 🚀 Cara Menjalankan Secara Lokal

1. **Clone Repository**:
   ```bash
   git clone https://github.com/ilham101106/PAW-ANTARA-WEEK5-20240140118.git
   cd PAW-ANTARA-WEEK5-20240140118
   ```

2. **Jalankan Aplikasi**:
   - Cukup buka file `index.html` langsung di browser favorit Anda (Double click `index.html`), **ATAU**
   - Gunakan ekstensi *Live Server* di VS Code, **ATAU**
   - Jalankan HTTP server sederhana via terminal:
     ```bash
     npx serve .
     ```

---

## 📤 Panduan Push ke Repository GitHub

Untuk mengunggah hasil pekerjaan ke repository target (`PAW-ANTARA-WEEK5-20240140118`):

```bash
# Initialize git repository (jika belum)
git init

# Hubungkan remote repository
git remote add origin https://github.com/ilham101106/PAW-ANTARA-WEEK5-20240140118.git

# Stage semua file
git add .

# Commit pekerjaan
git commit -m "feat: complete native JS product catalog fetching from DummyJSON API for Week 5 assignment"

# Set branch utama ke main dan push ke origin
git branch -M main
git push -u origin main --force
```

---
*Dikembangkan untuk Tugas 5 PAW Antara &bull; NIM 20240140118*
