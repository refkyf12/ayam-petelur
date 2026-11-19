import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseSiap = Boolean(url && key);

export const supabase = createClient(url || "http://localhost", key || "belum-diisi");

type Hasil<T> = { data: T[] | null; error: { message: string } | null };

/** Ambil semua baris (Supabase membatasi 1000 baris per permintaan). */
export async function ambilSemua<T>(
  query: (dari: number, sampai: number) => PromiseLike<Hasil<T>>,
): Promise<T[]> {
  const ukuran = 1000;
  const hasil: T[] = [];
  for (let dari = 0; ; dari += ukuran) {
    const { data, error } = await query(dari, dari + ukuran - 1);
    if (error) throw new Error(error.message);
    hasil.push(...(data ?? []));
    if (!data || data.length < ukuran) break;
  }
  return hasil;
}

/** Lempar error kalau query gagal, kembalikan data kalau berhasil. */
export function wajib<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
