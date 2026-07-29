# 📦 Siteman App — DC & Goods Verification System

> Aplikasi Desktop Electron modern untuk manajemen pengecekan barang (Scan & Cek Barang), verifikasi container/koli, klasifikasi BCL & Non-BCL, serta pembuatan Laporan Selisih Pengecekan Barang (LSPB).

---

## 🚀 Fitur Utama

- 🔍 **Unified Scan & Cek Barang**:
  - Satu halaman terpadu untuk pemindaian barcode item (BCL + Non-BCL) dengan dukungan alat *physical barcode scanner*.
  - Modal pengecekan per-Container / Koli dengan progress bar real-time dan kalkulasi kuantitas PCK & PCS.
- 🏢 **Multi-Site & DC Selection**:
  - Pemilihan Site Toko dan DC Pengirim (GBG, D53, DYS, dll) di awal aplikasi dengan validasi otomatis.
- 📋 **Laporan Selisih Pengecekan Barang (LSPB)**:
  - **LSPB BCL**: Laporan khusus item selisih kategori BCL berdasarkan aturan Aisle per DC.
  - **LSPB Non-BCL**: Laporan khusus item selisih kategori Non-BCL.
  - Fitur kalkulasi otomatis unit Lebih (+) / Kurang (-) dan ekspor ke Excel/CSV.
- 📊 **Report CSV Batch Manager**:
  - Manajemen riwayat laporan hasil pengecekan per-Load Number.
  - Fitur hapus batch dan ekspor CSV berformat standar UTF-8.
- 🔄 **Sinkronisasi FTP / SFTP Otomatis**:
  - Unduh file master barcode & CSV Load langsung dari server `databasedcy` & `central`.
  - Pengecekan status koneksi FTP secara real-time pada footer aplikasi.
- 📁 **Dukungan Offline CSV Import**:
  - Opsi *fallback* untuk mengimpor file CSV dataset secara manual saat mode offline.
- 🎨 **Neo-Brutalist Premium UI**:
  - Desain antarmuka modern, kontras tinggi, micro-animations, dan responsif.

---

## 🛠️ Teknologi & Stack

- **Core**: Electron 28 + React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS + Lucide React Icons + Sonner Toast
- **Bundler & Build**: `electron-vite` + `electron-builder` (NSIS Windows Installer)

---

## 💻 Panduan Penggunaan & Instalasi

### 1. Prasyarat System
- **Node.js**: v18.x atau versi lebih baru
- **NPM**: v9.x atau versi lebih baru
- **OS**: Windows 10/11 (x64)

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Buat file `.env` di root direktori proyek (atau salin dari kredensial server):
```env
CSV_FTP_HOST=databasedcy.yogya.com
CSV_FTP_USER=bstbadmin
CSV_FTP_PASSWORD=123456

SFTP_HOST=192.168.9.155
SFTP_PORT=22
SFTP_USER=itcentral
SFTP_PASSWORD=itc123
SFTP_REMOTE_PATH=/data/u01/data/rollout/sku_MASTER_ALL_NEW_YM
```

### 4. Jalankan Server Pengembang (Development)
```bash
npm run dev
```

### 5. Build Aplikasi Windows (Production Setup .exe)
```bash
npm run build:win
```
Hasil file installer `.exe` akan berada di dalam folder `dist/` (contoh: `dist/Siteman Setup 1.0.0.exe`).

---

## 📁 Struktur Direktori Proyek

```text
siteman-app/
├── src/
│   ├── main/                    # Process Utama Electron (IPC handlers & FTP services)
│   ├── preload/                 # Preload Script (ContextBridge IPC exposure)
│   ├── shared/                  # Tipe Data & Interface Bersama (@shared/types)
│   └── renderer/                # Aplikasi React Frontend
│       ├── src/
│       │   ├── components/      # Komponen UI Shared & Scan Box / Modal
│       │   ├── hooks/           # Custom Hooks Global (useSite, useDbStatus)
│       │   ├── lib/             # Utility Helpers & Safe Storage
│       │   └── pages/           # Halaman Aplikasi
│       │       ├── cek-barang/  # Scan & Cek Barang + useCekBarang Hook
│       │       ├── dashboard/   # Dashboard Utama
│       │       ├── lspb-bcl/    # LSPB BCL Page & Hook
│       │       ├── lspb-non-bcl/# LSPB Non-BCL Page & Hook
│       │       └── report-csv/  # Report CSV Page & Hook
├── electron-builder.yml         # Konfigurasi Build Electron Installer
└── package.json
```

---

## 📄 Lisensi

Copyright © 2026 Yogya Group / Yomart IT Operations. All rights reserved.
