"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Moon, UtensilsCrossed, ChevronRight, CheckCircle2, ScanFace, Settings, Home } from "lucide-react"
import { GlassCard } from "./ui-kit"
import { BrandHeader } from "./brand-header"
import { QrPanel } from "./qr-panel"
import { DashboardShell, type DashSection } from "./dashboard-shell"
import { SettingsPanel } from "./settings-panel"
import { EVENTS, EVENT_LABELS, type EventKey } from "@/lib/db/schema"

type Codes = Record<string, { code: string; verifiedAt: Date | string | null }>

const ICONS: Record<EventKey, typeof GraduationCap> = {
  studium_generale: GraduationCap,
  mabit: Moon,
  konsumsi: UtensilsCrossed,
}

const ACCENTS: Record<EventKey, { iconBg: string; hoverBorder: string; glow: string }> = {
  studium_generale: {
    iconBg: "bg-[linear-gradient(135deg,var(--gold),#e8c87a)] text-[oklch(0.2_0.03_255)] shadow-[var(--gold)]/30",
    hoverBorder: "hover:border-[var(--gold)]/60",
    glow: "bg-[radial-gradient(circle,var(--gold)_0%,transparent_70%)]",
  },
  mabit: {
    iconBg: "bg-[linear-gradient(135deg,var(--purple),#8b6fd6)] text-white shadow-[var(--purple)]/30",
    hoverBorder: "hover:border-[var(--purple)]/60",
    glow: "bg-[radial-gradient(circle,var(--purple)_0%,transparent_70%)]",
  },
  konsumsi: {
    iconBg: "bg-[linear-gradient(135deg,var(--blue),#8fb8ef)] text-[oklch(0.2_0.03_255)] shadow-[var(--blue)]/30",
    hoverBorder: "hover:border-[var(--blue)]/60",
    glow: "bg-[radial-gradient(circle,var(--blue)_0%,transparent_70%)]",
  },
}

export function ParticipantHome({
  nama,
  kelas,
  nomorPresensi,
  codes,
  onExit,
}: {
  nama: string
  kelas: string
  nomorPresensi: number
  codes: Codes
  onExit?: () => void
}) {
  const [section, setSection] = useState<DashSection>("beranda")
  const [selected, setSelected] = useState<EventKey | null>(null)
  const router = useRouter()

  const verifiedCount = EVENTS.filter((ev) => Boolean(codes[ev]?.verifiedAt)).length
  const initials = nama
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  function goPresensi(ev: EventKey) {
    setSelected(ev)
    setSection("presensi")
  }

  /* ---------- Konten per section ---------- */

  const beranda = (
    <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      {/* Hero profil */}
      <GlassCard glow className="animate-rise-1 mb-5 overflow-hidden">
        <div className="relative flex items-center gap-4">
          <span className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[radial-gradient(circle,var(--gold)_0%,transparent_65%)] opacity-15" />
          <div className="relative shrink-0">
            <span className="conic-ring absolute -inset-1 rounded-2xl opacity-70 blur-[2px]" aria-hidden="true" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-[oklch(0.24_0.03_255)] font-serif text-xl font-bold text-[var(--gold)]">
              {initials || "?"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Selamat datang kembali 👋</p>
            <p className="truncate text-lg font-semibold text-foreground">{nama}</p>
            <p className="text-sm text-muted-foreground">
              {kelas} &middot; No. {nomorPresensi}
            </p>
          </div>
        </div>

        {/* Progress kehadiran */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-end justify-between">
            <span className="text-sm font-medium text-foreground/90">Progres Kehadiran</span>
            <span className="font-serif text-2xl font-bold tabular-nums text-[var(--gold)]">
              {verifiedCount}
              <span className="text-sm text-muted-foreground">/{EVENTS.length}</span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="gradient-slide h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.max(4, (verifiedCount / EVENTS.length) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex gap-1.5">
            {EVENTS.map((ev) => (
              <span
                key={ev}
                className={
                  "flex-1 rounded-lg px-2 py-1 text-center text-[10px] font-semibold transition-all duration-500 " +
                  (codes[ev]?.verifiedAt
                    ? "bg-emerald-400/20 text-emerald-300"
                    : "bg-white/[0.06] text-muted-foreground")
                }
              >
                {codes[ev]?.verifiedAt ? "✓ " : "○ "}
                {EVENT_LABELS[ev]}
              </span>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Kartu kegiatan */}
      <p className="mb-3 px-1 font-serif text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Kegiatan Salam Awal
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {EVENTS.map((ev, i) => {
          const Icon = ICONS[ev]
          const accent = ACCENTS[ev]
          const verified = Boolean(codes[ev]?.verifiedAt)
          return (
            <button
              key={ev}
              onClick={() => goPresensi(ev)}
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              className={`lift sheen-host animate-rise group relative flex flex-col items-start gap-3 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4 text-left backdrop-blur-xl ${accent.hoverBorder}`}
            >
              <span className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-15 transition-opacity duration-300 group-hover:opacity-35 ${accent.glow}`} />
              <span className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 ${accent.iconBg}`}>
                <Icon className="h-6 w-6" />
              </span>
              <span className="relative">
                <span className="block font-semibold text-foreground">{EVENT_LABELS[ev]}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {verified ? "Tervalidasi" : "Tampilkan QR"}
                </span>
              </span>
              {verified ? (
                <span className="relative inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Hadir
                </span>
              ) : (
                <span className="relative inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold)] transition-all group-hover:gap-2">
                  Buka QR <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
        💡 Tips: Buka menu <b>Presensi</b> di sidebar saat panitia memanggil, lalu tunjukkan QR-mu.
        Jangan bagikan kode unikmu kepada orang lain. Butuh bantuan? Pakai tombol{" "}
        <Settings className="inline h-3 w-3" /> Pengaturan untuk ganti nama atau password.
      </p>
    </div>
  )

  const presensi = (
    <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      {!selected ? (
        <div className="grid gap-3">
          <p className="mb-1 flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <ScanFace className="h-4 w-4 text-[var(--gold)]" /> Pilih kegiatan untuk menampilkan QR presensi:
          </p>
          {EVENTS.map((ev, i) => {
            const Icon = ICONS[ev]
            const verified = Boolean(codes[ev]?.verifiedAt)
            return (
              <button
                key={ev}
                onClick={() => setSelected(ev)}
                style={{ animationDelay: `${i * 0.08}s` }}
                className="lift animate-rise group flex items-center gap-4 rounded-3xl border border-white/12 bg-white/[0.05] p-4 text-left backdrop-blur-xl transition hover:border-[var(--gold)]/50 hover:bg-white/[0.09]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] text-white transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">{EVENT_LABELS[ev]}</span>
                  <span className="text-sm text-muted-foreground">
                    {verified ? "Presensi sudah tervalidasi ✓" : "Tampilkan QR / kode unik ke panitia"}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-foreground/50 transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="animate-pop">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setSelected(null)
                router.refresh()
              }}
              className="inline-flex items-center gap-1.5 text-sm text-foreground/70 transition hover:-translate-x-0.5 hover:text-foreground"
            >
              <Home className="h-4 w-4" /> Ganti kegiatan
            </button>
            <span className="rounded-full border border-[var(--line)] bg-white/[0.05] px-3 py-1 text-xs font-semibold text-[var(--gold)]">
              {EVENT_LABELS[selected]}
            </span>
          </div>
          <GlassCard glow>
            <QrPanel
              event={selected}
              label={EVENT_LABELS[selected]}
              code={codes[selected]?.code ?? ""}
              verifiedAt={codes[selected]?.verifiedAt ?? null}
            />
          </GlassCard>
        </div>
      )}
    </div>
  )

  const pengaturan = (
    <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-2xl">
      <SettingsPanel role="peserta" nama={nama} />
    </div>
  )

  return (
    <div className="w-full">
      <BrandHeader compact />
      <div className="mt-6">
        <DashboardShell
          sections={["beranda", "presensi", "pengaturan"]}
          active={section}
          onNavigate={(s) => {
            setSection(s)
            if (s === "presensi") setSelected(null)
          }}
          headerLeft={
            <div className="min-w-0 flex items-center justify-between gap-2">
              <div className="min-w-0">
              <p className="truncate font-serif text-lg font-semibold text-foreground">{nama}</p>
              <p className="truncate text-xs text-muted-foreground">
                {kelas} · No. {nomorPresensi} · {verifiedCount}/{EVENTS.length} hadir
              </p>
              </div>
              {onExit && (
                <button
                  onClick={onExit}
                  title="Kembali ke halaman utama"
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-[var(--line)] bg-white/[0.05] px-2.5 text-xs text-foreground/80 transition hover:border-[var(--gold)]/50 hover:bg-white/10 active:scale-95"
                >
                  <Home className="h-3.5 w-3.5" /> Utama
                </button>
              )}
            </div>
          }
        >
          <div key={section} className="animate-slide-fade">
            {section === "beranda" && beranda}
            {section === "presensi" && presensi}
            {section === "pengaturan" && pengaturan}
          </div>
        </DashboardShell>
      </div>
    </div>
  )
}
