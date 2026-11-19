"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ambilPengaturan } from "@/lib/data";
import { bacaBulat, bacaDesimal } from "@/lib/format";
import { Judul, Kartu, Kolom, Memuat, Pesan, Tombol, inputCls } from "@/components/ui";

export default function HalamanPengaturan() {
  const [siap, setSiap] = useState(false);
  const [margin, setMargin] = useState("");
  const [penyusutan, setPenyusutan] = useState("");
  const [pasar, setPasar] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<{ nada: "sukses" | "error"; teks: string } | null>(null);

  useEffect(() => {
    ambilPengaturan()
      .then((p) => {
        setMargin(String(p.margin_persen).replace(".", ","));
        setPenyusutan(p.penyusutan_bulanan ? Number(p.penyusutan_bulanan).toLocaleString("id-ID") : "");
        setPasar(p.harga_pasar_kg ? Number(p.harga_pasar_kg).toLocaleString("id-ID") : "");
        setSiap(true);
      })
      .catch((e) => setPesan({ nada: "error", teks: e.message }));
  }, []);

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setPesan(null);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("pengaturan").upsert({
      user_id: u.user?.id,
      margin_persen: bacaDesimal(margin),
      penyusutan_bulanan: bacaBulat(penyusutan),
      harga_pasar_kg: pasar ? bacaBulat(pasar) : null,
      updated_at: new Date().toISOString(),
    });
    setProses(false);
    setPesan(error ? { nada: "error", teks: "Gagal menyimpan: " + error.message } : { nada: "sukses", teks: "Pengaturan tersimpan." });
  }

  return (
    <>
      <Judul>
        <Link href="/lainnya" className="mr-2 text-stone-400">
          ←
        </Link>
        Pengaturan
      </Judul>
      {!siap && !pesan ? (
        <Memuat />
      ) : (
        <form onSubmit={simpan}>
          <Kartu>
            <div className="space-y-4">
              <Kolom label="Target margin keuntungan (%)" petunjuk="Saran harga jual = HPP + margin ini.">
                <input className={inputCls} inputMode="decimal" value={margin} onChange={(e) => setMargin(e.target.value)} />
              </Kolom>
              <Kolom
                label="Penyusutan kandang & peralatan (Rp per bulan)"
                petunjuk="Contoh: kandang + tempat pakan/minum Rp60 juta, umur pakai 5 tahun → 60.000.000 ÷ 60 = Rp1.000.000 per bulan."
              >
                <input className={inputCls} inputMode="numeric" value={penyusutan} onChange={(e) => setPenyusutan(e.target.value)} placeholder="0" />
              </Kolom>
              <Kolom label="Harga telur pasaran (Rp per kg)" petunjuk="Update sesekali sebagai pembanding di Ringkasan.">
                <input className={inputCls} inputMode="numeric" value={pasar} onChange={(e) => setPasar(e.target.value)} placeholder="opsional" />
              </Kolom>
            </div>
            {pesan && (
              <div className="mt-4">
                <Pesan nada={pesan.nada}>{pesan.teks}</Pesan>
              </div>
            )}
            <Tombol type="submit" disabled={proses} className="mt-4 w-full">
              {proses ? "Menyimpan…" : "Simpan"}
            </Tombol>
          </Kartu>
        </form>
      )}
    </>
  );
}
