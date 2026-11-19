"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ambilSemua, supabase } from "@/lib/supabase";
import { ambilKandang } from "@/lib/data";
import { angka, bacaBulat, hariIni, rupiah, tanggalPanjang } from "@/lib/format";
import { ayamAktif, umurMinggu, type Kandang, type Pengurangan } from "@/lib/hitung";
import { Judul, Kartu, Kolom, Memuat, Pesan, Tombol, inputCls } from "@/components/ui";

type Form = {
  nama: string;
  tanggal_masuk: string;
  umur_masuk_minggu: string;
  populasi_awal: string;
  harga_per_ekor: string;
  estimasi_harga_afkir: string;
  umur_afkir_minggu: string;
  tanggal_selesai: string;
};

const BARU: Form = {
  nama: "",
  tanggal_masuk: hariIni(),
  umur_masuk_minggu: "18",
  populasi_awal: "",
  harga_per_ekor: "",
  estimasi_harga_afkir: "",
  umur_afkir_minggu: "90",
  tanggal_selesai: "",
};

const keForm = (k: Kandang): Form => ({
  nama: k.nama,
  tanggal_masuk: k.tanggal_masuk,
  umur_masuk_minggu: String(k.umur_masuk_minggu),
  populasi_awal: String(k.populasi_awal),
  harga_per_ekor: Number(k.harga_per_ekor).toLocaleString("id-ID"),
  estimasi_harga_afkir: Number(k.estimasi_harga_afkir).toLocaleString("id-ID"),
  umur_afkir_minggu: String(k.umur_afkir_minggu),
  tanggal_selesai: k.tanggal_selesai ?? "",
});

export default function HalamanKandang() {
  const [kandang, setKandang] = useState<Kandang[] | null>(null);
  const [pengurangan, setPengurangan] = useState<Pengurangan[]>([]);
  const [edit, setEdit] = useState<{ id: string | null; form: Form } | null>(null);
  const [error, setError] = useState("");

  const muat = useCallback(async () => {
    try {
      const [ks, p] = await Promise.all([
        ambilKandang(),
        ambilSemua<Pengurangan>((a, b) =>
          supabase.from("catatan_harian").select("kandang_id,tanggal,mati,afkir").or("mati.gt.0,afkir.gt.0").order("tanggal").range(a, b),
        ),
      ]);
      setKandang(ks);
      setPengurangan(p);
      if (ks.length === 0) setEdit({ id: null, form: BARU });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    muat();
  }, [muat]);

  if (!kandang) return <Memuat />;
  const hari = hariIni();

  return (
    <>
      <Judul
        kanan={
          !edit && (
            <Tombol className="py-2" onClick={() => setEdit({ id: null, form: { ...BARU, nama: `Kandang ${kandang.length + 1}` } })}>
              + Tambah
            </Tombol>
          )
        }
      >
        <Link href="/lainnya" className="mr-2 text-stone-400">
          ←
        </Link>
        Kandang
      </Judul>
      {error && <Pesan nada="error">{error}</Pesan>}

      {edit && (
        <FormKandang
          id={edit.id}
          awal={edit.form}
          pertama={kandang.length === 0}
          onBatal={() => setEdit(null)}
          onTersimpan={() => {
            setEdit(null);
            muat();
          }}
        />
      )}

      <ul className="mt-4 space-y-3">
        {kandang.map((k) => {
          const selesai = Boolean(k.tanggal_selesai && k.tanggal_selesai < hari);
          const hidup = ayamAktif(k, hari, pengurangan, true);
          const hilang = k.populasi_awal - hidup;
          return (
            <li key={k.id}>
              <Kartu className={selesai ? "opacity-60" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {k.nama} {selesai && <span className="text-xs font-normal text-stone-500">(selesai)</span>}
                    </div>
                    <div className="text-xs text-stone-500">Masuk {tanggalPanjang(k.tanggal_masuk)}</div>
                  </div>
                  <Tombol varian="kedua" className="px-3 py-1.5 text-xs" onClick={() => setEdit({ id: k.id, form: keForm(k) })}>
                    Ubah
                  </Tombol>
                </div>
                <div className="angka mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-stone-500">Ayam aktif</div>
                    <div className="font-semibold">{angka(selesai ? 0 : hidup)}</div>
                    <div className="text-xs text-stone-500">dari {angka(k.populasi_awal)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">Umur</div>
                    <div className="font-semibold">{umurMinggu(k, hari)} minggu</div>
                    <div className="text-xs text-stone-500">afkir di {k.umur_afkir_minggu} mgg</div>
                  </div>
                  <div>
                    <div className="text-xs text-stone-500">Deplesi</div>
                    <div className="font-semibold">{k.populasi_awal ? ((hilang / k.populasi_awal) * 100).toFixed(1) : 0}%</div>
                    <div className="text-xs text-stone-500">{angka(hilang)} ekor</div>
                  </div>
                </div>
              </Kartu>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function FormKandang({
  id,
  awal,
  pertama,
  onBatal,
  onTersimpan,
}: {
  id: string | null;
  awal: Form;
  pertama: boolean;
  onBatal: () => void;
  onTersimpan: () => void;
}) {
  const [f, setF] = useState<Form>(awal);
  const [proses, setProses] = useState(false);
  const [error, setError] = useState("");
  const ubah = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const populasi = bacaBulat(f.populasi_awal);
  const harga = bacaBulat(f.harga_per_ekor);
  const afkir = bacaBulat(f.estimasi_harga_afkir);
  const mingguProduksi = bacaBulat(f.umur_afkir_minggu) - bacaBulat(f.umur_masuk_minggu);
  const susutPerBulan = mingguProduksi > 0 ? (Math.max(0, harga - afkir) * populasi) / ((mingguProduksi * 7) / 30.4) : 0;

  async function simpan(e: React.FormEvent) {
    e.preventDefault();
    if (populasi <= 0) return setError("Isi jumlah populasi awal.");
    if (mingguProduksi <= 0) return setError("Umur afkir harus lebih besar dari umur masuk.");
    setProses(true);
    setError("");
    const data = {
      nama: f.nama.trim() || "Kandang",
      tanggal_masuk: f.tanggal_masuk,
      umur_masuk_minggu: bacaBulat(f.umur_masuk_minggu),
      populasi_awal: populasi,
      harga_per_ekor: harga,
      estimasi_harga_afkir: afkir,
      umur_afkir_minggu: bacaBulat(f.umur_afkir_minggu),
      tanggal_selesai: f.tanggal_selesai || null,
    };
    const { error } = id ? await supabase.from("kandang").update(data).eq("id", id) : await supabase.from("kandang").insert(data);
    setProses(false);
    if (error) return setError("Gagal menyimpan: " + error.message);
    onTersimpan();
  }

  async function hapus() {
    if (!id) return;
    if (!confirm("Hapus kandang ini BESERTA semua catatan hariannya? Tidak bisa dibatalkan.")) return;
    const { error } = await supabase.from("kandang").delete().eq("id", id);
    if (error) setError(error.message);
    else onTersimpan();
  }

  return (
    <form onSubmit={simpan}>
      <Kartu judul={id ? "Ubah kandang" : "Kandang baru"}>
        {pertama && (
          <div className="mb-3">
            <Pesan>Isi data angkatan ayam kamu. Populasi cukup diisi sekali di sini; selanjutnya berkurang otomatis dari catatan mati/afkir harian.</Pesan>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Kolom label="Nama kandang / angkatan">
              <input className={inputCls} value={f.nama} onChange={ubah("nama")} placeholder="mis. Kandang A" required />
            </Kolom>
          </div>
          <Kolom label="Tanggal masuk">
            <input type="date" className={inputCls} value={f.tanggal_masuk} onChange={ubah("tanggal_masuk")} required />
          </Kolom>
          <Kolom label="Umur saat masuk (minggu)">
            <input className={inputCls} inputMode="numeric" value={f.umur_masuk_minggu} onChange={ubah("umur_masuk_minggu")} />
          </Kolom>
          <Kolom label="Populasi awal (ekor)">
            <input className={inputCls} inputMode="numeric" value={f.populasi_awal} onChange={ubah("populasi_awal")} placeholder="0" required />
          </Kolom>
          <Kolom label="Harga beli per ekor">
            <input className={inputCls} inputMode="numeric" value={f.harga_per_ekor} onChange={ubah("harga_per_ekor")} placeholder="Rp" />
          </Kolom>
          <Kolom label="Rencana afkir umur (minggu)">
            <input className={inputCls} inputMode="numeric" value={f.umur_afkir_minggu} onChange={ubah("umur_afkir_minggu")} />
          </Kolom>
          <Kolom label="Perkiraan harga afkir/ekor">
            <input className={inputCls} inputMode="numeric" value={f.estimasi_harga_afkir} onChange={ubah("estimasi_harga_afkir")} placeholder="Rp" />
          </Kolom>
          {id && (
            <div className="col-span-2">
              <Kolom label="Tanggal selesai (opsional)" petunjuk="Isi kalau semua ayam di angkatan ini sudah diafkir/habis.">
                <input type="date" className={inputCls} value={f.tanggal_selesai} onChange={ubah("tanggal_selesai")} />
              </Kolom>
            </div>
          )}
        </div>

        {susutPerBulan > 0 && (
          <p className="mt-3 text-xs text-stone-500">
            Penyusutan ayam ≈ <b className="text-stone-800">{rupiah(susutPerBulan)}/bulan</b> selama {mingguProduksi} minggu, masuk ke HPP.
          </p>
        )}
        {error && (
          <div className="mt-3">
            <Pesan nada="error">{error}</Pesan>
          </div>
        )}
        <div className="mt-4 flex gap-3">
          <Tombol type="submit" disabled={proses} className="flex-1">
            {proses ? "Menyimpan…" : "Simpan"}
          </Tombol>
          {!pertama && (
            <Tombol type="button" varian="kedua" onClick={onBatal}>
              Batal
            </Tombol>
          )}
          {id && (
            <Tombol type="button" varian="bahaya" onClick={hapus}>
              Hapus
            </Tombol>
          )}
        </div>
      </Kartu>
    </form>
  );
}
