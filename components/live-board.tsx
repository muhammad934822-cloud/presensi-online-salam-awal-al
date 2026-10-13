"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Radio, Users, CheckCircle2, GraduationCap, Moon, UtensilsCrossed } from "lucide-react"
import { EVENTS, type EventKey } from "@/lib/db/schema"

/* ============================================================
   live-board.tsx — Papan Kehadiran Langsung (halaman /live).

   WOW-FACTOR untuk hari-H: proyeksikan halaman ini ke layar/TV aula.
   - Refresh data ringan tiap 4 detik (router.refresh, SELECT saja).
   - Counter angka ber-animasi naik halus saat bertambah (bukan lompat).
   - Baris peserta terbaru masuk meluncur dari bawah + highlight emas
     yang memudar (efek "baru hadir!").
   TIDAK ada penulisan database apa pun — murni baca & tampilan.
   ============================================================ */

type Recap = Record<string, { hadir: number; total: number }>
type LatestRow = { event: string; nama: string; kelas: string; nomorPresensi: number; at: string }

const EVENT_META: Record<EventKey, { label: string; icon: typeof GraduationCap; ring: string }> = {
  studium_generale: { label: "Studium Generale", icon: GraduationCap, ring: "from-[var(--gold)] to-amber-300" },
  mabit: { label: "Mabit", icon: Moon, ring: "from-indigo-400 to-[var(--purple)]" },
  konsumsi: { label: "Konsumsi", icon: UtensilsCrossed, ring: "from-emerald-400 to-teal-300" },
}

/** Angka yang bergerak halus menuju nilai target (count-up). */
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    const b = value
    if (a === b) return
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 700)
      const eased = 1 - Math.pow(1 - p, 3) // ease-out cubic
      setDisplay(Math.round(a + (b - a) * eased))
      if (p < 1) raf = requestAnimationFrame(step)
      else from.current = b
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{display}</>
}

export function LiveBoardClient({ recaps, latest }: { recaps: Recap; latest: LatestRow[] }) {
  const router = useRouter()
  const seenIds = useRef<Set<string>>(new Set())
  const mounted = useRef(false)

  /* Auto-refresh ringan tiap 4 detik (hanya saat tab terlihat) */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh()
    }, 4000)
    // tandai semua baris awal agar tidak dianggap "baru"
    for (const r of latest) seenIds.current.add(`${r.nama}|${r.event}|${r.at}`)
    mounted.current = true
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalShown = Object.values(recaps).reduce((s, r) => s + r.total, 0)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      {/* Header papan */}
      <header className="animate-slide-fade text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-red-300">
          <Radio className="h-3.5 w-3.5 animate-pulse" /> Papan Langsung
        </span>
        <h1 className="mt-4 font-serif text-4xl font-bold text-foreground sm:text-5xl">
          Salam Awal Al <span className="bg-gradient-to-r from-[var(--gold)] via-amber-200 to-[var(--gold)] bg-clip-text text-transparent">Uswah</span> 1448 H
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Kehadiran peserta ter-update otomatis setiap beberapa detik</p>
      </header>

      {/* Ringkasan besar */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="col-span-2 rounded-3xl border border-white/10 bg-white/[0.05] p-6 text-center backdrop-blur-md sm:col-span-1">
          <Users className="mx-auto h-6 w-6 text-[var(--blue)]" />
          <p className="mt-2 text-4xl font-black tabular-nums text-foreground"><AnimatedNumber value={totalShown} /></p>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Peserta</p>
        </div>
        {(EVENTS as readonly EventKey[]).map((ev) => {
          const meta = EVENT_META[ev]
          const r = recaps[ev] ?? { hadir: 0, total: 0 }
          const pct = r.total ? Math.round((r.hadir / r.total) * 100) : 0
          return (
            <div key={ev} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-md">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <meta.icon className="h-4 w-4 text-[var(--gold)]" /> {meta.label}
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-foreground">
                <AnimatedNumber value={r.hadir} />
                <span className="text-base font-bold text-muted-foreground">/{r.total}</span>
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${meta.ring} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </section>

      {/* Feed kehadiran terbaru */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Baru Saja Hadir
        </h2>
        {latest.length === 0 ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">Belum ada presensi. Nyalakan scanner panitia dan QR akan muncul di sini ✨</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {latest.map((r) => {
              const id = `${r.nama}|${r.event}|${r.at}`
              const isNew = !seenIds.current.has(id)
              if (isNew && mounted.current) seenIds.current.add(id)
              const time = new Date(r.at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
              return (
                <li
                  key={id}
                  className={
                    "flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 " +
                    (isNew
                      ? "animate-slide-fade border-[var(--gold)]/50 bg-[var(--gold)]/10"
                      : "border-white/8 bg-white/[0.03]")
                  }
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--gold)] to-amber-500 text-sm font-black text-black">
                      {r.nama.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{r.nama}</p>
                      <p className="text-xs text-muted-foreground">No {r.nomorPresensi} · {r.kelas} · {r.event}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold tabular-nums text-emerald-300">
                    {time}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <footer className="pb-4 text-center text-xs text-muted-foreground">© Salam Awal Al Uswah 1448 H</footer>
    </div>
  )
}
