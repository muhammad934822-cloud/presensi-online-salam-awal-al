"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { SwitchCamera, CameraOff, ScanLine } from "lucide-react"

export function QrScanner({
  active,
  onResult,
}: {
  active: boolean
  onResult: (text: string) => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [facing, setFacing] = useState<"environment" | "user">("environment")
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const lastResultRef = useRef<{ text: string; at: number } | null>(null)

  useEffect(() => {
    if (!active) {
      controlsRef.current?.stop()
      controlsRef.current = null
      return
    }

    let cancelled = false
    const reader = new BrowserMultiFormatReader()
    setError(null)
    setStarted(false)

    reader
      .decodeFromConstraints(
        { video: { facingMode: facing } },
        videoRef.current!,
        (result) => {
          if (cancelled || !result) return
          const text = result.getText()
          const now = Date.now()
          // Debounce identical scans within 2.5s
          if (lastResultRef.current && lastResultRef.current.text === text && now - lastResultRef.current.at < 2500) return
          lastResultRef.current = { text, at: now }
          onResult(text)
        },
      )
      .then((controls) => {
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
        setStarted(true)
      })
      .catch((err) => {
        setError(
          err?.name === "NotAllowedError"
            ? "Akses kamera ditolak. Izinkan kamera untuk memindai."
            : "Kamera tidak tersedia di perangkat ini.",
        )
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [active, facing, onResult])

  if (!active) return null

  return (
    <div className="grid gap-3">
      <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-3xl border border-white/20 bg-black shadow-2xl shadow-[var(--purple)]/20">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

        {/* Viewfinder corner brackets + animated scanline */}
        {started && !error && (
          <>
            <span className="pointer-events-none absolute left-6 top-6 h-9 w-9 rounded-tl-xl border-l-2 border-t-2 border-[var(--gold)]" />
            <span className="pointer-events-none absolute right-6 top-6 h-9 w-9 rounded-tr-xl border-r-2 border-t-2 border-[var(--gold)]" />
            <span className="pointer-events-none absolute bottom-6 left-6 h-9 w-9 rounded-bl-xl border-b-2 border-l-2 border-[var(--gold)]" />
            <span className="pointer-events-none absolute bottom-6 right-6 h-9 w-9 rounded-br-xl border-b-2 border-r-2 border-[var(--gold)]" />
            <span className="scanline" />
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-red-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              Live scan
            </span>
          </>
        )}

        {!started && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 animate-pulse text-[var(--gold)]" /> Menyalakan kamera...
            </span>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-4 text-center text-sm text-white">
            <CameraOff className="h-6 w-6 text-destructive" /> {error}
          </div>
        ) : null}
      </div>

      <button
        onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
        className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.05] px-4 py-2 text-sm text-foreground transition hover:-translate-y-px hover:bg-white/10 active:scale-[0.98]"
      >
        <SwitchCamera className="h-4 w-4 text-[var(--gold)]" />
        Kamera {facing === "environment" ? "Belakang" : "Depan"} (ketuk untuk ganti)
      </button>
    </div>
  )
}
