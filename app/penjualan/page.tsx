"use client";

import { useCallback, useEffect, useState } from "react";
import { ambilSemua, supabase } from "@/lib/supabase";
import { angka, bacaBulat, bacaDesimal, bulanIni, hariIni, namaBulan, rentangBulan, rupiah, tanggalPendek } from "@/lib/format";
import type { Penjualan } from "@/lib/hitung";
import { Judul, Kartu, Kolom, Memuat, Pesan, Statistik, Tombol, inputCls, inputBulanCls } from "@/components/ui";

export default function HalamanPenjualan() {
  const [bulan, setBulan] = useState(bulanIni());
  const [daftar, setDaftar] = useState<Penjualan[] | null>(null);
  const [piutang, setPiutang] = useState<Penjualan[]>([]);
  const [pembeliLama, setPembeliLama] = useState<string[]>([]);
  const [hargaTerakhir, setHargaTerakhir] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  const muat = useCallback(async () => {
    try {
      const { awal, akhir } = rentangBulan(bulan);
      const [bln, ptg, semua] = await Promise.all([
        ambilSemua<Penjualan>((a, b) =>
          supabase.from("penjualan").select("*").gte("tanggal", awal).lte("tanggal", akhir).order("tanggal", { ascending: false }).range(a, b),
        ),
        ambilSemua<Penjualan>((a, b) => supabase.from("penjualan").select("*").gt("sisa", 0).order("tanggal").range(a, b)),
        supabase.from("penjualan").select("pembeli,jenis,harga_satuan").order("tanggal", { ascending: false }).limit(300),
      ]);
      setDaftar(bln);
      setPiutang(ptg);
      const rows = (semua.data ?? []) as Pick<Penjualan, "pembeli" | "jenis" | "harga_satuan">[];
      setPembeliLama([...new Set(rows.map((r) => r.pembeli).filter(Boolean) as string[])]);
      const harga: Record<string, number> = {};
      for (const r of rows) if (harga[r.jenis] == null) harga[r.jenis] = Number(r.harga_satuan);
      setHargaTerakhir(harga);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [bulan]);

  useEffect(() => {
    muat();
  }, [muat]);

  async function lunasi(j: Penjualan) {
    if (!confirm(`Tandai lunas: ${j.pembeli || "tanpa nama"} ${rupiah(j.total)}?`)) return;
    const { error } = await supabase.from("penjualan").update({ dibayar: j.total }).eq("id", j.id);
    if (error) setError(error.message);
    else muat();
  }

  async function hapus(j: Penjualan) {
    if (!confirm("Hapus transaksi ini?")) return;
    const { error } = await supabase.from("penjualan").delete().eq("id", j.id);
    if (error) setError(error.message);
    else muat();
  }

  const kg = daftar?.filter((j) => j.jenis === "telur").reduce((s, j) => s + Number(j.jumlah), 0) ?? 0;
  const omzet = daftar?.reduce((s, j) => s + Number(j.total), 0) ?? 0;
  const totalPiutang = piutang.reduce((s, j) => s + Number(j.sisa), 0);

  return (
    <>
      <Judul>Penjualan</Judul>
      {error && <Pesan nada="error">{error}</Pesan>}

      <FormJual pembeliLama={pembeliLama} hargaTerakhir={hargaTerakhir} onTersimpan={muat} />

      {piutang.length > 0 && (
        <Kartu judul={`Belum lunas · ${rupiah(totalPiutang)}`} className="mt-6 border-red-200">
          <ul className="divide-y divide-stone-100">
            {piutang.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{j.pembeli || "Tanpa nama"}</div>
                  <div className="text-xs text-stone-500">
                    {tanggalPendek(j.tanggal)} · total {rupiah(j.total)} · kurang <b className="text-red-700">{rupiah(j.sisa)}</b>
                  </div>
                </div>
                <Tombol varian="kedua" className="shrink-0 px-3 py-1.5 text-xs" onClick={() => lunasi(j)}>
                  Lunas
                </Tombol>
              </li>
            ))}
          </ul>
        </Kartu>
      )}

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="font-semibold">Riwayat {namaBulan(bulan)}</h2>
        <input type="month" className={inputBulanCls} value={bulan} max={bulanIni()} onChange={(e) => e.target.value && setBulan(e.target.value)} />
      </div>

      {!daftar ? (
        <Memuat />
      ) : (
        <Kartu>
          <div className="mb-3 grid grid-cols-3 gap-3">
            <Statistik label="Telur terjual" nilai={`${angka(kg, 1)} kg`} />
            <Statistik label="Total penjualan" nilai={rupiah(omzet)} />
            <Statistik label="Rata-rata /kg" nilai={kg ? rupiah(daftar.filter((j) => j.jenis === "telur").reduce((s, j) => s + Number(j.total), 0) / kg) : "–"} />
          </div>
          {daftar.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">Belum ada penjualan di bulan ini.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {daftar.map((j) => (
                <li key={j.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {j.pembeli || "Tanpa nama"}
                      {j.jenis === "afkir" && <span className="ml-2 rounded bg-kuning-100 px-1.5 py-0.5 text-[10px] font-semibold">AFKIR</span>}
                    </div>
                    <div className="angka text-xs text-stone-500">
                      {tanggalPendek(j.tanggal)} · {angka(Number(j.jumlah), 1)} {j.jenis === "telur" ? "kg" : "ekor"} × {rupiah(j.harga_satuan)}
                      {j.keterangan ? ` · ${j.keterangan}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="angka font-semibold">{rupiah(j.total)}</div>
                    <div className="flex justify-end gap-2 text-xs">
                      {Number(j.sisa) > 0 ? <span className="text-red-700">belum lunas</span> : <span className="text-hijau-700">lunas</span>}
                      <button className="text-stone-400 underline" onClick={() => hapus(j)}>
                        hapus
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      )}
    </>
  );
}

function FormJual({
  pembeliLama,
  hargaTerakhir,
  onTersimpan,
}: {
  pembeliLama: string[];
  hargaTerakhir: Record<string, number>;
  onTersimpan: () => void;
}) {
  const [jenis, setJenis] = useState<"telur" | "afkir">("telur");
  const [tanggal, setTanggal] = useState(hariIni());
  const [pembeli, setPembeli] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [harga, setHarga] = useState("");
  const [lunas, setLunas] = useState(true);
  const [dibayar, setDibayar] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ nada: "sukses" | "error"; teks: string } | null>(null);

  // Isi harga otomatis dari transaksi terakhir dengan jenis yang sama.
  useEffect(() => {
    const h = hargaTerakhir[jenis];
    setHarga(h ? h.toLocaleString("id-ID") : "");
  }, [jenis, hargaTerakhir]);

  const nJumlah = jenis === "telur" ? bacaDesimal(jumlah) : bacaBulat(jumlah);
  const nHarga = bacaBulat(harga);
  const total = nJumlah * nHarga;

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (nJumlah <= 0) return setPesan({ nada: "error", teks: "Isi jumlahnya dulu." });
    setProses(true);
    setPesan(null);
    const { error } = await supabase.from("penjualan").insert({
      tanggal,
      jenis,
      pembeli: pembeli.trim() || null,
      jumlah: nJumlah,
      harga_satuan: nHarga,
      dibayar: lunas ? total : Math.min(total, bacaBulat(dibayar)),
      keterangan: keterangan.trim() || null,
    });
    setProses(false);
    if (error) return setPesan({ nada: "error", teks: "Gagal menyimpan: " + error.message });
    setPesan({ nada: "sukses", teks: `Tersimpan: ${rupiah(total)}.` });
    setJumlah("");
    setDibayar("");
    setKeterangan("");
    setLunas(true);
    onTersimpan();
  }

  return (
    <form onSubmit={simpan}>
      <Kartu judul="Catat penjualan">
        <div className="mb-3 grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-semibold">
          {(["telur", "afkir"] as const).map((j) => (
            <button
              key={j}
              type="button"
              onClick={() => setJenis(j)}
              className={`rounded-lg py-2 ${jenis === j ? "bg-white shadow-sm" : "text-stone-500"}`}
            >
              {j === "telur" ? "Telur (kg)" : "Ayam afkir (ekor)"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Kolom label="Tanggal">
            <input type="date" className={inputCls} value={tanggal} max={hariIni()} onChange={(e) => setTanggal(e.target.value)} required />
          </Kolom>
          <Kolom label="Pembeli">
            <input className={inputCls} list="daftar-pembeli" value={pembeli} onChange={(e) => setPembeli(e.target.value)} placeholder="nama" />
            <datalist id="daftar-pembeli">
              {pembeliLama.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Kolom>
          <Kolom label={jenis === "telur" ? "Jumlah (kg)" : "Jumlah (ekor)"}>
            <input className={inputCls} inputMode={jenis === "telur" ? "decimal" : "numeric"} value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="0" />
          </Kolom>
          <Kolom label={jenis === "telur" ? "Harga per kg" : "Harga per ekor"}>
            <input className={inputCls} inputMode="numeric" value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="Rp" />
          </Kolom>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-hijau-50 px-3 py-2">
          <span className="text-sm text-stone-600">Total</span>
          <span className="angka text-lg font-bold text-hijau-800">{rupiah(total)}</span>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5 accent-hijau-700" checked={lunas} onChange={(e) => setLunas(e.target.checked)} />
          Sudah dibayar lunas
        </label>
        {!lunas && (
          <div className="mt-2">
            <Kolom label="Sudah dibayar (Rp)" petunjuk="Kosongkan kalau belum bayar sama sekali.">
              <input className={inputCls} inputMode="numeric" value={dibayar} onChange={(e) => setDibayar(e.target.value)} placeholder="0" />
            </Kolom>
          </div>
        )}
        <div className="mt-3">
          <Kolom label="Keterangan (opsional)">
            <input className={inputCls} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} />
          </Kolom>
        </div>

        {pesan && (
          <div className="mt-3">
            <Pesan nada={pesan.nada}>{pesan.teks}</Pesan>
          </div>
        )}
        <Tombol type="submit" disabled={proses} className="mt-4 w-full py-3 text-base">
          {proses ? "Menyimpan…" : "Simpan penjualan"}
        </Tombol>
      </Kartu>
    </form>
  );
}
