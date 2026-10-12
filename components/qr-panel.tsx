"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { CheckCircle2, Clock, Copy, Check, Loader2 } from "lucide-react"
import { markQrShown } from "@/app/actions/participant"
import { formatDateTime } from "@/lib/time"

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
      {verified ? (
        <div className="pulse-success flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2.5 text-sm font-semibold text-foreground">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" />
          <span>
            Sudah presensi
            {verifiedAt ? (
              <span className="ml-1 font-normal text-emerald-200/80">
                &middot; {formatDateTime(verifiedAt)}
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
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl || "/placeholder.svg"} alt={`QR Code ${label}`} className="h-56 w-56" />
          ) : (
            <div className="flex h-56 w-56 items-center justify-center gap-2 text-sm text-black/50">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat QR...
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
