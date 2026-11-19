# Panduan Setup: Catatan Ayam Petelur

Cukup dilakukan **sekali**, kira-kira 20–30 menit. Semuanya gratis. Yang dibutuhkan cuma email dan browser.

Urutannya:
1. Supabase: bikin database
2. GitHub: tempat menyimpan kode
3. Vercel: biar app-nya online
4. Pasang di HP

---

## 1. Supabase (database)

1. Buka **supabase.com**, klik **Start your project**, lalu daftar (paling gampang pakai akun GitHub, jadi bikin akun GitHub dulu di langkah 2 juga boleh).
2. Klik **New project**:
   - **Name**: `ayam-petelur`
   - **Database Password**: klik *Generate*, lalu simpan di catatan HP.
   - **Region**: **Southeast Asia (Singapore)**, biar cepat.
   - Klik **Create new project** dan tunggu ±2 menit.
3. Bikin tabel:
   - Menu kiri, pilih **SQL Editor**, lalu **New query**.
   - Buka file `supabase/schema.sql` di folder ini, salin **semua** isinya, lalu tempel.
   - Klik **Run**. Harusnya muncul *Success. No rows returned*.
4. Bikin akun login lo:
   - Menu kiri, pilih **Authentication**, lalu **Users**, **Add user**, **Create new user**.
   - Isi email dan kata sandi, centang **Auto Confirm User**, lalu klik **Create user**.
5. Tutup pendaftaran supaya orang lain nggak bisa bikin akun:
   - Pilih **Authentication**, lalu **Sign In / Providers** (atau **Settings**).
   - Matikan **Allow new users to sign up**, lalu klik **Save**.
6. Ambil kunci sambungan dan salin ke catatan:
   - **Project URL**, contohnya `https://abcdxyz.supabase.co`. Cara mendapatkannya: klik tombol hijau **Connect** di atas, atau buka **Settings**, lalu **Data API**.
   - **Publishable key**, yang diawali `sb_publishable_…`. Cara mendapatkannya: buka **Settings**, lalu **API Keys**, dan klik ikon copy.
   - ⚠️ Jangan pakai **Secret key** (`sb_secret_…`).

## 2. GitHub (tempat kode)

1. Buka **github.com** dan daftar.
2. Klik **+** di kanan atas, pilih **New repository**:
   - **Repository name**: `ayam-petelur`
   - Pilih **Private**
   - Klik **Create repository**
3. Di halaman berikutnya, klik link **uploading an existing file**.
4. Buka folder `Ayam Petelur` di file manager, lalu **pilih semua file dan folder KECUALI `node_modules` dan `.next`**. Seret semuanya ke halaman GitHub tadi.
5. Tunggu upload selesai, lalu klik **Commit changes**.

## 3. Vercel (online-kan app)

1. Buka **vercel.com**, klik **Sign Up**, lalu **Continue with GitHub**.
2. Klik **Add New…**, pilih **Project**, lalu klik **Import** di repo `ayam-petelur`.
3. Buka bagian **Environment Variables** dan tambahkan dua baris:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL dari Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key dari Supabase |

4. Klik **Deploy** dan tunggu ±1–2 menit.
5. Setelah selesai, lo dapat alamat seperti `ayam-petelur-xxxx.vercel.app`. Itu app-nya.

## 4. Pasang di HP

- **Android (Chrome):** buka alamat tadi, ketuk menu ⋮, lalu **Tambahkan ke layar utama** / **Instal aplikasi**.
- **iPhone (Safari):** buka alamat tadi, ketuk tombol Bagikan, lalu **Tambah ke Layar Utama**.

Setelah itu, login pakai email dan kata sandi dari langkah 1.4.

---

## Mulai pakai (urutan pertama kali)

1. **Lainnya → Kandang**: tambah kandang. Isi populasi awal, tanggal masuk, umur, harga beli per ekor, dan perkiraan harga afkir.
2. **Lainnya → Pengaturan**: isi target margin, penyusutan kandang per bulan, dan harga pasar telur.
3. **Biaya**: catat pembelian pakan terakhir (jumlah sak × harga). Ini dipakai untuk menghitung harga pakan per kg.
4. **Input** setiap hari: telur (butir dan kg), pakan (kg), dan ayam mati/afkir kalau ada.
5. **Jual**: catat setiap penjualan. Kalau belum dibayar, hilangkan centang "lunas" supaya masuk daftar piutang.
6. **Ringkasan**: lihat HPP per kg, saran harga jual, HDP, FCR, laba, dan piutang.

## Cara app menghitung

- **HPP per kg** = total biaya bulan itu ÷ kg telur yang dihasilkan.
- **Total biaya** terdiri dari:
  - **Pakan terpakai**: kg pakan dari input harian × harga rata-rata semua pembelian pakan
  - **Penyusutan ayam**: (harga beli − harga afkir) × populasi awal, dibagi rata dari umur masuk sampai umur afkir. Ayam yang mati otomatis ikut jadi biaya.
  - **Penyusutan kandang dan alat**: dari menu Pengaturan
  - **Biaya lain-lain** bulan itu: vaksin, gaji, listrik, kemasan, dll.
- **Saran harga jual** = HPP × (1 + margin target).
- **HDP** = butir telur ÷ ayam aktif. Bagus kalau ≥ 85%.
- **FCR** = kg pakan ÷ kg telur. Bagus kalau ≤ 2,2.

## Batasan versi ini

- Butuh internet waktu input. Kalau sinyal kandang jelek, input bisa ditunda dan tanggalnya diubah belakangan.
- Supabase gratis akan "tidur" kalau 7 hari tidak dipakai. Kalau terjadi, buka supabase.com lalu klik **Restore project**. Datanya tidak hilang.
