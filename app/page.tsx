"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ambilSemua, supabase } from "@/lib/supabase";
import { ambilKandang, ambilPengaturan } from "@/lib/data";
import {
  angka,
  bulanIni,
  hariIni,
  namaBulan,
  persen,
  rentangBulan,
  rupiah,
  selisihHari,
  tambahHari,
} from "@/lib/format";
import {
  ayamAktif,
  hargaPakanPerKg,
  hitungPeriode,
  type Biaya,
  type Catatan,
  type Kandang,
  type Pengaturan,
  type Penjualan,
  type Pengurangan,
  type Ringkasan,
} from "@/lib/hitung";
import { Judul, Kartu, Memuat, Pesan, Statistik, inputCls, inputBulanCls } from "@/components/ui";

type Data = {
  r: Ringkasan;
  awal: string;
  akhir: string;
  kandang: Kandang[];
  pengaturan: Pengaturan;
  hargaPakan: number | null;
  ayamSekarang: number;
  stokKg: number;
  piutang: number;
  jumlahPiutang: number;
};

export default function HalamanRingkasan() {
  const [bulan, setBulan] = useState(bulanIni());
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");

  const muat = useCallback(async () => {
    setError("");
    try {
      const hari = hariIni();
      const { awal, akhir: akhirBulan, jumlahHari } = rentangBulan(bulan);
      // Bulan berjalan: hitung sampai hari ini saja.
      const akhir = akhirBulan > hari && awal <= hari ? hari : akhirBulan;

      const [kandang, pengaturan, catatan, pengurangan, biaya, beliPakan, penjualan, piutangRows, produksiAll, terjualAll] =
        await Promise.all([
          ambilKandang(),
          ambilPengaturan(),
          ambilSemua<Catatan>((a, b) =>
            supabase.from("catatan_harian").select("*").gte("tanggal", awal).lte("tanggal", akhir).order("tanggal").range(a, b),
          ),
          ambilSemua<Pengurangan>((a, b) =>
            supabase.from("catatan_harian").select("kandang_id,tanggal,mati,afkir").or("mati.gt.0,afkir.gt.0").order("tanggal").range(a, b),
          ),
          ambilSemua<Biaya>((a, b) =>
            supabase.from("biaya").select("*").gte("tanggal", awal).lte("tanggal", akhir).order("tanggal").range(a, b),
          ),
          ambilSemua<Pick<Biaya, "jumlah" | "pakan_kg">>((a, b) =>
            supabase.from("biaya").select("jumlah,pakan_kg").eq("kategori", "pakan").lte("tanggal", akhir).order("tanggal").range(a, b),
          ),
          ambilSemua<Penjualan>((a, b) =>
            supabase.from("penjualan").select("*").gte("tanggal", awal).lte("tanggal", akhir).order("tanggal").range(a, b),
          ),
          ambilSemua<{ sisa: number }>((a, b) =>
            supabase.from("penjualan").select("sisa").gt("sisa", 0).order("tanggal").range(a, b),
          ),
          ambilSemua<{ telur_kg: number }>((a, b) =>
            supabase.from("catatan_harian").select("telur_kg").order("tanggal").range(a, b),
          ),
          ambilSemua<{ jumlah: number }>((a, b) =>
            supabase.from("penjualan").select("jumlah").eq("jenis", "telur").order("tanggal").range(a, b),
          ),
        ]);

      const hargaPakan = hargaPakanPerKg(beliPakan);
      const r = hitungPeriode({
        awal,
        akhir,
        jumlahHariBulan: jumlahHari,
        kandang,
        catatan,
        pengurangan,
        biaya,
        hargaPakan,
        penjualan,
        pengaturan,
      });

      setData({
        r,
        awal,
        akhir,
        kandang,
        pengaturan,
        hargaPakan,
        ayamSekarang: kandang.reduce((s, k) => s + ayamAktif(k, hari, pengurangan, true), 0),
        stokKg:
          produksiAll.reduce((s, x) => s + Number(x.telur_kg), 0) - terjualAll.reduce((s, x) => s + Number(x.jumlah), 0),
        piutang: piutangRows.reduce((s, x) => s + Number(x.sisa), 0),
        jumlahPiutang: piutangRows.length,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [bulan]);

  useEffect(() => {
    muat();
  }, [muat]);

  return (
    <>
      <Judul
        kanan={
          <input
            type="month"
            className={inputBulanCls}
            value={bulan}
            max={bulanIni()}
            onChange={(e) => e.target.value && setBulan(e.target.value)}
          />
        }
      >
        Ringkasan
      </Judul>

      {error && <Pesan nada="error">Gagal memuat data: {error}</Pesan>}
      {!data && !error && <Memuat />}
      {data && <IsiRingkasan d={data} bulan={bulan} />}
    </>
  );
}

function IsiRingkasan({ d, bulan }: { d: Data; bulan: string }) {
  const { r, pengaturan } = d;

  if (d.kandang.length === 0) {
    return (
      <Pesan nada="info">
        Selamat datang! Langkah pertama: <Link href="/kandang" className="font-semibold text-hijau-700 underline">tambahkan kandang</Link>{" "}
        beserta jumlah populasi ayamnya. Setelah itu isi pembelian pakan di menu Biaya, lalu catat produksi harian di menu Input.
      </Pesan>
    );
  }

  const peringatan: React.ReactNode[] = [];
  if (d.hargaPakan == null)
    peringatan.push(
      <>
        Harga pakan belum diketahui, jadi biaya pakan dihitung Rp0.{" "}
        <Link href="/biaya" className="font-semibold underline">Catat pembelian pakan</Link> (beserta kg-nya).
      </>,
    );
  const hariKosong = r.hariPeriode - r.hariTercatat;
  if (hariKosong > 0 && r.hariTercatat > 0)
    peringatan.push(<>{hariKosong} hari di periode ini belum ada catatan produksi, jadi HPP bisa kurang akurat.</>);

  const marginAktual = r.hpp && r.hargaRata ? r.hargaRata / r.hpp - 1 : null;
  const pasar = pengaturan.harga_pasar_kg ? Number(pengaturan.harga_pasar_kg) : null;

  return (
    <div className="space-y-4">
      <p className="-mt-2 text-sm text-stone-500">
        {namaBulan(bulan)} · {r.hariTercatat} dari {r.hariPeriode} hari tercatat
      </p>

      {peringatan.map((p, i) => (
        <Pesan key={i} nada="peringatan">
          {p}
        </Pesan>
      ))}

      {/* HPP & harga jual */}
      <section className="rounded-2xl bg-hijau-800 p-4 text-white">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-hijau-100">HPP per kg</div>
            <div className="angka text-2xl font-bold">{rupiah(r.hpp)}</div>
          </div>
          <div>
            <div className="text-xs text-hijau-100">Saran harga jual (+{angka(Number(pengaturan.margin_persen), 1)}%)</div>
            <div className="angka text-2xl font-bold text-kuning-100">{rupiah(r.hargaSaran)}</div>
          </div>
          <div>
            <div className="text-xs text-hijau-100">Rata-rata harga jual kamu</div>
            <div className="angka text-lg font-semibold">{rupiah(r.hargaRata)}</div>
            {marginAktual != null && (
              <div className={`text-xs ${marginAktual < 0 ? "text-red-200" : "text-hijau-100"}`}>
                margin {persen(marginAktual)}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-hijau-100">Harga pasar</div>
            <div className="angka text-lg font-semibold">{pasar ? rupiah(pasar) : "–"}</div>
            {!pasar && (
              <Link href="/pengaturan" className="text-xs text-hijau-100 underline">
                isi di Pengaturan
              </Link>
            )}
          </div>
        </div>
        {r.hpp != null && r.hargaRata != null && r.hargaRata < r.hpp && (
          <div className="mt-3 rounded-lg bg-red-600/90 px-3 py-2 text-sm">
            Harga jual rata-rata di bawah HPP, artinya rugi {rupiah(r.hpp - r.hargaRata)} per kg.
          </div>
        )}
        {r.hpp != null && pasar != null && pasar < r.hpp && (
          <div className="mt-3 rounded-lg bg-kuning-500/90 px-3 py-2 text-sm text-stone-900">
            Harga pasar sedang di bawah HPP kamu.
          </div>
        )}
      </section>

      <Kartu judul="Produksi">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Statistik label="Telur" nilai={`${angka(r.telurKg, 1)} kg`} sub={`${angka(r.telurButir)} butir`} />
          <Statistik
            label="Produksi (HDP)"
            nilai={persen(r.hdp)}
            sub="telur ÷ ayam aktif"
            nada={r.hdp == null ? undefined : r.hdp >= 0.85 ? "baik" : r.hdp < 0.7 ? "buruk" : undefined}
          />
          <Statistik
            label="FCR"
            nilai={angka(r.fcr, 2)}
            sub="kg pakan per kg telur"
            nada={r.fcr == null ? undefined : r.fcr <= 2.2 ? "baik" : r.fcr > 2.6 ? "buruk" : undefined}
          />
          <Statistik label="Pakan terpakai" nilai={`${angka(r.pakanKg, 1)} kg`} />
          <Statistik label="Berat rata-rata" nilai={r.beratButir ? `${angka(r.beratButir, 1)} g` : "–"} sub="per butir" />
          <Statistik label="Telur retak" nilai={angka(r.retak)} sub="butir" />
        </div>
        <GrafikHarian r={r} awal={d.awal} akhir={d.akhir} />
      </Kartu>

      <Kartu judul="Populasi & stok (saat ini)">
        <div className="grid grid-cols-3 gap-4">
          <Statistik label="Ayam aktif" nilai={angka(d.ayamSekarang)} sub="ekor" />
          <Statistik label="Mati / afkir bln ini" nilai={`${angka(r.mati)} / ${angka(r.afkir)}`} sub="ekor" />
          <Statistik label="Stok telur" nilai={`${angka(Math.max(0, d.stokKg), 1)} kg`} sub="produksi − terjual" />
        </div>
      </Kartu>

      <Kartu judul="Keuangan">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Statistik label="Penjualan" nilai={rupiah(r.omzet)} sub={`${angka(r.kgTerjual, 1)} kg telur`} />
          <Statistik label="Total biaya" nilai={rupiah(r.totalBiaya)} />
          <Statistik label="Laba" nilai={rupiah(r.laba)} nada={r.laba >= 0 ? "baik" : "buruk"} />
          <Statistik
            label="Piutang"
            nilai={rupiah(d.piutang)}
            sub={d.jumlahPiutang ? <Link href="/penjualan" className="underline">{d.jumlahPiutang} transaksi</Link> : "semua lunas"}
            nada={d.piutang > 0 ? "buruk" : undefined}
          />
        </div>
        {r.omzetAfkir > 0 && (
          <p className="mt-2 text-xs text-stone-500">
            Termasuk penjualan ayam afkir {angka(r.ekorAfkirTerjual)} ekor = {rupiah(r.omzetAfkir)}.
          </p>
        )}
      </Kartu>

      <Kartu judul="Rincian biaya (dasar HPP)">
        <table className="w-full text-sm">
          <tbody>
            {r.rincian.map((x) => (
              <tr key={x.label} className="border-b border-stone-100 last:border-0">
                <td className="py-2">
                  {x.label}
                  {x.catatan && <div className="text-xs text-stone-500">{x.catatan}</div>}
                </td>
                <td className="angka py-2 text-right">{rupiah(x.nilai)}</td>
                <td className="angka w-14 py-2 text-right text-xs text-stone-500">
                  {r.totalBiaya > 0 ? persen(x.nilai / r.totalBiaya, 0) : ""}
                </td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="pt-2">Total</td>
              <td className="angka pt-2 text-right">{rupiah(r.totalBiaya)}</td>
              <td />
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-xs text-stone-500">
          HPP = total biaya ÷ kg telur yang dihasilkan. Biaya pakan dihitung dari pakan yang <i>terpakai</i> × harga rata-rata
          pembelian, bukan dari pembelian bulan ini.
        </p>
      </Kartu>
    </div>
  );
}

function GrafikHarian({ r, awal, akhir }: { r: Ringkasan; awal: string; akhir: string }) {
  const n = selisihHari(awal, akhir) + 1;
  if (n <= 0 || r.telurKg === 0) return null;
  const hari = Array.from({ length: n }, (_, i) => tambahHari(awal, i));
  const maks = Math.max(...hari.map((h) => r.perHari.get(h) ?? 0));

  return (
    <div className="mt-4">
      <div className="mb-1 text-xs text-stone-500">Telur per hari (kg)</div>
      <div className="flex h-24 items-end gap-[2px]">
        {hari.map((h) => {
          const v = r.perHari.get(h) ?? 0;
          return (
            <div
              key={h}
              title={`${h.slice(8)}: ${angka(v, 1)} kg`}
              className={`flex-1 rounded-t-sm ${v ? "bg-hijau-600" : "bg-stone-200"}`}
              style={{ height: v ? `${Math.max(4, (v / maks) * 100)}%` : "3px" }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-stone-400">
        <span>{Number(awal.slice(8))}</span>
        <span>maks {angka(maks, 1)} kg</span>
        <span>{Number(akhir.slice(8))}</span>
      </div>
    </div>
  );
}
