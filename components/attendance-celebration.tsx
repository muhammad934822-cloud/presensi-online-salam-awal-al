"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Sparkles } from "lucide-react"
import { getMyAttendanceStatus } from "@/app/actions/participant"
import { playSuccess } from "@/lib/sound"
import { EVENT_LABELS, type EventKey } from "@/lib/db/schema"

/* ============================================================
   attendance-celebration.tsx — Detektor presensi realtime utk PESERTA.

   Cara kerja (aman & ringan):
   1. Polling query baca kecil `getMyAttendanceStatus()` tiap 5 detik
      (hanya saat tab terlihat) + langsung cek saat tab kembali fokus.
   2. Jika ada kegiatan yang berubah BELUM → HADIR sejak render awal
      server, tampilkan kartu selebrasi melayang di bawah layar
      (toast besar berandaum + confetti + stempel centang) dan bunyikan
      nada sukses via Web Audio (bisa dimatikan di Pengaturan).
   3. Setelah toast selesai, `router.refresh()` sekali agar data
      dashboard (progress, badge Hadir, QR ter-stempel) sinkron.

   TIDAK menulis apa pun ke database — murni SELECT + UI.
   ============================================================ */

type Status = Record<string, string | null> // event -> ISO verifiedAt | null

function toMap(rows: { event: string; verifiedAt: Date | null }[]): Status {
  const m: Status = {}
  for (const r of rows) m[r.event] = r.verifiedAt ? new Date(r.verifiedAt).toISOString() : null
  return m
}

export function AttendanceCelebration({ initial }: { initial: Status }) {
  const router = useRouter()
  const baseline = useRef<Status>(initial)
  const celebrated = useRef(false) // hanya satu selebrasi per sesi halaman
  const [event, setEvent] = useState<EventKey | null>(null)

  useEffect(() => {
    let alive = true

    async function check() {
      if (!alive || !document.visibilityState.startsWith("vis")) return
      if (celebrated.current) return // sudah pernah dirayakan, berhenti polling
      try {
        const rows = await getMyAttendanceStatus()
        if (!alive || celebrated.current) return
        const now = toMap(rows)
        for (const ev of Object.keys(now)) {
          if (now[ev] && !baseline.current[ev]) {
            celebrated.current = true
            setEvent(ev as EventKey)
            playSuccess()
            return
          }
        }
      } catch {
        /* jaringan sesaat — coba lagi pada tick berikutnya */
      }
    }

    const id = window.setInterval(check, 5000)
    const onFocus = () => void check()
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    return () => {
      alive = false
      window.clearInterval(id)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onFocus)
    }
  }, [])

  function dismiss() {
    setEvent(null)
    // Sinkronkan dashboard (badge Hadir, progress, stempel QR) setelah selebrasi
    router.refresh()
  }

  useEffect(() => {
    if (!event) return
    const t = window.setTimeout(dismiss, 6000)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event])

  if (!event) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      <div
        role="status"
        aria-live="assertive"
        onClick={dismiss}
        className="animate-toast-up pointer-events-auto relative w-full max-w-md cursor-pointer overflow-hidden rounded-3xl border border-emerald-400/50 bg-[oklch(0.28_0.06_155)]/95 p-5 shadow-[0_20px_60px_-12px_rgba(52,211,153,0.55)] backdrop-blur-xl"
      >
        {/* Confetti halus di dalam kartu */}
        <span aria-hidden className="confetti-rain pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              style={{
                left: `${(i * 8 + 4) % 100}%`,
                background: ["#fbbf24", "#34d399", "#60a5fa", "#c084fc", "#fb7185", "#ffffff"][i % 6],
                animationDelay: `${(i % 6) * 0.15}s`,
              }}
            />
          ))}
        </span>

        <div className="relative flex items-center gap-4">
          <span className="pulse-success flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white/15">
            <CheckCircle2 className="h-10 w-10 text-emerald-300" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Presensi Berhasil!
            </p>
            <p className="mt-0.5 text-sm font-medium text-emerald-100/90">
              {EVENT_LABELS[event]} — kehadiranmu tercatat pukul{" "}
              {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-200/70">
              <Sparkles className="h-3 w-3" /> Ketuk untuk menutup
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
