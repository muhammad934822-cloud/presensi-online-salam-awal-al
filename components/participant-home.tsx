"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Moon, UtensilsCrossed, LogOut, ArrowLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react"
import { GlassCard, GhostButton } from "./ui-kit"
import { BrandHeader } from "./brand-header"
import { QrPanel } from "./qr-panel"
import { EVENTS, EVENT_LABELS, type EventKey } from "@/lib/db/schema"
import { logoutParticipant } from "@/app/actions/participant"

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
}: {
  nama: string
  kelas: string
  nomorPresensi: number
  codes: Codes
}) {
  const [selected, setSelected] = useState<EventKey | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function logout() {
    startTransition(async () => {
      await logoutParticipant()
      router.refresh()
    })
  }

  const verifiedCount = EVENTS.filter((ev) => Boolean(codes[ev]?.verifiedAt)).length
  const initials = nama
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div className="mx-auto w-full max-w-md">
      <BrandHeader compact />

      <div className="mt-6">
        {/* Profile card with progress */}
        <GlassCard glow className="animate-rise-1 mb-5">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <span className="conic-ring absolute -inset-1 rounded-2xl opacity-70 blur-[2px]" aria-hidden="true" />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-[oklch(0.24_0.03_255)] font-serif text-lg font-bold text-[var(--gold)]">
                {initials || "?"}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-foreground">{nama}</p>
              <p className="text-sm text-muted-foreground">
                {kelas} &middot; No. {nomorPresensi}
              </p>
              {/* Progress bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold),var(--purple),var(--blue))] transition-all duration-700"
                    style={{ width: `${(verifiedCount / EVENTS.length) * 100}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                  {verifiedCount}/{EVENTS.length} hadir
                </span>
              </div>
            </div>
            <GhostButton
              onClick={logout}
              disabled={pending}
              className="min-h-0 w-auto px-3 py-2 text-sm"
              aria-label="Keluar"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Keluar
            </GhostButton>
          </div>
        </GlassCard>

        {selected === null ? (
          <div className="grid gap-3">
            {EVENTS.map((ev, i) => {
              const Icon = ICONS[ev]
              const accent = ACCENTS[ev]
              const verified = Boolean(codes[ev]?.verifiedAt)
              return (
                <button
                  key={ev}
                  onClick={() => setSelected(ev)}
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                  className={`lift sheen-host animate-rise group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4 text-left backdrop-blur-xl ${accent.hoverBorder}`}
                >
                  <span className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-15 transition-opacity duration-300 group-hover:opacity-35 ${accent.glow}`} />
                  <span className={`relative flex h-13 w-13 shrink-0 items-center justify-center self-center rounded-2xl p-3 shadow-lg transition-transform duration-300 group-hover:scale-110 ${accent.iconBg}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{EVENT_LABELS[ev]}</span>
                    <span className="text-sm text-muted-foreground">
                      {verified ? "Presensi sudah tervalidasi ✓" : "Tampilkan QR / kode unik ke panitia"}
                    </span>
                  </span>
                  {verified ? (
                    <span className="relative inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Hadir
                    </span>
                  ) : (
                    <ChevronRight className="relative h-5 w-5 shrink-0 text-foreground/50 transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
                  )}
                </button>
              )
            })}

            <p className="mt-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
              💡 Tips: Buka menu kegiatan saat panitia memanggil, lalu tunjukkan QR-mu.
              Jangan bagikan kode unikmu kepada orang lain.
            </p>
          </div>
        ) : (
          <div className="animate-pop">
            <button
              onClick={() => {
                setSelected(null)
                router.refresh()
              }}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground/70 transition hover:-translate-x-0.5 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke menu
            </button>
            <GlassCard glow>
              <h3 className="mb-4 text-center font-serif text-xl font-semibold text-foreground">
                {EVENT_LABELS[selected]}
              </h3>
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
    </div>
  )
}
