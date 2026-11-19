"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase, wajib } from "@/lib/supabase";
import { ambilKandang } from "@/lib/data";
import { angka, bacaBulat, bacaDesimal, hariIni, persen, tambahHari, tanggalPanjang, tanggalPendek, teksAngka } from "@/lib/format";
import { ayamAktif, type Catatan, type Kandang, type Pengurangan } from "@/lib/hitung";
import { Judul, Kartu, Kolom, Memuat, Pesan, Tombol, inputCls } from "@/components/ui";

type Form = {
  telur_butir: string;
  telur_kg: string;
  telur_retak: string;
  pakan_kg: string;
  mati: string;
  afkir: string;
  catatan: string;
};

const KOSONG: Form = { telur_butir: "", telur_kg: "", telur_retak: "", pakan_kg: "", mati: "", afkir: "", catatan: "" };

export default function HalamanInput() {
  const [kandang, setKandang] = useState<Kandang[] | null>(null);
  const [kandangId, setKandangId] = useState("");
  const [tanggal, setTanggal] = useState(hariIni());
  const [form, setForm] = useState<Form>(KOSONG);
  const [sudahAda, setSudahAda] = useState(false);
  const [populasi, setPopulasi] = useState<number | null>(null);
  const [riwayat, setRiwayat] = useState<Catatan[]>([]);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ nada: "sukses" | "error"; teks: string } | null>(null);

  useEffect(() => {
    ambilKandang()
      .then((ks) => {
        const aktif = ks.filter((k) => !k.tanggal_selesai || k.tanggal_selesai >= hariIni());
        setKandang(aktif);
        if (aktif.length) setKandangId(aktif[0].id);
      })
      .catch((e) => setPesan({ nada: "error", teks: e.message }));
  }, []);

  const muat = useCallback(async () => {
    if (!kandangId) return;
    const k = kandang?.find((x) => x.id === kandangId);
    if (!k) return;
    try {
      const [ini, sebelumnya, pengurangan, terakhir] = await Promise.all([
        supabase.from("catatan_harian").select("*").eq("kandang_id", kandangId).eq("tanggal", tanggal).maybeSingle(),
        supabase
          .from("catatan_harian")
          .select("pakan_kg")
          .eq("kandang_id", kandangId)
          .lt("tanggal", tanggal)
          .order("tanggal", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("catatan_harian").select("kandang_id,tanggal,mati,afkir").eq("kandang_id", kandangId).or("mati.gt.0,afkir.gt.0"),
        supabase.from("catatan_harian").select("*").eq("kandang_id", kandangId).order("tanggal", { ascending: false }).limit(7),
      ]);
      const c = wajib(ini) as Catatan | null;
      setSudahAda(Boolean(c));
      if (c) {
        setForm({
          telur_butir: teksAngka(c.telur_butir),
          telur_kg: teksAngka(Number(c.telur_kg)),
          telur_retak: teksAngka(c.telur_retak),
          pakan_kg: teksAngka(Number(c.pakan_kg)),
          mati: teksAngka(c.mati),
          afkir: teksAngka(c.afkir),
          catatan: c.catatan ?? "",
        });
      } else {
        // Pakan biasanya sama tiap hari: isi otomatis dari catatan sebelumnya.
        const prev = wajib(sebelumnya) as { pakan_kg: number } | null;
        setForm({ ...KOSONG, pakan_kg: prev ? teksAngka(Number(prev.pakan_kg)) : "" });
      }
      setPopulasi(ayamAktif(k, tanggal, (wajib(pengurangan) ?? []) as Pengurangan[]));
      setRiwayat((wajib(terakhir) ?? []) as Catatan[]);
    } catch (e) {
      setPesan({ nada: "error", teks: e instanceof Error ? e.message : String(e) });
    }
  }, [kandangId, tanggal, kandang]);

  useEffect(() => {
    muat();
  }, [muat]);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);
    const { error } = await supabase.from("catatan_harian").upsert(
      {
        kandang_id: kandangId,
        tanggal,
        telur_butir: bacaBulat(form.telur_butir),
        telur_kg: bacaDesimal(form.telur_kg),
        telur_retak: bacaBulat(form.telur_retak),
        pakan_kg: bacaDesimal(form.pakan_kg),
        mati: bacaBulat(form.mati),
        afkir: bacaBulat(form.afkir),
        catatan: form.catatan.trim() || null,
      },
      { onConflict: "kandang_id,tanggal" },
    );
    setProses(false);
    if (error) {
      setPesan({ nada: "error", teks: "Gagal menyimpan: " + error.message });
    } else {
      setPesan({ nada: "sukses", teks: `Tersimpan untuk ${tanggalPanjang(tanggal)}.` });
      muat();
    }
  }

  async function hapus() {
    if (!confirm("Hapus catatan tanggal ini?")) return;
    const { error } = await supabase.from("catatan_harian").delete().eq("kandang_id", kandangId).eq("tanggal", tanggal);
    if (error) setPesan({ nada: "error", teks: error.message });
    else {
      setPesan({ nada: "sukses", teks: "Catatan dihapus." });
      muat();
    }
  }

  if (!kandang) return <Memuat />;
  if (kandang.length === 0)
    return (
      <>
        <Judul>Input harian</Judul>
        <Pesan>
          Belum ada kandang aktif. <Link href="/kandang" className="font-semibold text-hijau-700 underline">Tambah kandang dulu</Link>.
        </Pesan>
      </>
    );

  const ubah = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });
  const butir = bacaBulat(form.telur_butir);
  const kg = bacaDesimal(form.telur_kg);

  return (
    <>
      <Judul>Input harian</Judul>

      <form onSubmit={simpan} className="space-y-4">
        <Kartu>
          <div className="grid grid-cols-2 gap-3">
            <Kolom label="Tanggal">
              <input type="date" className={inputCls} value={tanggal} max={hariIni()} onChange={(e) => e.target.value && setTanggal(e.target.value)} />
            </Kolom>
            <Kolom label="Kandang">
              <select className={inputCls} value={kandangId} onChange={(e) => setKandangId(e.target.value)}>
                {kandang.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </Kolom>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
            <span>Ayam aktif: <b className="text-stone-800">{angka(populasi)}</b> ekor</span>
            <span className="flex gap-3">
              <button type="button" className="underline" onClick={() => setTanggal(tambahHari(tanggal, -1))}>
                ← kemarin
              </button>
              {tanggal < hariIni() && (
                <button type="button" className="underline" onClick={() => setTanggal(hariIni())}>
                  hari ini
                </button>
              )}
            </span>
          </div>
          {sudahAda && (
            <div className="mt-3">
              <Pesan>Tanggal ini sudah ada catatannya. Perubahan akan menimpa data lama.</Pesan>
            </div>
          )}
        </Kartu>

        <Kartu judul="Telur">
          <div className="grid grid-cols-3 gap-3">
            <Kolom label="Butir">
              <input className={inputCls} inputMode="numeric" value={form.telur_butir} onChange={ubah("telur_butir")} placeholder="0" />
            </Kolom>
            <Kolom label="Berat (kg)">
              <input className={inputCls} inputMode="decimal" value={form.telur_kg} onChange={ubah("telur_kg")} placeholder="0" />
            </Kolom>
            <Kolom label="Retak">
              <input className={inputCls} inputMode="numeric" value={form.telur_retak} onChange={ubah("telur_retak")} placeholder="0" />
            </Kolom>
          </div>
          {(butir > 0 || kg > 0) && (
            <p className="mt-2 text-xs text-stone-500">
              {populasi ? <>Produksi {persen(butir / populasi)} · </> : null}
              {butir > 0 && kg > 0 ? <>rata-rata {angka((kg * 1000) / butir, 1)} g/butir</> : null}
            </p>
          )}
        </Kartu>

        <Kartu judul="Pakan & ayam">
          <div className="grid grid-cols-3 gap-3">
            <Kolom label="Pakan (kg)">
              <input className={inputCls} inputMode="decimal" value={form.pakan_kg} onChange={ubah("pakan_kg")} placeholder="0" />
            </Kolom>
            <Kolom label="Mati">
              <input className={inputCls} inputMode="numeric" value={form.mati} onChange={ubah("mati")} placeholder="0" />
            </Kolom>
            <Kolom label="Afkir">
              <input className={inputCls} inputMode="numeric" value={form.afkir} onChange={ubah("afkir")} placeholder="0" />
            </Kolom>
          </div>
          <div className="mt-3">
            <Kolom label="Catatan (opsional)">
              <input className={inputCls} value={form.catatan} onChange={ubah("catatan")} placeholder="mis. vaksin ND, cuaca panas" />
            </Kolom>
          </div>
        </Kartu>

        {pesan && <Pesan nada={pesan.nada}>{pesan.teks}</Pesan>}

        <div className="flex gap-3">
          <Tombol type="submit" disabled={proses} className="flex-1 py-3 text-base">
            {proses ? "Menyimpan…" : "Simpan"}
          </Tombol>
          {sudahAda && (
            <Tombol type="button" varian="bahaya" onClick={hapus}>
              Hapus
            </Tombol>
          )}
        </div>
      </form>

      {riwayat.length > 0 && (
        <Kartu judul="7 catatan terakhir" className="mt-6">
          <div className="overflow-x-auto">
            <table className="angka w-full text-sm">
              <thead className="text-left text-xs text-stone-500">
                <tr>
                  <th className="pb-2 font-medium">Tgl</th>
                  <th className="pb-2 text-right font-medium">Butir</th>
                  <th className="pb-2 text-right font-medium">Kg</th>
                  <th className="pb-2 text-right font-medium">Pakan</th>
                  <th className="pb-2 text-right font-medium">Mati</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((c) => (
                  <tr
                    key={c.id}
                    className={`cursor-pointer border-t border-stone-100 ${c.tanggal === tanggal ? "bg-hijau-50" : ""}`}
                    onClick={() => setTanggal(c.tanggal)}
                  >
                    <td className="py-2">{tanggalPendek(c.tanggal)}</td>
                    <td className="py-2 text-right">{angka(c.telur_butir)}</td>
                    <td className="py-2 text-right">{angka(Number(c.telur_kg), 1)}</td>
                    <td className="py-2 text-right">{angka(Number(c.pakan_kg), 1)}</td>
                    <td className="py-2 text-right">{c.mati + c.afkir || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-stone-500">Ketuk baris untuk mengedit.</p>
        </Kartu>
      )}
    </>
  );
}
