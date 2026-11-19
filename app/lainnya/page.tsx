"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Judul, Tombol } from "@/components/ui";

const MENU = [
  { href: "/kandang", judul: "Kandang & populasi", sub: "Tambah kandang/angkatan ayam, populasi awal, harga beli" },
  { href: "/pengaturan", judul: "Pengaturan", sub: "Target margin, penyusutan kandang, harga pasar" },
];

export default function HalamanLainnya() {
  return (
    <>
      <Judul>Lainnya</Judul>
      <ul className="space-y-3">
        {MENU.map((m) => (
          <li key={m.href}>
            <Link href={m.href} className="block rounded-2xl border border-stone-200 bg-white p-4 hover:border-hijau-600">
              <div className="font-semibold">{m.judul}</div>
              <div className="text-sm text-stone-500">{m.sub}</div>
            </Link>
          </li>
        ))}
      </ul>
      <Tombol varian="kedua" className="mt-8 w-full" onClick={() => supabase.auth.signOut()}>
        Keluar
      </Tombol>
    </>
  );
}
