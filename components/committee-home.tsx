"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Moon, UtensilsCrossed, ChevronRight, ShieldCheck, ScanLine, Users, Activity, Home } from "lucide-react"
import { GlassCard } from "./ui-kit"
import { VerifySubmenu } from "./committee/verify-submenu"
import { RecapSubmenu } from "./committee/recap-submenu"
import { AccountsSection } from "./committee/accounts-section"
import { DashboardShell, type DashSection } from "./dashboard-shell"
import { SettingsPanel } from "./settings-panel"
import { EVENTS, EVENT_LABELS, type EventKey } from "@/lib/db/schema"
import type { RecapRow, AccountRow } from "@/lib/queries"

const ICONS: Record<EventKey, typeof GraduationCap> = {
  studium_generale: GraduationCap,
  mabit: Moon,
  konsumsi: UtensilsCrossed,
}

export function CommitteeHome({
  recaps,
  accounts,
  onExit,
}: {
  recaps: Record<EventKey, RecapRow[]>
  accounts: AccountRow[]
  onExit?: () => void
}) {
  const [section, setSection] = useState<DashSection>("beranda")
  const [selected, setSelected] = useState<EventKey | null>(null)
  const [tab, setTab] = useState<"verifikasi" | "rekap">("verifikasi")
  const router = useRouter()

  const totalVerified = EVENTS.reduce((n, ev) => n + (recaps[ev]?.filter((r) => r.verifiedAt).length ?? 0), 0)
  const totalShown = EVENTS.reduce((n, ev) => n + (recaps[ev]?.length ?? 0), 0)

  /* ---------- Beranda ---------- */
  const beranda = (
    <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      {/* Statistik ringkas */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Akun Peserta", value: accounts.length, accent: "var(--gold)" },
          { icon: Activity, label: "Tampil QR", value: totalShown, accent: "var(--blue)" },
          { icon: ShieldCheck, label: "Terverifikasi", value: totalVerified, accent: "var(--purple)" },
        ].map((s, i) => (
          <GlassCard key={s.label} className={"animate-rise-" + (i + 1) + " !p-0"}>
            <div className="px-4 py-4 text-center">
              <s.icon className="mx-auto mb-1.5 h-5 w-5" style={{ color: s.accent }} />
              <p className="font-serif text-2xl font-bold tabular-nums text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Pilih kegiatan */}
      <p className="mb-3 px-1 font-serif text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Kegiatan Salam Awal
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {EVENTS.map((ev, i) => {
          const Icon = ICONS[ev]
          const count = recaps[ev]?.filter((r) => r.verifiedAt).length ?? 0
          return (
            <button
              key={ev}
              onClick={() => {
                setSelected(ev)
                setTab("verifikasi")
                setSection("presensi")
              }}
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              className="lift sheen-host animate-rise group relative flex flex-col items-start gap-3 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-4 text-left backdrop-blur-xl hover:border-[var(--gold)]/60"
            >
              <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[radial-gradient(circle,var(--gold)_0%,transparent_70%)] opacity-15 transition-opacity duration-300 group-hover:opacity-35" />
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Icon className="h-6 w-6" />
              </span>
              <span className="relative">
                <span className="block font-semibold text-foreground">{EVENT_LABELS[ev]}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{count} terverifikasi</span>
              </span>
              <span className="relative inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold)] transition-all group-hover:gap-2">
                Scan sekarang <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
        💡 Buka menu <b>Presensi</b> di sidebar untuk scan QR & rekap per kegiatan, atau{" "}
        <b>Daftar Peserta</b> untuk mengelola akun & mereset password peserta (butuh kode unik).
      </p>
    </div>
  )

  /* ---------- Presensi (scan & rekap per kegiatan) ---------- */
  const presensi = (
    <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-2xl">
      {!selected ? (
        <div className="grid gap-3">
          <p className="mb-1 flex items-center gap-2 px-1 text-sm text-muted-foreground">
            <ScanLine className="h-4 w-4 text-[var(--gold)]" /> Pilih kegiatan untuk scan & rekap:
          </p>
          {EVENTS.map((ev, i) => {
            const Icon = ICONS[ev]
            const rows = recaps[ev] ?? []
            const verified = rows.filter((r) => r.verifiedAt).length
            return (
              <button
                key={ev}
                onClick={() => {
                  setSelected(ev)
                  setTab("verifikasi")
                }}
                style={{ animationDelay: `${i * 0.08}s` }}
                className="lift animate-rise group flex items-center gap-4 rounded-3xl border border-white/12 bg-white/[0.05] p-4 text-left backdrop-blur-xl transition hover:border-[var(--gold)]/50 hover:bg-white/[0.09]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] text-white transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-foreground">{EVENT_LABELS[ev]}</span>
                  <span className="text-sm text-muted-foreground">Verifikasi & rekap · {verified} hadir</span>
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
              <Activity className="h-4 w-4" /> Ganti kegiatan
            </button>
            <span className="rounded-full border border-[var(--line)] bg-white/[0.05] px-3 py-1 text-xs font-semibold text-[var(--gold)]">
              {EVENT_LABELS[selected]}
            </span>
          </div>

          <GlassCard>
            <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/12 bg-white/[0.04] p-1">
              {(["verifikasi", "rekap"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={
                    "min-h-10 rounded-xl px-3 py-2 text-sm font-semibold capitalize transition-all duration-300 " +
                    (tab === t
                      ? "bg-gradient-to-r from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] text-white shadow-md"
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
  )

  /* ---------- Daftar peserta ---------- */
  const peserta = (
    <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-2xl">
      <AccountsSection accounts={accounts} />
    </div>
  )

  /* ---------- Pengaturan ---------- */
  const pengaturan = (
    <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-2xl">
      <SettingsPanel role="panitia" />
    </div>
  )

  return (
    <div className="w-full">
      <DashboardShell
          sections={["beranda", "presensi", "peserta", "pengaturan"]}
          active={section}
          onNavigate={(s) => {
            setSection(s)
            if (s === "presensi") setSelected(null)
          }}
          headerLeft={
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate font-serif text-lg font-semibold text-foreground">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--gold)]" /> Dashboard Panitia
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {accounts.length} akun · {totalVerified}/{totalShown || 0} kehadiran tervalidasi
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
            {section === "peserta" && peserta}
            {section === "pengaturan" && pengaturan}
          </div>
        </DashboardShell>
    </div>
  )
}
