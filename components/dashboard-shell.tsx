"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { LayoutGrid, LayoutDashboard, Settings, X } from "lucide-react"
import { ThemeToggle } from "./theme-provider"

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
  const [open, setOpen] = useState(false)
  const items = NAV.filter((n) => sections.includes(n.key))

  return (
    <div className="relative mx-auto flex w-full max-w-6xl gap-6">
      {/* Backdrop mobile */}
      {open && (
        <button
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={
          "z-40 flex shrink-0 flex-col transition-transform duration-300 ease-out " +
          "fixed inset-y-0 left-0 w-64 p-4 lg:static lg:h-auto lg:w-56 lg:translate-x-0 lg:p-0 " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex h-full flex-col rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-3 shadow-2xl backdrop-blur-xl lg:sticky lg:top-6">
          <div className="mb-3 flex items-center justify-between px-2 pt-1">
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
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-white/[0.05] text-foreground transition hover:border-[var(--gold)]/50 hover:bg-white/10 active:scale-95 lg:hidden"
          >
            <LayoutDashboard className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0 flex-1">{headerLeft}</div>
          <ThemeToggle className="lg:hidden" />
        </div>
        {children}
      </div>
    </div>
  )
}
