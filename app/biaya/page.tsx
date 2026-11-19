"use client";

import { useCallback, useEffect, useState } from "react";
import { ambilSemua, supabase } from "@/lib/supabase";
import { angka, bacaBulat, bacaDesimal, bulanIni, hariIni, namaBulan, rentangBulan, rupiah, tanggalPendek } from "@/lib/format";
import { KATEGORI_BIAYA, hargaPakanPerKg, labelKategori, type Biaya } from "@/lib/hitung";
import { Judul, Kartu, Kolom, Memuat, Pesan, Tombol, inputCls, inputBulanCls } from "@/components/ui";

export default function HalamanBiaya() {
  const [bulan, setBulan] = useState(bulanIni());
  const [daftar, setDaftar] = useState<Biaya[] | null>(null);
  const [hargaPakan, setHargaPakan] = useState<number | null>(null);
  const [error, setError] = useState("");

  const muat = useCallback(async () => {
    try {
      const { awal, akhir } = rentangBulan(bulan);
      const [bln, pakan] = await Promise.all([
        ambilSemua<Biaya>((a, b) =>
          supabase.from("biaya").select("*").gte("tanggal", awal).lte("tanggal", akhir).order("tanggal", { ascending: false }).range(a, b),
        ),
        ambilSemua<Pick<Biaya, "jumlah" | "pakan_kg">>((a, b) =>
          supabase.from("biaya").select("jumlah,pakan_kg").eq("kategori", "pakan").order("tanggal").range(a, b),
        ),
      ]);
      setDaftar(bln);
      setHargaPakan(hargaPakanPerKg(pakan));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [bulan]);

  useEffect(() => {
    muat();
  }, [muat]);

  async function hapus(b: Biaya) {
    if (!confirm(`Hapus ${labelKategori(b.kategori)} ${rupiah(b.jumlah)}?`)) return;
    const { error } = await supabase.from("biaya").delete().eq("id", b.id);
    if (error) setError(error.message);
    else muat();
  }

  const perKategori = new Map<string, number>();
  for (const b of daftar ?? []) perKategori.set(b.kategori, (perKategori.get(b.kategori) ?? 0) + Number(b.jumlah));
  const total = [...perKategori.values()].reduce((s, v) => s + v, 0);

  return (
    <>
      <Judul>Biaya</Judul>
      {error && <Pesan nada="error">{error}</Pesan>}

      <FormBiaya onTersimpan={muat} />

      <p className="mt-3 text-xs text-stone-500">
        Harga pakan rata-rata saat ini: <b className="text-stone-800">{hargaPakan ? `${rupiah(hargaPakan)}/kg` : "belum ada"}</b>.
        Angka ini yang dipakai untuk menghitung biaya pakan di HPP.
      </p>

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="font-semibold">Pengeluaran {namaBulan(bulan)}</h2>
        <input type="month" className={inputBulanCls} value={bulan} max={bulanIni()} onChange={(e) => e.target.value && setBulan(e.target.value)} />
      </div>

      {!daftar ? (
        <Memuat />
      ) : (
        <Kartu>
          {perKategori.size > 0 && (
            <div className="mb-3 space-y-1 border-b border-stone-100 pb-3 text-sm">
              {KATEGORI_BIAYA.filter((k) => perKategori.has(k.id)).map((k) => (
                <div key={k.id} className="flex justify-between">
                  <span className="text-stone-600">{k.label}</span>
                  <span className="angka">{rupiah(perKategori.get(k.id))}</span>
                </div>
              ))}
              <div className="flex justify-between pt-1 font-semibold">
                <span>Total keluar</span>
                <span className="angka">{rupiah(total)}</span>
              </div>
            </div>
          )}
          {daftar.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-500">Belum ada pengeluaran di bulan ini.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {daftar.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{labelKategori(b.kategori)}</div>
                    <div className="angka truncate text-xs text-stone-500">
                      {tanggalPendek(b.tanggal)}
                      {b.pakan_kg ? ` · ${angka(Number(b.pakan_kg), 1)} kg (${rupiah(Number(b.jumlah) / Number(b.pakan_kg))}/kg)` : ""}
                      {b.keterangan ? ` · ${b.keterangan}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="angka font-semibold">{rupiah(b.jumlah)}</div>
                    <button className="text-xs text-stone-400 underline" onClick={() => hapus(b)}>
                      hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-stone-500">
            Catatan: pembelian pakan di sini adalah uang keluar. Di HPP, yang dihitung adalah pakan yang <i>terpakai</i> (dari input harian).
          </p>
        </Kartu>
      )}
    </>
  );
}

function FormBiaya({ onTersimpan }: { onTersimpan: () => void }) {
  const [kategori, setKategori] = useState<string>("pakan");
  const [tanggal, setTanggal] = useState(hariIni());
  const [jumlahSak, setJumlahSak] = useState("");
  const [kgPerSak, setKgPerSak] = useState("50");
  const [hargaSak, setHargaSak] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ nada: "sukses" | "error"; teks: string } | null>(null);

  const isPakan = kategori === "pakan";
  const totalKg = bacaDesimal(jumlahSak) * bacaDesimal(kgPerSak);
  const totalRp = isPakan ? bacaDesimal(jumlahSak) * bacaBulat(hargaSak) : bacaBulat(jumlah);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (totalRp <= 0) return setPesan({ nada: "error", teks: "Isi nominalnya dulu." });
    if (isPakan && totalKg <= 0) return setPesan({ nada: "error", teks: "Isi jumlah sak dan kg per sak." });
    setProses(true);
    setPesan(null);
    const { error } = await supabase.from("biaya").insert({
      tanggal,
      kategori,
      jumlah: totalRp,
      pakan_kg: isPakan ? totalKg : null,
      keterangan: keterangan.trim() || null,
    });
    setProses(false);
    if (error) return setPesan({ nada: "error", teks: "Gagal menyimpan: " + error.message });
    setPesan({ nada: "sukses", teks: `Tersimpan: ${labelKategori(kategori)} ${rupiah(totalRp)}.` });
    setJumlahSak("");
    setJumlah("");
    setKeterangan("");
    onTersimpan();
  }

  return (
    <form onSubmit={simpan}>
      <Kartu judul="Catat pengeluaran">
        <div className="grid grid-cols-2 gap-3">
          <Kolom label="Tanggal">
            <input type="date" className={inputCls} value={tanggal} max={hariIni()} onChange={(e) => setTanggal(e.target.value)} required />
          </Kolom>
          <Kolom label="Kategori">
            <select className={inputCls} value={kategori} onChange={(e) => setKategori(e.target.value)}>
              {KATEGORI_BIAYA.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </Kolom>
        </div>

        {isPakan ? (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Kolom label="Jumlah sak">
              <input className={inputCls} inputMode="decimal" value={jumlahSak} onChange={(e) => setJumlahSak(e.target.value)} placeholder="0" />
            </Kolom>
            <Kolom label="Kg per sak">
              <input className={inputCls} inputMode="decimal" value={kgPerSak} onChange={(e) => setKgPerSak(e.target.value)} />
            </Kolom>
            <Kolom label="Harga per sak">
              <input className={inputCls} inputMode="numeric" value={hargaSak} onChange={(e) => setHargaSak(e.target.value)} placeholder="Rp" />
            </Kolom>
          </div>
        ) : (
          <div className="mt-3">
            <Kolom label="Nominal (Rp)">
              <input className={inputCls} inputMode="numeric" value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="0" />
            </Kolom>
          </div>
        )}

        <div className="mt-3">
          <Kolom label="Keterangan (opsional)">
            <input
              className={inputCls}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={isPakan ? "mis. konsentrat + jagung, merk" : "mis. vaksin ND-IB"}
            />
          </Kolom>
        </div>

        {totalRp > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-hijau-50 px-3 py-2 text-sm">
            <span className="text-stone-600">{isPakan ? `${angka(totalKg, 1)} kg · ${rupiah(totalKg ? totalRp / totalKg : 0)}/kg` : "Total"}</span>
            <span className="angka text-lg font-bold text-hijau-800">{rupiah(totalRp)}</span>
          </div>
        )}

        {pesan && (
          <div className="mt-3">
            <Pesan nada={pesan.nada}>{pesan.teks}</Pesan>
          </div>
        )}
        <Tombol type="submit" disabled={proses} className="mt-4 w-full py-3 text-base">
          {proses ? "Menyimpan…" : "Simpan pengeluaran"}
        </Tombol>
      </Kartu>
    </form>
  );
}
