"use client"

import { useState, useMemo, Suspense } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { GraduationCap, Moon, UtensilsCrossed, ChevronRight, ShieldCheck, ScanLine, Users, Activity, Home , Lightbulb, History, BellRing, FlaskConical, QrCode } from "lucide-react"
import { GlassCard } from "./ui-kit"
import { VerifySubmenu } from "./committee/verify-submenu"
import { RecapSubmenu } from "./committee/recap-submenu"
import { AccountsSection } from "./committee/accounts-section"
import { ParticipantHome } from "./participant-home"
import { PesertaAuth, UjiCobaContext } from "./peserta-auth"
import { generate16DigitCode } from "@/lib/crypto"
import { DashboardShell, type DashSection } from "./dashboard-shell"
import { SettingsPanel } from "./settings-panel"
import { DemoUjicoba } from "./demo-ujicoba"

import { ActivityList } from "./activity-list"
import { EVENTS, EVENT_LABELS, type EventKey } from "@/lib/db/schema"
import type { RecapRow, AccountRow, ActivityRow, ClassStat } from "@/lib/queries"
import { getPendingResetHelp, resetHelpByCode, deleteHelpByCode, type HelpRequest } from "@/app/actions/committee"
import { playIncoming } from "@/lib/sound"
import { useEffect, useRef } from "react"

const ICONS: Record<EventKey, typeof GraduationCap> = {
  studium_generale: GraduationCap,
  mabit: Moon,
  konsumsi: UtensilsCrossed,
}


export function CommitteeHome({
  recaps,
  accounts,
  activity,
  classStats,
  onExit,
  demoActive = false,
}: {
  recaps: Record<EventKey, RecapRow[]>
  accounts: AccountRow[]
  activity?: ActivityRow[]
  classStats?: ClassStat[]
  onExit?: () => void
  /** Panitia sedang membuka sesi Ujicoba akun demo. */
  demoActive?: boolean
}) {
  const [section, setSection] = useState<DashSection>(demoActive ? "ujicoba" : "beranda")
  const [selected, setSelected] = useState<EventKey | null>(null)
  const [tab, setTab] = useState<"verifikasi" | "rekap">("verifikasi")
  const router = useRouter()

  /* ---- Tinjauan permintaan "Lupa Kode Unik" dari peserta ---- */
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [busyHelp, setBusyHelp] = useState<string | null>(null)
  const helpTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevCount = useRef(0)

  async function refreshHelp() {
    try {
      const list = await getPendingResetHelp()
      // Notifikasi suara saat permintaan BARU masuk (bukan saat load awal).
      if (prevCount.current > 0 && list.length > prevCount.current) playIncoming()
      prevCount.current = list.length
      setHelpRequests(list)
    } catch {
      /* diam — jangan jatuhkan dashboard karena gagal ambil tinjauan */
    }
  }

  /** Kunci peserta yang sedang mengajukan reset — tombol reset di Daftar
   *  Peserta hanya muncul untuk mereka (fitur hidden by default). */
  const pendingResetKeys = useMemo(
    () => helpRequests.map((h) => `${h.kelas}::${h.nomor}`),
    [helpRequests],
  )
  useEffect(() => {
    void refreshHelp()
    helpTimer.current = setInterval(() => { if (!document.hidden) void refreshHelp() }, 3_000)
    return () => { if (helpTimer.current) clearInterval(helpTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleHelpAction(kode: string, kind: "reset" | "delete") {
    setBusyHelp(kode)
    try {
      const res = kind === "reset" ? await resetHelpByCode(kode) : await deleteHelpByCode(kode)
      if (!res.ok && res.error) alert(res.error)
    } finally {
      setBusyHelp(null)
      void refreshHelp()
      router.refresh()
    }
  }

  const totalVerified = EVENTS.reduce((n, ev) => n + (recaps[ev]?.filter((r) => r.verifiedAt).length ?? 0), 0)
  const totalShown = EVENTS.reduce((n, ev) => n + (recaps[ev]?.length ?? 0), 0)

  /* ---------- Beranda ---------- */
  const beranda = (
    <div className="w-full">
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

      {/* Tinjauan permintaan "Lupa Kode Unik" dari peserta */}
      {helpRequests.length > 0 && (
        <GlassCard className="animate-rise-1 mb-5 !p-0 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--gold)]/10 px-4 py-3">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--purple)] text-white shadow-md">
              <BellRing className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-foreground">Perlu Ditinjau — Permintaan Bantu Reset</p>
            <span className="ml-auto inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--gold)] px-2 text-xs font-bold tabular-nums text-black">
              {helpRequests.length}
            </span>
          </div>
          <ul className="divide-y divide-[var(--line)]">
            {helpRequests.map((h) => {
              const busy = busyHelp === h.kode
              const waited = Math.max(0, Math.floor((Date.now() - h.createdAt.getTime()) / 60_000))
              const overdue = waited >= 60
              return (
                <li key={h.kode} className="px-4 py-3 transition-colors hover:bg-white/[0.04]">
                  {/* Baris identitas */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="min-w-0 flex-1 break-words text-sm font-semibold text-foreground">{h.nama}</span>
                    <span className="shrink-0 rounded-lg border border-[var(--line)] bg-white/[0.05] px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.18em] text-[var(--gold)]">
                      {h.kode}
                    </span>
                  </div>
                  {/* Data berkelompok: Nama | Kelas | Nomor | Token | WA (tanpa sensor utk verifikasi) */}
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-4">
                    <div className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Kelas</dt>
                      <dd className="truncate font-semibold text-foreground/90">{h.kelas}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/70">No. Presensi</dt>
                      <dd className="font-semibold tabular-nums text-foreground/90">{h.nomor}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Token</dt>
                      <dd className="truncate font-mono font-semibold tracking-wider text-[var(--gold)]">{h.kode}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/70">Nomor WA</dt>
                      <dd className="truncate font-semibold tabular-nums text-foreground/90">{h.phone}</dd>
                    </div>
                  </dl>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    <span className={overdue ? "font-semibold text-[var(--gold)]" : ""}>
                      Menunggu {waited} mnt{overdue ? " — melewati batas 60 menit" : ""}
                    </span>
                  </p>
                  {/* Aksi di bawah (bukan di samping) */}
                  <div className="mt-2.5 flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => handleHelpAction(h.kode, "delete")}
                      disabled={busy}
                      className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                    >
                      Hapus
                    </button>
                    <button
                      onClick={() => handleHelpAction(h.kode, "reset")}
                      disabled={busy}
                      className="lift rounded-xl bg-gradient-to-r from-[var(--gold)] to-[var(--purple)] px-3.5 py-1.5 text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                    >
                      {busy ? "Memproses…" : "Reset → 12345678"}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </GlassCard>
      )}

          {/* Progress kehadiran per kegiatan */}
          <GlassCard className="animate-rise-2 mb-5">
            <div className="px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Activity className="h-4 w-4 text-[var(--gold)]" /> Progress Kehadiran Hari Ini
                </p>
                <span className="font-serif text-xl font-bold tabular-nums text-gradient-gold">
                  {totalShown ? Math.round((totalVerified / totalShown) * 100) : 0}%
                </span>
              </div>
              <div className="grid gap-3">
                {EVENTS.map((ev) => {
                  const rows = recaps[ev] ?? []
                  const v = rows.filter((r) => r.verifiedAt).length
                  const p = rows.length ? Math.round((v / rows.length) * 100) : 0
                  return (
                    <div key={ev}>
                      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
                        <span className="min-w-0 truncate font-medium text-foreground/85">{EVENT_LABELS[ev]}</span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{v}/{rows.length}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold),var(--purple),var(--blue))] transition-all duration-700 ease-out"
                          style={{ width: `${Math.max(p, v > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </GlassCard>

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
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {count} terverifikasi
                </span>
              </span>
              <span className="relative inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold)] transition-all group-hover:gap-2">
                Scan sekarang <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-center text-xs leading-relaxed text-muted-foreground">
        <Lightbulb className="mr-1 inline h-3.5 w-3.5 -translate-y-px text-[var(--gold)]" aria-hidden="true" /> Buka menu <b>Presensi</b> di sidebar untuk scan QR & rekap per kegiatan, atau{" "}
        <b>Daftar Peserta</b> untuk mengelola akun & mereset password peserta.
      </p>

      {/* Statistik kehadiran per kelas — RINGKAS, klik untuk detail */}
      {classStats && classStats.length > 0 && (
        <GlassCard className="animate-rise-3 mt-5">
          <button
            onClick={() => setSection("kelas")}
            className="group flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
          >
            <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 shrink-0 text-[var(--blue)]" /> Kehadiran per Kelas
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--gold)] transition-all group-hover:gap-2">
              Lihat detail <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </button>
          <div className="grid gap-x-5 gap-y-2 border-t border-[var(--line)] px-4 py-3 md:grid-cols-3">
            {EVENTS.map((ev) => {
              const list = classStats.filter((c) => c.event === ev)
              if (list.length === 0) return null
              const totalHadir = list.reduce((n, c) => n + c.hadir, 0)
              const totalAll = list.reduce((n, c) => n + c.total, 0)
              return (
                <div key={ev} className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="min-w-0 truncate font-medium text-foreground/85">{EVENT_LABELS[ev]}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{totalHadir}/{totalAll}</span>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* Riwayat aktivitas — RINGKAS (6 baris), klik untuk rekap lengkap */}
      {activity && activity.length > 0 && (
        <GlassCard className="animate-rise-4 mt-5 !p-0">
          <div className="px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <History className="h-4 w-4 text-[var(--purple)]" /> Aktivitas Terbaru
              </p>
              <button
                onClick={() => setSection("riwayat")}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold)] transition-all hover:gap-2"
              >
                Semua riwayat <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <ActivityList rows={activity} compact />
          </div>
        </GlassCard>
      )}
    </div>
  )

  /* ---------- Presensi (scan & rekap per kegiatan) ---------- */
  const presensi = (
    <div className="w-full">
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
    <div className="w-full">
      <AccountsSection accounts={accounts} pendingResetKeys={pendingResetKeys} />
    </div>
  )

  /* ---------- Pengaturan ---------- */
  /* ---------- Ujicoba Akun Peserta: AKUN DEMO sungguhan yang bisa diuji
     end-to-end (login, QR, scan, reset password, ajukan/tinjau permintaan)
     tanpa mengganggu peserta asli. Panel pengaturannya ada di ./demo-ujicoba. */
  const ujicoba = <DemoUjicoba demoActive={demoActive} />

  const pengaturan = (
    <div className="w-full">
      <SettingsPanel role="panitia" />
    </div>
  )

  /* ---------- Riwayat lengkap (semua aktivitas terekap) ---------- */
  const riwayat = (
    <div className="w-full animate-rise">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setSection("beranda")}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-[var(--line)] bg-white/[0.05] px-2.5 text-xs text-foreground/80 transition hover:-translate-x-0.5 hover:border-[var(--gold)]/50 active:scale-95"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Beranda
        </button>
        <p className="flex min-w-0 items-center gap-2 font-serif text-lg font-semibold text-foreground">
          <History className="h-5 w-5 shrink-0 text-[var(--purple)]" /> Riwayat Aktivitas
        </p>
      </div>
      <GlassCard>
        <div className="px-4 py-4">
          <ActivityList rows={activity ?? []} />
        </div>
      </GlassCard>
    </div>
  )

  /* ---------- Detail kehadiran per kelas ---------- */
  const kelasDetail = (
    <div className="w-full animate-rise">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setSection("beranda")}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-[var(--line)] bg-white/[0.05] px-2.5 text-xs text-foreground/80 transition hover:-translate-x-0.5 hover:border-[var(--gold)]/50 active:scale-95"
        >
          <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Beranda
        </button>
        <p className="flex min-w-0 items-center gap-2 font-serif text-lg font-semibold text-foreground">
          <Users className="h-5 w-5 shrink-0 text-[var(--blue)]" /> Kehadiran per Kelas
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {EVENTS.map((ev) => {
          const list = (classStats ?? []).filter((c) => c.event === ev)
          if (list.length === 0) return null
          const Icon = ICONS[ev]
          const totalHadir = list.reduce((n, c) => n + c.hadir, 0)
          const totalAll = list.reduce((n, c) => n + c.total, 0)
          return (
            <GlassCard key={ev}>
              <div className="px-4 py-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Icon className="h-4 w-4 text-[var(--gold)]" /> {EVENT_LABELS[ev]}
                  <span className="ml-auto text-xs tabular-nums text-muted-foreground">{totalHadir}/{totalAll}</span>
                </p>
                <ul className="space-y-1.5">
                  {list.map((c) => {
                    const pct = c.total ? Math.round((c.hadir / c.total) * 100) : 0
                    return (
                      <li key={ev + c.kelas} className="flex items-center gap-2 text-xs">
                        <span className="w-16 shrink-0 break-words font-medium text-foreground/85">{c.kelas}</span>
                        <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                          <span
                            className="block h-full rounded-full bg-[linear-gradient(90deg,var(--blue),var(--purple))] transition-all duration-700"
                            style={{ width: `${Math.max(pct, c.hadir > 0 ? 6 : 0)}%` }}
                          />
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">{c.hadir}/{c.total}</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </GlassCard>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="w-full">
      <DashboardShell
          sections={["beranda", "presensi", "peserta", "ujicoba", "pengaturan"]}
          active={section}
          onNavigate={(s) => {
            setSection(s)
            if (s === "presensi") setSelected(null)
          }}
          onExit={onExit}
          headerLeft={
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <p className="flex items-center gap-2 font-serif text-base font-semibold leading-snug text-foreground">
                <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-[var(--gold)]" />
                <span className="break-words">Dashboard Panitia</span>
              </p>
              <p className="w-full text-xs text-muted-foreground sm:w-auto">
                {accounts.length} akun · {totalVerified}/{totalShown || 0} kehadiran tervalidasi
              </p>
            </div>
          }
        >
          <div key={section} className="animate-slide-fade">
            {section === "beranda" && beranda}
            {section === "presensi" && presensi}
            {section === "peserta" && peserta}
            {section === "ujicoba" && ujicoba}
            {section === "pengaturan" && pengaturan}
            {section === "riwayat" && riwayat}
            {section === "kelas" && kelasDetail}
          </div>
        </DashboardShell>
    </div>
  )
}
