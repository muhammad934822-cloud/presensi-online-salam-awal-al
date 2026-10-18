"use client";

import { useEffect, useState } from "react";
import type { MaintenanceFeed } from "@/lib/queries";

const EVENT_LABEL: Record<string, string> = {
  studium_generale: "Studium Generale",
  mabit: "Mabit",
  konsumsi: "Konsumsi",
};

/** Baris cadangan bila database tidak terjangkau (tetap terlihat seperti sistem). */
const FALLBACK_ROWS: MaintenanceFeed["rows"] = [
  ["AHMAD ZAKI", "XII IPA 1", 7, "HADIR"],
  ["NUR FAUZIYAH", "XI IPS 2", 23, "HADIR"],
  ["MUHAMMAD RIZKY", "XII IPA 3", 11, "HADIR"],
  ["SALSABILA N.", "XI IPA 4", 34, "HADIR"],
  ["DIMAS PRATAMA", "XII IPS 1", 5, "HADIR"],
  ["AULIA RAHMAN", "X IPA 2", 19, "HADIR"],
  ["FITRI HANDAYANI", "XII IPA 5", 28, "HADIR"],
  ["RAFI AKRAM", "XI IPA 3", 2, "HADIR"],
].map(([nama, kelas, nomorPresensi, status]) => ({ nama, kelas, nomorPresensi, status })) as MaintenanceFeed["rows"];

type Row = MaintenanceFeed["rows"][number];

export default function MaintenanceLock({ feed }: { feed: MaintenanceFeed | null }) {
  const rows: Row[] = feed && feed.rows.length > 0 ? feed.rows : FALLBACK_ROWS;
  const stats = feed?.stats ?? [];
  const log = feed?.log ?? [];

  // "monitor" kecil berganti pelan — pakai data log aktivitas ASLI bila ada.
  const cycleLen = Math.max(log.length, 1);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % cycleLen), 2600);
    return () => clearInterval(id);
  }, [cycleLen]);

  const monitorText =
    log.length > 0
      ? `${log[tick % log.length].actor} · ${log[tick % log.length].action}`
      : `arsip terakhir: ${rows[tick % rows.length]?.nama ?? "-"} [HADIR]`;

  // Pembagian kolom marquee agar dua kolom sama panjang & loop mulus.
  const half = Math.ceil(rows.length / 2);
  const colA = rows.slice(0, half);
  const colB = rows.slice(half);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-gradient-to-br from-[#0b1020] via-[#141a33] to-[#0b1020] px-6 text-center">
      {/* ===== Latar: BERANDA SISTEM PRESENSI transparan, berjalan halus ===== */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex select-none gap-10 opacity-[0.07] md:gap-16"
      >
        {[colA, colB].map((colRows, col) => (
          <div key={col} className="ml-marquee-col w-64 shrink-0 md:w-72">
            {/* daftar digandakan agar loop translateY(-50%) mulus tanpa putus */}
            {[...colRows, ...colRows, ...colRows, ...colRows].map((r, i) => (
              <div
                key={`${col}-${i}`}
                className="mb-3 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left font-mono text-xs text-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r.nama}</span>
                  <span className="text-emerald-300">{r.status}</span>
                </div>
                <div className="mt-1 flex justify-between text-slate-400">
                  <span>{r.kelas}</span>
                  <span>No. {String(r.nomorPresensi).padStart(2, "0")}</span>
                </div>
              </div>
            ))}
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

          {/* Rekap akhir dari DATABASE ASLI — muncul bertahap */}
          {stats.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {stats.map((s, i) => (
                <div
                  key={s.event}
                  className="ml-rise-card rounded-xl border border-white/10 bg-white/5 px-2 py-2.5"
                  style={{ animationDelay: `${0.35 + i * 0.15}s` }}
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {EVENT_LABEL[s.event] ?? s.event}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-emerald-300">
                    {s.hadir}/{s.total}
                  </p>
                  <p className="text-[9px] text-slate-500">hadir</p>
                </div>
              ))}
            </div>
          )}

          {/* Monitor kecil — data log aktivitas ASLI */}
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-[11px] text-slate-400">
            <span className="ml-pulse inline-block h-2 w-2 rounded-full bg-emerald-400" />
            <span className="truncate">
              {log.length > 0 ? "rekam jejak: " : "arsip terakhir: "}
              <span className="text-slate-300">{monitorText}</span>
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
