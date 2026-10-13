"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { CheckCircle2, Clock, Copy, Check, Loader2, PartyPopper } from "lucide-react"
import { markQrShown } from "@/app/actions/participant"
import { formatDateTime } from "@/lib/time"

const CONFETTI_COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#c084fc", "#fb7185", "#4ade80"]

/* Hujan confetti kecil di dalam kartu sukses */
function ConfettiRain() {
  const pieces = Array.from({ length: 14 })
  return (
    <span aria-hidden className="confetti-rain pointer-events-none absolute inset-0 overflow-hidden rounded-[calc(2rem-3px)]">
      {pieces.map((_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 7 + 4) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 7) * 0.12}s`,
          }}
        />
      ))}
    </span>
  )
}

export function QrPanel({
  event,
  label,
  code,
  verifiedAt,
}: {
  event: string
  label: string
  code: string
  verifiedAt: Date | string | null
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const prevVerified = useRef<boolean | null>(null)
  const [justVerified, setJustVerified] = useState(false)

  // Deteksi transisi belum-hadir -> hadir: tampilkan selebrasi halus sejenak
  useEffect(() => {
    const v = Boolean(verifiedAt)
    if (prevVerified.current === false && v) {
      setJustVerified(true)
      const t = window.setTimeout(() => setJustVerified(false), 3200)
      prevVerified.current = v
      return () => window.clearTimeout(t)
    }
    prevVerified.current = v
  }, [verifiedAt])

  useEffect(() => {
    // QR payload encodes event + code so a scan resolves unambiguously.
    const payload = JSON.stringify({ e: event, c: code })
    QRCode.toDataURL(payload, {
      width: 480,
      margin: 1,
      color: { dark: "#1a1330", light: "#ffffff" },
    }).then(setDataUrl)
    // Record that the participant has displayed their QR for this event.
    markQrShown(event)
  }, [event, code])

  const grouped = code.replace(/(\d{4})(?=\d)/g, "$1 ")
  const verified = Boolean(verifiedAt)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="grid gap-4">
      {/* Overlay selebrasi halus saat baru saja tervalidasi */}
      {justVerified && (
        <div
          role="status"
          aria-live="polite"
          className="animate-banner-pop pointer-events-none relative z-10 -mx-2 -mt-2 overflow-hidden rounded-3xl border border-emerald-400/50 bg-[linear-gradient(120deg,oklch(0.3_0.06_160),oklch(0.24_0.05_170))] px-4 py-4 text-center shadow-xl shadow-emerald-500/20"
        >
          <ConfettiRain />
          <span className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
            <CheckCircle2 className="h-9 w-9 text-emerald-300" />
          </span>
          <p className="text-lg font-extrabold tracking-tight text-emerald-200">Presensi Berhasil!</p>
          <p className="mt-0.5 text-xs text-emerald-100/80">Kehadiranmu di {label} sudah tercatat</p>
        </div>
      )}

      {verified ? (
        <div className="pulse-success relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-3 text-sm font-semibold text-foreground">
          <PartyPopper className="h-5 w-5 shrink-0 text-[var(--gold)]" aria-hidden="true" />
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
          <span>
            Hadir — Alhamdulillah, presensimu tercatat
            {verifiedAt ? (
              <span className="ml-1 block text-xs font-normal text-emerald-200/80">
                {formatDateTime(verifiedAt)}
              </span>
            ) : null}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-2.5 text-sm text-foreground/90">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-soft-ping absolute inline-flex h-full w-full rounded-full bg-[var(--gold)]" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
          </span>
          <Clock className="h-4 w-4 text-[var(--gold)]" /> Menunggu verifikasi panitia…
        </div>
      )}

      {/* QR framed by animated conic ring */}
      <div className="relative mx-auto rounded-[2rem] p-[3px]">
        {!verified && <span className="conic-ring absolute inset-0 rounded-[2rem]" aria-hidden="true" />}
        {verified && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-[2rem] bg-[linear-gradient(135deg,oklch(0.75_0.16_160),var(--gold))]"
          />
        )}
        <div className="sheen-host relative mx-auto rounded-[calc(2rem-3px)] bg-white p-4 shadow-xl">
          {verified && justVerified && <ConfettiRain />}
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl || "/placeholder.svg"} alt={`QR Code ${label}`} className="h-56 w-56" />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center gap-2 text-sm text-black/50">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat QR...
            </div>
          )}
          {/* Stempel centang besar di atas QR saat sudah hadir */}
          {verified && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="animate-stamp flex h-32 w-32 -rotate-12 items-center justify-center rounded-full border-[6px] border-emerald-500/80 bg-emerald-50/90 shadow-2xl backdrop-blur-[1px]">
                <CheckCircle2 className="h-20 w-20 text-emerald-600" />
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">16 Digit Kode Unik</p>
        <button
          type="button"
          onClick={copyCode}
          title="Salin kode"
          className="group/code mx-auto inline-flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-white/5"
        >
          <p className="font-mono text-xl font-semibold tracking-[0.15em] text-foreground">{grouped}</p>
          {copied ? (
            <Check className="h-4 w-4 text-emerald-300" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover/code:opacity-100" />
          )}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Tunjukkan QR atau bacakan kode ini kepada panitia untuk diverifikasi.
        </p>
      </div>
    </div>
  )
}
