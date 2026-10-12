"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Moon, UtensilsCrossed, LogOut, ArrowLeft, ChevronRight, ShieldCheck, Users, Loader2 } from "lucide-react"
import { GlassCard, GhostButton } from "./ui-kit"
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

export function CommitteeHome({
  recaps,
  accounts,
}: {
  recaps: Record<EventKey, RecapRow[]>
  accounts: AccountRow[]
}) {
  const [selected, setSelected] = useState<EventKey | null>(null)
  const [tab, setTab] = useState<"verifikasi" | "rekap">("verifikasi")
  const [showAccounts, setShowAccounts] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function logout() {
    startTransition(async () => {
      await logoutCommittee()
      router.refresh()
    })
  }

  const totalHadir = EVENTS.reduce((acc, ev) => acc + (recaps[ev]?.filter((r) => r.verifiedAt).length ?? 0), 0)

  return (
    <div className="mx-auto w-full max-w-md">
      <BrandHeader compact />

      <div className="mt-6">
        {/* Dashboard header with live stats */}
        <GlassCard glow className="animate-rise-1 mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <span className="conic-ring absolute -inset-1 rounded-2xl opacity-70 blur-[2px]" aria-hidden="true" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--blue),var(--purple))] text-white shadow-lg shadow-[var(--blue)]/25">
                  <ShieldCheck className="h-6 w-6" />
                </span>
              </div>
              <div>
                <p className="font-serif font-semibold text-foreground">Dashboard Panitia</p>
                <p className="text-xs text-muted-foreground">Verifikasi & rekap presensi</p>
              </div>
            </div>
            <GhostButton
              onClick={logout}
              disabled={pending}
              className="min-h-0 w-auto px-3 py-2 text-sm"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Keluar
            </GhostButton>
          </div>

          {/* Stat chips */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Akun peserta", value: accounts.length, accent: "text-[var(--gold)]" },
              { label: "Total hadir", value: totalHadir, accent: "text-emerald-300" },
              { label: "Kegiatan", value: EVENTS.length, accent: "text-[var(--blue)]" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
                <p className={`text-xl font-bold tabular-nums ${s.accent}`}>{s.value}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {selected === null ? (
          <>
            <div className="grid gap-3">
              {EVENTS.map((ev, i) => {
                const Icon = ICONS[ev]
                const accent = ACCENTS[ev]
                const rows = recaps[ev] ?? []
                const count = rows.length
                const hadir = rows.filter((r) => r.verifiedAt).length
                const pct = count ? Math.round((hadir / count) * 100) : 0
                return (
                  <button
                    key={ev}
                    onClick={() => {
                      setSelected(ev)
                      setTab("verifikasi")
                    }}
                    style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                    className={`lift sheen-host animate-rise group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4 text-left backdrop-blur-xl ${accent.hoverBorder}`}
                  >
                    <span className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-15 transition-opacity duration-300 group-hover:opacity-35 ${accent.glow}`} />
                    <span className={`relative flex h-13 w-13 shrink-0 self-center items-center justify-center rounded-2xl p-3 shadow-lg transition-transform duration-300 group-hover:scale-110 ${accent.iconBg}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="relative min-w-0 flex-1">
                      <span className="block font-semibold text-foreground">{EVENT_LABELS[ev]}</span>
                      <span className="text-sm text-muted-foreground">
                        {count > 0 ? `${hadir}/${count} terverifikasi` : "Belum ada QR ditampilkan"}
                      </span>
                      {count > 0 && (
                        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/10">
                          <span
                            className="block h-full rounded-full bg-[linear-gradient(90deg,var(--gold),var(--blue))] transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                      )}
                    </span>
                    <ChevronRight className="relative h-5 w-5 shrink-0 text-foreground/50 transition group-hover:translate-x-1 group-hover:text-[var(--gold)]" />
                  </button>
                )
              })}
            </div>

            {/* Collapsible accounts review */}
            <div className="mt-5">
              <button
                onClick={() => setShowAccounts((s) => !s)}
                className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:bg-white/[0.08]"
                aria-expanded={showAccounts}
              >
                <Users className="h-5 w-5 text-[var(--gold)]" />
                <span className="flex-1 font-semibold text-foreground">
                  Tinjau Akun Peserta
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                    {accounts.length}
                  </span>
                </span>
                <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${showAccounts ? "rotate-90" : ""}`} />
              </button>
              {showAccounts && (
                <div className="animate-rise mt-1">
                  <AccountsSection accounts={accounts} />
                </div>
              )}
            </div>
          </>
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

              {/* Segmented pill tabs with sliding thumb */}
              <div className="relative mb-5 grid grid-cols-2 rounded-2xl border border-white/12 bg-white/[0.04] p-1">
                <span
                  aria-hidden
                  className="absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-[linear-gradient(100deg,var(--gold),var(--purple)_60%,var(--blue))] shadow-lg shadow-[var(--purple)]/30 transition-transform duration-300 ease-out"
                  style={{ transform: tab === "rekap" ? "translateX(calc(100% + 0.5rem))" : "translateX(0)" }}
                />
                {(["verifikasi", "rekap"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={
                      "relative z-10 min-h-10 rounded-xl px-3 py-2 text-sm font-semibold capitalize transition-colors " +
                      (tab === t ? "text-white" : "text-foreground/60 hover:text-foreground")
                    }
                  >
                    {t === "verifikasi" ? "Verifikasi" : "Rekap"}
                  </button>
                ))}
              </div>

              {tab === "verifikasi" ? (
                // key: remount bersih saat ganti acara, hindari state tertinggal
                <VerifySubmenu key={selected} event={selected} />
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
