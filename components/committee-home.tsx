"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Moon, UtensilsCrossed, LogOut, ArrowLeft, ChevronRight, ShieldCheck } from "lucide-react"
import { GlassCard } from "./ui-kit"
import { BrandHeader } from "./brand-header"
import { VerifySubmenu } from "./committee/verify-submenu"
import { RecapSubmenu } from "./committee/recap-submenu"
import { AccountsSection } from "./committee/accounts-section"
import { EVENTS, EVENT_LABELS, type EventKey } from "@/lib/db/schema"
import type { RecapRow, AccountRow } from "@/lib/queries"
import { logoutCommittee } from "@/app/actions/committee"

const ICONS: Record<EventKey, typeof GraduationCap> = {
  studium_generale: GraduationCap,
  mabit: Moon,
  konsumsi: UtensilsCrossed,
}

export function CommitteeHome({
  recaps,
  accounts,
}: {
  recaps: Record<EventKey, RecapRow[]>
  accounts: AccountRow[]
}) {
  const [selected, setSelected] = useState<EventKey | null>(null)
  const [tab, setTab] = useState<"verifikasi" | "rekap">("verifikasi")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function logout() {
    startTransition(async () => {
      await logoutCommittee()
      router.refresh()
    })
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <BrandHeader compact />

      <div className="mt-6">
        <GlassCard className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-[var(--gold)]" />
              <div>
                <p className="font-semibold text-foreground">Dashboard Panitia</p>
                <p className="text-xs text-muted-foreground">Verifikasi & rekap presensi</p>
              </div>
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
          <>
            <div className="grid gap-3">
              {EVENTS.map((ev) => {
                const Icon = ICONS[ev]
                const count = recaps[ev]?.length ?? 0
                return (
                  <button
                    key={ev}
                    onClick={() => {
                      setSelected(ev)
                      setTab("verifikasi")
                    }}
                    className="group flex items-center gap-4 rounded-3xl border border-white/15 bg-white/[0.06] p-4 text-left backdrop-blur-xl transition hover:border-[var(--gold)]/50 hover:bg-white/[0.1]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-foreground">{EVENT_LABELS[ev]}</span>
                      <span className="text-sm text-muted-foreground">Verifikasi & rekap &middot; {count} peserta</span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-foreground/50 transition group-hover:translate-x-0.5" />
                  </button>
                )
              })}
            </div>

            <AccountsSection accounts={accounts} />
          </>
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

              <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/12 bg-white/[0.04] p-1">
                {(["verifikasi", "rekap"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={
                      "min-h-10 rounded-xl px-3 py-2 text-sm font-semibold capitalize transition " +
                      (tab === t
                        ? "bg-gradient-to-r from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] text-white"
                        : "text-foreground/70 hover:text-foreground")
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>

              {tab === "verifikasi" ? (
                <VerifySubmenu event={selected} />
              ) : (
                <RecapSubmenu rows={recaps[selected] ?? []} eventLabel={EVENT_LABELS[selected]} />
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  )
}
