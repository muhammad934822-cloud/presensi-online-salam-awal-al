"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, CameraOff, ScanLine, CheckCircle2, XCircle, Info, Loader2 } from "lucide-react"
import { QrScanner } from "@/components/qr-scanner"
import { GradientButton } from "@/components/ui-kit"
import { verifyCode } from "@/app/actions/committee"

type Result =
  | { kind: "success"; nama: string; kelas: string; nomor: number }
  | { kind: "already"; nama: string; kelas: string; nomor: number }
  | { kind: "error"; message: string }

export function VerifySubmenu({ event }: { event: string }) {
  const [scanning, setScanning] = useState(false)
  const [manual, setManual] = useState("")
  const [result, setResult] = useState<Result | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  // Stabilkan referensi onResult agar kamera tidak restart tiap render
  // (fungsi baru per-render memicu efek scanner -> loop hidup/matikan kamera).
  const submitRef = useRef<(raw: string) => void>(() => {})

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
        setManual("")
        router.refresh()
      })
    },
    [event, router],
  )

  useEffect(() => {
    submitRef.current = submit
  }, [submit])

  const onResult = useCallback((text: string) => submitRef.current(text), [])

  return (
    <div className="grid gap-4">
      <button
        onClick={() => setScanning((s) => !s)}
        className={
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-base font-semibold transition-all duration-200 active:scale-[0.98] " +
          (scanning
            ? "border-destructive/50 bg-destructive/15 text-foreground hover:bg-destructive/25"
            : "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-foreground hover:bg-[var(--gold)]/20")
        }
      >
        {scanning ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5 text-[var(--gold)]" />}
        {scanning ? "Matikan Kamera" : "Scan dengan Kamera"}
      </button>

      {scanning && <QrScanner active={scanning} onResult={onResult} />}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">atau input manual</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
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
          aria-label="Kode unik 16 digit"
          className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-center font-mono text-lg tracking-[0.2em] text-foreground outline-none transition-all placeholder:text-sm placeholder:tracking-normal placeholder:text-muted-foreground focus:border-[var(--gold)] focus:bg-white/[0.09] focus:ring-2 focus:ring-[var(--gold)]/40"
        />
        {/* Digit progress indicator */}
        <div className="mx-auto flex gap-1" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className={
                "h-1 w-10 rounded-full transition-colors duration-300 " +
                (manual.length >= (i + 1) * 4 ? "bg-[var(--gold)]" : "bg-white/10")
              }
            />
          ))}
        </div>
        <GradientButton type="submit" disabled={pending || manual.length !== 16}>
          {pending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Memverifikasi...
            </>
          ) : (
            <>
              <ScanLine className="h-5 w-5" /> Verifikasi Kode ({manual.length}/16)
            </>
          )}
        </GradientButton>
      </form>

      {result ? (
        <div
          className={
            "animate-pop flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm " +
            (result.kind === "success"
              ? "pulse-success border-emerald-400/40 bg-emerald-400/15"
              : result.kind === "already"
                ? "border-[var(--gold)]/40 bg-[var(--gold)]/15"
                : "border-destructive/40 bg-destructive/15")
          }
        >
          {result.kind === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          ) : result.kind === "already" ? (
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--gold)]" />
          ) : (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          )}
          <div className="text-foreground">
            {result.kind === "error" ? (
              result.message
            ) : (
              <>
                <p className="font-semibold">
                  {result.kind === "already" ? "Sudah terverifikasi sebelumnya" : "Presensi berhasil! 🎉"}
                </p>
                <p className="text-foreground/80">
                  {result.nama} &mdash; {result.kelas} No. {result.nomor}
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
