"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { LayoutGrid, LayoutDashboard, Settings, X, Clock } from "lucide-react"
import { ThemeToggle } from "./theme-provider"
import { BrandHeader } from "./brand-header"

/**
 * Jam digital real-time. Sengaja hanya dirender di client (null saat SSR)
 * supaya tidak pernah terjadi hydration mismatch.
 */
export function LiveClock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  if (!now) return <span className={"inline-block h-5 w-24 rounded-lg bg-white/10 " + className} aria-hidden="true" />

  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
  const date = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })
  // Label zona waktu mengikuti timezone browser pengunjung (bukan hardcode WIB),
  // jadi tetap akurat untuk panitia/peserta di mana pun.
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "WIB"
  const tzShort = tz.includes("Makassar") || tz.includes("Balikpapan") ? "WITA" : tz.includes("Jayapura") ? "WIT" : tz.includes("Jakarta") ? "WIB" : tz.split("/").pop() || tz

  return (
    <span className={"inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white/[0.06] px-3 py-1.5 backdrop-blur-sm " + className}>
      <Clock className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" aria-hidden="true" />
      <span className="whitespace-nowrap text-xs font-semibold tabular-nums tracking-tight text-foreground">{time}</span>
      <span className="hidden whitespace-nowrap text-[11px] text-muted-foreground sm:inline">{tzShort} · {date}</span>
    </span>
  )
}

export type DashSection = "beranda" | "presensi" | "peserta" | "pengaturan"

const NAV: { key: DashSection; label: string; icon: typeof LayoutGrid; desc: string }[] = [
  { key: "beranda", label: "Beranda", icon: LayoutGrid, desc: "Ringkasan & pilihan kegiatan" },
  { key: "presensi", label: "Presensi", icon: LayoutDashboard, desc: "QR / scan kehadiran" },
  { key: "peserta", label: "Daftar Peserta", icon: LayoutDashboard, desc: "Akun & data peserta" },
  { key: "pengaturan", label: "Pengaturan", icon: Settings, desc: "Tema, nama, lainnya" },
]

/**
 * Kerangka dashboard dengan sidebar kiri (di layar besar) yang dapat
 * dibuka/tutup lewat tombol menu (di mobile). Animasi slide + fade halus.
 */
export function DashboardShell({
  sections,
  active,
  onNavigate,
  headerLeft,
  children,
}: {
  /** daftar section yang tersedia untuk peran ini */
  sections: DashSection[]
  active: DashSection
  onNavigate: (s: DashSection) => void
  headerLeft?: ReactNode
  children: ReactNode
}) {
  // Dashboard TERTUTUP default di semua ukuran layar — dibuka lewat tombol menu.
  const [open, setOpen] = useState(false)
  const items = NAV.filter((n) => sections.includes(n.key))

  return (
    <div className="relative mx-auto flex w-full max-w-6xl gap-6">
      {/* Backdrop (semua ukuran) — klik untuk menutup */}
      {open && (
        <button
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
        />
      )}

      {/* Sidebar drawer: tertutup default, meluncur dari kiri saat dibuka */}
      <aside
        className={
          "z-40 fixed inset-y-0 left-0 flex w-64 shrink-0 flex-col p-4 transition-transform duration-300 ease-out " +
          (open ? "translate-x-0" : "-translate-x-full pointer-events-none")
        }
      >
        <div className="flex h-full max-h-full flex-col overflow-y-auto rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-3 shadow-2xl backdrop-blur-xl">
          {/* Brand kecil di atas sidebar (menggantikan header besar yang sebelumnya bertumpuk/tabrakan) */}
          <div className="mb-4 px-1 pt-1">
            <BrandHeader compact />
          </div>
          <div className="mb-3 flex items-center justify-between border-t border-[var(--line)] px-2 pt-3">
            <span className="font-serif text-sm font-semibold tracking-wide text-foreground/80">Menu</span>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-foreground/60 transition hover:bg-white/10 lg:hidden"
              aria-label="Tutup menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="grid gap-1.5">
            {items.map((n) => {
              const isActive = active === n.key
              return (
                <button
                  key={n.key}
                  onClick={() => {
                    onNavigate(n.key)
                    setOpen(false)
                  }}
                  className={
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-300 " +
                    (isActive
                      ? "bg-[linear-gradient(100deg,var(--gold)_0%,var(--purple)_60%,var(--blue)_100%)] text-white shadow-lg shadow-[var(--purple)]/30"
                      : "text-foreground/75 hover:translate-x-1 hover:bg-white/[0.07] hover:text-foreground")
                  }
                >
                  <n.icon className={"h-4.5 w-4.5 shrink-0 transition-transform duration-300 " + (isActive ? "" : "group-hover:scale-110")} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{n.label}</span>
                    <span className={"block truncate text-[11px] " + (isActive ? "text-white/80" : "text-muted-foreground")}>
                      {n.desc}
                    </span>
                  </span>
                </button>
              )
            })}
          </nav>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--line)] px-2 pb-1 pt-3">
            <span className="text-[11px] text-muted-foreground">Tema</span>
            <ThemeToggle className="h-9 w-9" />
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="group inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[var(--line)] bg-white/[0.05] px-3 text-sm font-semibold text-foreground transition hover:border-[var(--gold)]/50 hover:bg-white/10 active:scale-95"
          >
            <LayoutDashboard className="h-4.5 w-4.5 text-[var(--gold)] transition-transform duration-300 group-hover:-rotate-6" />
            Menu
          </button>
          <div className="min-w-0 flex-1">{headerLeft}</div>
          <LiveClock className="hidden shrink-0 sm:inline-flex" />
          <ThemeToggle className="lg:hidden" />
        </div>
        {children}
      </div>
    </div>
  )
}
