-- =====================================================================
-- Skema database: Catatan Ternak Ayam Petelur
-- Cara pakai: buka Supabase > SQL Editor > New query > tempel semua isi
-- file ini > klik "Run". Cukup dijalankan SEKALI.
-- =====================================================================

-- Kandang / angkatan ayam. Populasi diinput sekali di sini.
create table if not exists kandang (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  nama text not null,
  tanggal_masuk date not null,
  umur_masuk_minggu int not null default 18,
  populasi_awal int not null check (populasi_awal > 0),
  harga_per_ekor numeric not null default 0,       -- harga beli pullet per ekor
  estimasi_harga_afkir numeric not null default 0, -- perkiraan harga jual afkir per ekor
  umur_afkir_minggu int not null default 90,       -- rencana umur diafkir
  tanggal_selesai date,                            -- isi kalau angkatan ini sudah habis
  created_at timestamptz not null default now()
);

-- Catatan harian per kandang (1 baris per kandang per hari).
create table if not exists catatan_harian (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kandang_id uuid not null references kandang on delete cascade,
  tanggal date not null,
  telur_butir int not null default 0,
  telur_kg numeric not null default 0,
  telur_retak int not null default 0,
  pakan_kg numeric not null default 0,
  mati int not null default 0,
  afkir int not null default 0,
  catatan text,
  created_at timestamptz not null default now(),
  unique (kandang_id, tanggal)
);

-- Pengeluaran. Pembelian pakan dicatat di sini juga (kategori 'pakan' + kg),
-- dipakai untuk menghitung harga pakan rata-rata per kg.
create table if not exists biaya (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  tanggal date not null,
  kategori text not null check (kategori in
    ('pakan','vaksin_obat','gaji','listrik_air','transport','kemasan','perawatan','lainnya')),
  keterangan text,
  jumlah numeric not null check (jumlah >= 0),   -- rupiah
  pakan_kg numeric,                              -- hanya untuk kategori pakan
  created_at timestamptz not null default now()
);

-- Penjualan telur (per kg) dan ayam afkir (per ekor).
create table if not exists penjualan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  tanggal date not null,
  jenis text not null default 'telur' check (jenis in ('telur','afkir')),
  pembeli text,
  jumlah numeric not null check (jumlah > 0),    -- kg (telur) atau ekor (afkir)
  harga_satuan numeric not null check (harga_satuan >= 0),
  total numeric generated always as (jumlah * harga_satuan) stored,
  dibayar numeric not null default 0,
  sisa numeric generated always as (jumlah * harga_satuan - dibayar) stored,
  keterangan text,
  created_at timestamptz not null default now()
);

-- Pengaturan (1 baris per pengguna).
create table if not exists pengaturan (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  margin_persen numeric not null default 15,
  penyusutan_bulanan numeric not null default 0, -- kandang & peralatan, Rp per bulan
  harga_pasar_kg numeric,                        -- harga telur pasaran, untuk pembanding
  updated_at timestamptz not null default now()
);

create index if not exists catatan_tanggal_idx on catatan_harian (user_id, tanggal);
create index if not exists biaya_tanggal_idx on biaya (user_id, tanggal);
create index if not exists penjualan_tanggal_idx on penjualan (user_id, tanggal);

-- Keamanan: setiap pengguna hanya bisa melihat & mengubah datanya sendiri.
alter table kandang enable row level security;
alter table catatan_harian enable row level security;
alter table biaya enable row level security;
alter table penjualan enable row level security;
alter table pengaturan enable row level security;

drop policy if exists "milik sendiri" on kandang;
drop policy if exists "milik sendiri" on catatan_harian;
drop policy if exists "milik sendiri" on biaya;
drop policy if exists "milik sendiri" on penjualan;
drop policy if exists "milik sendiri" on pengaturan;

create policy "milik sendiri" on kandang for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "milik sendiri" on catatan_harian for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "milik sendiri" on biaya for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "milik sendiri" on penjualan for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "milik sendiri" on pengaturan for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
