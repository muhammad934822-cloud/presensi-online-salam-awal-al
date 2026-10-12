"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, CameraOff, ScanLine, CheckCircle2, XCircle, Info } from "lucide-react"
import { QrScanner } from "@/components/qr-scanner"
import { GradientButton } from "@/components/ui-kit"
import { verifyCode } from "@/app/actions/committee"

type Result =
  | { kind: "success"; nama: string; kelas: string; nomor: number }
  | { kind: "already"; nama: string; kelas: string; nomor: number }
  | { kind: "error"; message: string }

/* Overlay hijau besar + centang raksasa saat presensi BERHASIL */
type SuccessResult = { kind: "success"; nama: string; kelas: string; nomor: number }

function SuccessOverlay({ result, onDone }: { result: SuccessResult; onDone: () => void }) {
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    timer.current = window.setTimeout(onDone, 2600)
    return () => window.clearTimeout(timer.current)
  }, [onDone])

  // Bunyikan beep singkat (jika browser mengizinkan) agar lebih terdengar di hari-H
  useEffect(() => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45)
      osc.connect(gain).connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
      return () => {
        ctx.close().catch(() => {})
      }
    } catch {
      /* audio opsional */
    }
  }, [])

  return (
    <div
      className="success-flash-layer fixed inset-0 z-50 flex items-center justify-center bg-emerald-500/90 backdrop-blur-sm"
      onClick={onDone}
      role="status"
      aria-live="assertive"
    >
      <div className="relative flex flex-col items-center px-6 text-center">
        {/* Ring burst di belakang lingkaran centang */}
        <div className="absolute left-1/2 top-[70px] -translate-x-1/2 -translate-y-1/2">
          <div className="animate-ring-burst h-40 w-40 rounded-full border-4 border-white/70 sm:h-52 sm:w-52" />
        </div>
        <div className="animate-stamp relative flex h-36 w-36 items-center justify-center rounded-full bg-white shadow-2xl sm:h-48 sm:w-48">
          <svg viewBox="0 0 52 52" className="check-draw h-24 w-24 sm:h-32 sm:w-32" aria-hidden="true">
            <path
              fill="none"
              stroke="oklch(0.55 0.17 155)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27l8 8 16-18"
            />
          </svg>
        </div>
        <p className="animate-pop mt-6 text-4xl font-extrabold tracking-tight text-white drop-shadow sm:text-5xl">
          PRESENSI BERHASIL
        </p>
        <p className="animate-pop mt-2 text-xl font-semibold text-white/95 sm:text-2xl" style={{ animationDelay: "0.12s" }}>
          {result.nama}
        </p>
        <p className="text-base text-white/85 sm:text-lg">{result.kelas} &middot; No. {result.nomor}</p>
        <p className="mt-4 text-xs uppercase tracking-widest text-white/70">Ketuk untuk menutup</p>
      </div>
    </div>
  )
}

export function VerifySubmenu({ event }: { event: string }) {
  const [scanning, setScanning] = useState(false)
  const [manual, setManual] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const submit = useCallback(
    (raw: string) => {
      // Accept both raw 16-digit codes and JSON QR payloads {e,c}.
      let code = raw
      try {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.c === "string") code = parsed.c
      } catch {
        /* not JSON, treat as raw code */
      }
      startTransition(async () => {
        const res = await verifyCode(event, code)
        if (!res.ok) {
          setResult({ kind: "error", message: res.error ?? "Gagal memverifikasi." })
          return
        }
        setResult({
          kind: res.already ? "already" : "success",
          nama: res.nama!,
          kelas: res.kelas!,
          nomor: res.nomor!,
        })
        // Notifikasi besar HANYA untuk presensi baru yang berhasil
        if (!res.already) setShowOverlay(true)
        setManual("")
        router.refresh()
      })
    },
    [event, router],
  )

  const onScan = useCallback(
    (text: string) => {
      submit(text)
    },
    [submit],
  )

  return (
    <div className="grid gap-4">
      {showOverlay && result && result.kind === "success" ? (
        <SuccessOverlay result={result} onDone={() => setShowOverlay(false)} />
      ) : null}

      <button
        onClick={() => setScanning((s) => !s)}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.05] px-4 py-3 text-base font-semibold text-foreground transition hover:bg-white/10"
      >
        {scanning ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        {scanning ? "Matikan Kamera" : "Scan dengan Kamera"}
      </button>

      <QrScanner active={scanning} onResult={onScan} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/15" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">atau input manual</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit(manual)
        }}
        className="grid gap-3"
      >
        <input
          inputMode="numeric"
          value={manual}
          onChange={(e) => setManual(e.target.value.replace(/\D/g, "").slice(0, 16))}
          placeholder="Masukkan 16 digit kode unik"
          className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-foreground outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/40"
        />
        <GradientButton type="submit" disabled={pending || manual.length !== 16}>
          <ScanLine className="h-5 w-5" /> {pending ? "Memverifikasi..." : "Verifikasi Kode"}
        </GradientButton>
      </form>

      {result ? (
        <div
          className={
            "animate-banner-pop relative overflow-hidden rounded-3xl border px-5 py-5 text-base sm:px-6 sm:py-6 " +
            (result.kind === "success"
              ? "border-emerald-400/50 bg-emerald-400/15 shadow-[0_0_40px_-8px_rgba(52,211,153,0.5)]"
              : result.kind === "already"
                ? "border-[var(--gold)]/40 bg-[var(--gold)]/15"
                : "border-destructive/40 bg-destructive/15")
          }
        >
          {result.kind === "success" ? (
            <>
              {/* Confetti sederhana */}
              {[12, 28, 44, 60, 76, 88].map((left, i) => (
                <span
                  key={i}
                  className="confetti-piece"
                  style={{
                    left: `${left}%`,
                    background: ["#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#38bdf8", "#facc15"][i],
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
              <div className="flex items-center gap-4">
                <div className="pulse-success flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-400/25">
                  <CheckCircle2 className="h-10 w-10 text-emerald-300" />
                </div>
                <div className="text-foreground">
                  <p className="text-2xl font-extrabold leading-tight text-emerald-300 sm:text-3xl">Presensi Berhasil! ✅</p>
                  <p className="mt-1 text-lg font-semibold text-foreground/90">
                    {result.nama} &mdash; {result.kelas} No. {result.nomor}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-3">
              {result.kind === "already" ? (
                <Info className="mt-0.5 h-8 w-8 shrink-0 text-[var(--gold)]" />
              ) : (
                <XCircle className="mt-0.5 h-8 w-8 shrink-0 text-destructive" />
              )}
              <div className="text-foreground">
                {result.kind === "error" ? (
                  <p className="text-lg font-semibold">{result.message}</p>
                ) : (
                  <>
                    <p className="text-xl font-bold">Sudah terverifikasi sebelumnya</p>
                    <p className="mt-0.5 text-base text-foreground/80">
                      {result.nama} &mdash; {result.kelas} No. {result.nomor}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
