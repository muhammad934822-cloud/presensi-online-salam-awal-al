"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { SwitchCamera, CameraOff } from "lucide-react"

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
      <div className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-3xl border border-white/20 bg-black">
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
        <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-[var(--gold)]/80" />
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 p-4 text-center text-sm text-white">
            <CameraOff className="h-6 w-6" /> {error}
          </div>
        ) : null}
      </div>
      <button
        onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
        className="mx-auto inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.05] px-4 py-2 text-sm text-foreground transition hover:bg-white/10"
      >
        <SwitchCamera className="h-4 w-4" />
        Kamera {facing === "environment" ? "Belakang" : "Depan"} (ketuk untuk ganti)
      </button>
    </div>
  )
}
