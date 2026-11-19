"use client";

import type { ReactNode } from "react";

const dasarInput =
  "rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-hijau-600 focus:ring-2 focus:ring-hijau-100 disabled:bg-stone-100";

export const inputCls = `w-full ${dasarInput}`;

/** Pilihan bulan di pojok kanan judul: lebarnya secukupnya. */
export const inputBulanCls = `w-40 shrink-0 ${dasarInput} py-1.5 text-sm`;

export function Judul({ children, kanan }: { children: ReactNode; kanan?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold text-stone-900">{children}</h1>
      {kanan}
    </div>
  );
}

export function Kartu({
  judul,
  children,
  className = "",
}: {
  judul?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-stone-200 bg-white p-4 ${className}`}>
      {judul && <h2 className="mb-3 text-sm font-semibold text-stone-600">{judul}</h2>}
      {children}
    </section>
  );
}

export function Kolom({
  label,
  petunjuk,
  children,
}: {
  label: string;
  petunjuk?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {petunjuk && <span className="mt-1 block text-xs text-stone-500">{petunjuk}</span>}
    </label>
  );
}

export function Tombol({
  children,
  varian = "utama",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { varian?: "utama" | "kedua" | "bahaya" }) {
  const gaya = {
    utama: "bg-hijau-700 text-white hover:bg-hijau-800 disabled:bg-stone-400",
    kedua: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
    bahaya: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  }[varian];
  return (
    <button
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${gaya} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Statistik({
  label,
  nilai,
  sub,
  nada,
}: {
  label: string;
  nilai: ReactNode;
  sub?: ReactNode;
  nada?: "baik" | "buruk";
}) {
  const warna = nada === "baik" ? "text-hijau-700" : nada === "buruk" ? "text-red-700" : "text-stone-900";
  return (
    <div className="min-w-0">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={`angka truncate text-lg font-semibold ${warna}`}>{nilai}</div>
      {sub && <div className="text-xs text-stone-500">{sub}</div>}
    </div>
  );
}

export function Pesan({ nada = "info", children }: { nada?: "info" | "peringatan" | "error" | "sukses"; children: ReactNode }) {
  const gaya = {
    info: "border-stone-200 bg-stone-50 text-stone-700",
    peringatan: "border-kuning-500/40 bg-kuning-50 text-stone-800",
    error: "border-red-200 bg-red-50 text-red-800",
    sukses: "border-hijau-100 bg-hijau-50 text-hijau-800",
  }[nada];
  return <div className={`rounded-xl border px-3 py-2 text-sm ${gaya}`}>{children}</div>;
}

export function Memuat() {
  return <div className="py-10 text-center text-sm text-stone-500">Memuat…</div>;
}
