"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Moon, UtensilsCrossed, LogOut, ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react"
import { GlassCard } from "./ui-kit"
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

  return (
    <div className="mx-auto w-full max-w-md">
      <BrandHeader compact />

      <div className="mt-6">
        <GlassCard className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-foreground">{nama}</p>
              <p className="text-sm text-muted-foreground">
                {kelas} &middot; No. {nomorPresensi}
              </p>
            </div>
            <button
              onClick={logout}
              disabled={pending}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-2xl border border-white/20 bg-white/[0.05] px-3 py-2 text-sm text-foreground transition hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </GlassCard>

        {selected === null ? (
          <div className="grid gap-3">
            {EVENTS.map((ev) => {
              const Icon = ICONS[ev]
              const verified = Boolean(codes[ev]?.verifiedAt)
              return (
                <button
                  key={ev}
                  onClick={() => setSelected(ev)}
                  className="group flex items-center gap-4 rounded-3xl border border-white/15 bg-white/[0.06] p-4 text-left backdrop-blur-xl transition hover:border-[var(--gold)]/50 hover:bg-white/[0.1]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] text-white">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-foreground">{EVENT_LABELS[ev]}</span>
                    <span className="text-sm text-muted-foreground">
                      {verified ? "Sudah presensi" : "Tampilkan QR / kode unik"}
                    </span>
                  </span>
                  {verified ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-foreground/50 transition group-hover:translate-x-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <div>
            <button
              onClick={() => {
                setSelected(null)
                router.refresh()
              }}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground/70 transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Menu
            </button>
            <GlassCard>
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
