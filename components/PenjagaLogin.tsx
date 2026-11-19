"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseSiap } from "@/lib/supabase";
import { Navigasi } from "./Navigasi";
import { Kolom, Memuat, Pesan, Tombol, inputCls } from "./ui";

export function PenjagaLogin({ children }: { children: ReactNode }) {
  const [sesi, setSesi] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabaseSiap) return;
    supabase.auth.getSession().then(({ data }) => setSesi(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesi(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!supabaseSiap) {
    return (
      <main className="mx-auto max-w-md p-6">
        <Pesan nada="peringatan">
          Aplikasi belum tersambung ke database. Isi <b>NEXT_PUBLIC_SUPABASE_URL</b> dan{" "}
          <b>NEXT_PUBLIC_SUPABASE_ANON_KEY</b> di pengaturan Environment Variables Vercel, lalu deploy ulang.
          Lihat PANDUAN.md.
        </Pesan>
      </main>
    );
  }

  if (sesi === undefined) return <Memuat />;
  if (!sesi) return <Masuk />;

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 pb-28 pt-5">{children}</main>
      <Navigasi />
    </>
  );
}

function Masuk() {
  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [proses, setProses] = useState(false);
  const [error, setError] = useState("");

  async function kirim(e: React.FormEvent) {
    e.preventDefault();
    setProses(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: sandi });
    if (error) setError("Email atau kata sandi salah.");
    setProses(false);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 h-14 w-11 rounded-[50%] bg-kuning-100 ring-4 ring-hijau-700" />
        <h1 className="text-xl font-semibold">Catatan Ayam Petelur</h1>
        <p className="text-sm text-stone-500">Masuk untuk melanjutkan</p>
      </div>
      <form onSubmit={kirim} className="space-y-3">
        <Kolom label="Email">
          <input className={inputCls} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Kolom>
        <Kolom label="Kata sandi">
          <input className={inputCls} type="password" autoComplete="current-password" value={sandi} onChange={(e) => setSandi(e.target.value)} required />
        </Kolom>
        {error && <Pesan nada="error">{error}</Pesan>}
        <Tombol type="submit" disabled={proses} className="w-full">
          {proses ? "Masuk…" : "Masuk"}
        </Tombol>
      </form>
    </main>
  );
}
