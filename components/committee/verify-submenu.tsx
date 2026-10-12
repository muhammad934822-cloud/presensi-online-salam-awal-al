"use client"

import { useCallback, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, CameraOff, ScanLine, CheckCircle2, XCircle, Info } from "lucide-react"
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
            "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm " +
            (result.kind === "success"
              ? "border-emerald-400/40 bg-emerald-400/15"
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
                  {result.kind === "already" ? "Sudah terverifikasi sebelumnya" : "Presensi berhasil!"}
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
