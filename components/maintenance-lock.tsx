"use client";

import { useEffect, useState } from "react";

/** Cuplikan baris presensi palsu untuk latar "sistem presensi transparan". */
const FAKE_ROWS: [string, string, string, string][] = [
  ["AHMAD ZAKI", "XII IPA 1", "07", "HADIR"],
  ["NUR FAUZIYAH", "XI IPS 2", "23", "HADIR"],
  ["MUHAMMAD RIZKY", "XII IPA 3", "11", "VERIF..."],
  ["SALSABILA N.", "XI IPA 4", "34", "HADIR"],
  ["DIMAS PRATAMA", "XII IPS 1", "05", "TUNDA"],
  ["AULIA RAHMAN", "X IPA 2", "19", "HADIR"],
  ["FITRI HANDAYANI", "XII IPA 5", "28", "SCAN QR"],
  ["RAFI AKRAM", "XI IPA 3", "02", "HADIR"],
];

const STATUS_CYCLE = ["HADIR", "SCAN QR", "VERIF...", "SESUAI"];

export default function MaintenanceLock() {
  const [tick, setTick] = useState(0);

  // "monitor" kecil yang berganti pelan supaya halaman terasa hidup.
  useEffect(() => {
    const id = setInterval(
      () => setTick((t) => (t + 1) % FAKE_ROWS.length),
      2600,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#141a33] to-[#0b1020] px-6 text-center">
      {/* ===== Latar: sistem presensi transparan, dua kolom berjalan halus ===== */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex select-none gap-10 opacity-[0.07] md:gap-16"
      >
        {[0, 1].map((col) => (
          <div key={col} className="ml-marquee-col w-64 shrink-0 md:w-72">
            {/* daftar digandakan 2x agar loop translateY(-50%) mulus tanpa putus */}
            {[...FAKE_ROWS, ...FAKE_ROWS, ...FAKE_ROWS, ...FAKE_ROWS].map(
              (r, i) => (
                <div
                  key={`${col}-${i}`}
                  className="mb-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left font-mono text-xs text-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r[0]}</span>
                    <span className="text-emerald-300">{r[3]}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-slate-400">
                    <span>{r[1]}</span>
                    <span>No. {r[2]}</span>
                  </div>
                </div>
              ),
            )}
          </div>
        ))}
      </div>

      {/* Blob dinamis lembut di belakang kartu */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="ml-float absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="ml-float-rev absolute right-[-6rem] bottom-16 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="ml-breathe absolute left-1/2 top-1/2 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      {/* ===== Kartu utama ===== */}
      <div className="relative flex min-h-dvh items-center justify-center">
        <div className="ml-rise w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="ml-float mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/15 ring-1 ring-amber-300/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 text-amber-300"
            >
              <rect x="3" y="11" width="18" height="10" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h1 className="ml-shimmer bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-[length:200%_auto] bg-clip-text font-serif text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
            Server Ditutup Sementara
          </h1>
          <p className="mt-2 text-sm font-medium text-amber-300/90">
            Salam Awal Al Uswah 1448 H
          </p>

          <p className="mt-5 text-sm leading-relaxed text-slate-300/90">
            Terima kasih telah berpartisipasi! Seluruh rangkaian kegiatan Mabit
            Salam Awal Al Uswah 1448 H telah selesai dan sistem presensi resmi
            ditutup. Data kehadiran tersimpan aman.
          </p>

          {/* Monitor kecil — hidup tapi tenang */}
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-[11px] text-slate-400">
            <span className="ml-pulse inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span>
              arsip terakhir:{" "}
              <span className="text-slate-300">{FAKE_ROWS[tick][0]}</span>{" "}
              <span className="text-emerald-300/80">
                [{STATUS_CYCLE[tick % STATUS_CYCLE.length]}]
              </span>
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-sm font-semibold text-white">
              Sampai jumpa di SAA 1449 H 🕌
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Untuk keperluan rekap &amp; dokumentasi, hubungi panitia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
