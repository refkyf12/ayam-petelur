import { selisihHari, tambahHari } from "./format";

export type Kandang = {
  id: string;
  nama: string;
  tanggal_masuk: string;
  umur_masuk_minggu: number;
  populasi_awal: number;
  harga_per_ekor: number;
  estimasi_harga_afkir: number;
  umur_afkir_minggu: number;
  tanggal_selesai: string | null;
};

export type Catatan = {
  id: string;
  kandang_id: string;
  tanggal: string;
  telur_butir: number;
  telur_kg: number;
  telur_retak: number;
  pakan_kg: number;
  mati: number;
  afkir: number;
  catatan: string | null;
};

export type Pengurangan = Pick<Catatan, "kandang_id" | "tanggal" | "mati" | "afkir">;

export type Biaya = {
  id: string;
  tanggal: string;
  kategori: string;
  keterangan: string | null;
  jumlah: number;
  pakan_kg: number | null;
};

export type Penjualan = {
  id: string;
  tanggal: string;
  jenis: "telur" | "afkir";
  pembeli: string | null;
  jumlah: number;
  harga_satuan: number;
  total: number;
  dibayar: number;
  sisa: number;
  keterangan: string | null;
};

export type Pengaturan = {
  margin_persen: number;
  penyusutan_bulanan: number;
  harga_pasar_kg: number | null;
};

export const PENGATURAN_AWAL: Pengaturan = {
  margin_persen: 15,
  penyusutan_bulanan: 0,
  harga_pasar_kg: null,
};

export const KATEGORI_BIAYA = [
  { id: "pakan", label: "Pembelian pakan" },
  { id: "vaksin_obat", label: "Vaksin, obat & vitamin" },
  { id: "gaji", label: "Gaji / upah" },
  { id: "listrik_air", label: "Listrik & air" },
  { id: "transport", label: "Transport" },
  { id: "kemasan", label: "Kemasan (egg tray, peti)" },
  { id: "perawatan", label: "Perawatan & perbaikan" },
  { id: "lainnya", label: "Lain-lain" },
] as const;

export const labelKategori = (id: string) =>
  KATEGORI_BIAYA.find((k) => k.id === id)?.label ?? id;

/**
 * Jumlah ayam hidup di kandang pada suatu tanggal.
 * `termasukHariItu`: kurangi juga yang mati/afkir pada tanggal itu sendiri.
 */
export function ayamAktif(
  k: Kandang,
  tanggal: string,
  pengurangan: Pengurangan[],
  termasukHariItu = false,
): number {
  if (tanggal < k.tanggal_masuk) return 0;
  if (k.tanggal_selesai && tanggal > k.tanggal_selesai) return 0;
  let n = k.populasi_awal;
  for (const p of pengurangan) {
    if (p.kandang_id !== k.id) continue;
    if (p.tanggal < tanggal || (termasukHariItu && p.tanggal === tanggal)) n -= p.mati + p.afkir;
  }
  return Math.max(0, n);
}

export function umurMinggu(k: Kandang, tanggal: string): number {
  return k.umur_masuk_minggu + Math.floor(selisihHari(k.tanggal_masuk, tanggal) / 7);
}

/**
 * Penyusutan ayam: (harga beli − perkiraan harga afkir) × populasi awal,
 * dibagi rata sepanjang masa produksi (umur masuk s/d umur afkir).
 * Ayam yang mati otomatis ikut jadi biaya karena dihitung dari populasi awal.
 */
export function penyusutanAyam(k: Kandang, awal: string, akhir: string): number {
  const hariProduksi = (k.umur_afkir_minggu - k.umur_masuk_minggu) * 7;
  if (hariProduksi <= 0) return 0;
  const nilai = Math.max(0, k.harga_per_ekor - k.estimasi_harga_afkir) * k.populasi_awal;
  const mulai = awal > k.tanggal_masuk ? awal : k.tanggal_masuk;
  let selesai = tambahHari(k.tanggal_masuk, hariProduksi - 1);
  if (k.tanggal_selesai && k.tanggal_selesai < selesai) selesai = k.tanggal_selesai;
  if (akhir < selesai) selesai = akhir;
  const hari = selisihHari(mulai, selesai) + 1;
  return hari > 0 ? (nilai / hariProduksi) * hari : 0;
}

/** Harga pakan rata-rata tertimbang dari semua pembelian pakan. */
export function hargaPakanPerKg(pembelian: Pick<Biaya, "jumlah" | "pakan_kg">[]): number | null {
  let rp = 0;
  let kg = 0;
  for (const b of pembelian) {
    if (b.pakan_kg && b.pakan_kg > 0) {
      rp += Number(b.jumlah);
      kg += Number(b.pakan_kg);
    }
  }
  return kg > 0 ? rp / kg : null;
}

export type Ringkasan = ReturnType<typeof hitungPeriode>;

export function hitungPeriode(p: {
  awal: string;
  akhir: string;
  jumlahHariBulan: number;
  kandang: Kandang[];
  catatan: Catatan[];
  pengurangan: Pengurangan[];
  biaya: Biaya[];
  hargaPakan: number | null;
  penjualan: Penjualan[];
  pengaturan: Pengaturan;
}) {
  // --- Produksi ---
  let telurKg = 0;
  let telurButir = 0;
  let retak = 0;
  let pakanKg = 0;
  let mati = 0;
  let afkir = 0;
  let ayamHari = 0; // jumlah ayam aktif × hari tercatat, untuk HDP
  const perHari = new Map<string, number>();
  const hariTercatat = new Set<string>();

  for (const c of p.catatan) {
    telurKg += Number(c.telur_kg);
    telurButir += c.telur_butir;
    retak += c.telur_retak;
    pakanKg += Number(c.pakan_kg);
    mati += c.mati;
    afkir += c.afkir;
    hariTercatat.add(c.tanggal);
    perHari.set(c.tanggal, (perHari.get(c.tanggal) ?? 0) + Number(c.telur_kg));
    const k = p.kandang.find((x) => x.id === c.kandang_id);
    if (k) ayamHari += ayamAktif(k, c.tanggal, p.pengurangan);
  }

  const hdp = ayamHari > 0 ? telurButir / ayamHari : null;
  const fcr = telurKg > 0 ? pakanKg / telurKg : null;
  const beratButir = telurButir > 0 ? (telurKg * 1000) / telurButir : null;

  // --- Biaya (dasar HPP) ---
  const rincian: { label: string; nilai: number; catatan?: string }[] = [];
  const biayaPakan = p.hargaPakan != null ? pakanKg * p.hargaPakan : 0;
  rincian.push({
    label: "Pakan terpakai",
    nilai: biayaPakan,
    catatan:
      p.hargaPakan != null
        ? `${pakanKg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} kg × Rp${Math.round(p.hargaPakan).toLocaleString("id-ID")}`
        : "harga pakan belum ada",
  });

  const penyusutan = p.kandang.reduce((s, k) => s + penyusutanAyam(k, p.awal, p.akhir), 0);
  rincian.push({ label: "Penyusutan ayam", nilai: penyusutan });

  const hariPeriode = selisihHari(p.awal, p.akhir) + 1;
  const penyusutanKandang = (Number(p.pengaturan.penyusutan_bulanan) * hariPeriode) / p.jumlahHariBulan;
  if (penyusutanKandang > 0) rincian.push({ label: "Penyusutan kandang & alat", nilai: penyusutanKandang });

  const perKategori = new Map<string, number>();
  for (const b of p.biaya) {
    if (b.kategori === "pakan") continue; // pakan dihitung dari pemakaian, bukan pembelian
    perKategori.set(b.kategori, (perKategori.get(b.kategori) ?? 0) + Number(b.jumlah));
  }
  for (const k of KATEGORI_BIAYA) {
    const v = perKategori.get(k.id);
    if (v) rincian.push({ label: k.label, nilai: v });
  }

  const totalBiaya = rincian.reduce((s, r) => s + r.nilai, 0);
  const hpp = telurKg > 0 ? totalBiaya / telurKg : null;
  const hargaSaran = hpp != null ? hpp * (1 + Number(p.pengaturan.margin_persen) / 100) : null;

  // --- Penjualan ---
  let kgTerjual = 0;
  let omzetTelur = 0;
  let ekorAfkirTerjual = 0;
  let omzetAfkir = 0;
  for (const j of p.penjualan) {
    if (j.jenis === "telur") {
      kgTerjual += Number(j.jumlah);
      omzetTelur += Number(j.total);
    } else {
      ekorAfkirTerjual += Number(j.jumlah);
      omzetAfkir += Number(j.total);
    }
  }
  const hargaRata = kgTerjual > 0 ? omzetTelur / kgTerjual : null;
  const omzet = omzetTelur + omzetAfkir;

  return {
    hariPeriode,
    hariTercatat: hariTercatat.size,
    telurKg,
    telurButir,
    retak,
    pakanKg,
    mati,
    afkir,
    hdp,
    fcr,
    beratButir,
    perHari,
    rincian,
    totalBiaya,
    hpp,
    hargaSaran,
    kgTerjual,
    omzetTelur,
    ekorAfkirTerjual,
    omzetAfkir,
    hargaRata,
    omzet,
    laba: omzet - totalBiaya,
  };
}
