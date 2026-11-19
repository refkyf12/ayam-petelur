import { supabase, wajib } from "./supabase";
import { PENGATURAN_AWAL, type Kandang, type Pengaturan } from "./hitung";

export async function ambilKandang(): Promise<Kandang[]> {
  const data = wajib(await supabase.from("kandang").select("*").order("tanggal_masuk"));
  return (data ?? []) as Kandang[];
}

export async function ambilPengaturan(): Promise<Pengaturan> {
  const data = wajib(await supabase.from("pengaturan").select("*").maybeSingle());
  return data ? { ...PENGATURAN_AWAL, ...(data as Pengaturan) } : PENGATURAN_AWAL;
}
