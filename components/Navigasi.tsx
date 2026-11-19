"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU = [
  { href: "/", label: "Ringkasan", ikon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/input", label: "Input", ikon: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" },
  { href: "/penjualan", label: "Jual", ikon: "M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" },
  { href: "/biaya", label: "Biaya", ikon: "M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14c1.1 0 2 .9 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" },
  { href: "/lainnya", label: "Lainnya", ikon: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" },
];

export function Navigasi() {
  const path = usePathname();
  const aktif = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href) || (href === "/lainnya" && (path.startsWith("/kandang") || path.startsWith("/pengaturan")));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {MENU.map((m) => (
          <li key={m.href}>
            <Link
              href={m.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                aktif(m.href) ? "text-hijau-700" : "text-stone-500"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
                <path d={m.ikon} />
              </svg>
              {m.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
