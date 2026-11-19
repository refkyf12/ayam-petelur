const pad = (n: number) => String(n).padStart(2, "0");

export function rupiah(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "–";
  const bulat = Math.round(n);
  return (bulat < 0 ? "-Rp" : "Rp") + Math.abs(bulat).toLocaleString("id-ID");
}

export function angka(n: number | null | undefined, desimal = 0): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return n.toLocaleString("id-ID", { maximumFractionDigits: desimal });
}

export function persen(n: number | null | undefined, desimal = 1): string {
  if (n == null || !Number.isFinite(n)) return "–";
  return (n * 100).toLocaleString("id-ID", { maximumFractionDigits: desimal }) + "%";
}

/** Untuk kolom rupiah/ekor/butir: ambil digit saja ("Rp 25.000" → 25000). */
export function bacaBulat(s: string): number {
  const digit = s.replace(/[^\d]/g, "");
  return digit ? Number(digit) : 0;
}

/** Untuk kolom kg: terima koma atau titik sebagai desimal ("12,5" → 12.5). */
export function bacaDesimal(s: string): number {
  const t = s.trim().replace(",", ".").replace(/[^\d.]/g, "");
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

export function teksAngka(n: number | null | undefined): string {
  if (n == null || n === 0) return "";
  return String(n).replace(".", ",");
}

// ---- Tanggal (format "YYYY-MM-DD", waktu lokal) ----

export function hariIni(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const bulanIni = () => hariIni().slice(0, 7);

export function rentangBulan(ym: string): { awal: string; akhir: string; jumlahHari: number } {
  const [y, m] = ym.split("-").map(Number);
  const jumlahHari = new Date(y, m, 0).getDate();
  return { awal: `${ym}-01`, akhir: `${ym}-${pad(jumlahHari)}`, jumlahHari };
}

const keUTC = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

export function selisihHari(dari: string, sampai: string): number {
  return Math.round((keUTC(sampai) - keUTC(dari)) / 86_400_000);
}

export function tambahHari(s: string, n: number): string {
  const d = new Date(keUTC(s) + n * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function tanggalPendek(s: string): string {
  return new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function tanggalPanjang(s: string): string {
  return new Date(s + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function namaBulan(ym: string): string {
  return new Date(ym + "-01T00:00:00").toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
