"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { CheckCircle2, Clock } from "lucide-react"
import { markQrShown } from "@/app/actions/participant"

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

  return (
    <div className="grid gap-4">
      {verified ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-foreground">
          <CheckCircle2 className="h-5 w-5 text-emerald-300" /> Sudah presensi &mdash; {label}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/[0.05] px-4 py-2 text-sm text-foreground/80">
          <Clock className="h-4 w-4 text-[var(--gold)]" /> Menunggu verifikasi panitia
        </div>
      )}

      <div className="mx-auto rounded-3xl bg-white p-4 shadow-xl">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl || "/placeholder.svg"} alt={`QR Code ${label}`} className="h-56 w-56" />
        ) : (
          <div className="flex h-56 w-56 items-center justify-center text-sm text-black/50">Memuat QR...</div>
        )}
      </div>

      <div className="text-center">
        <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">16 Digit Kode Unik</p>
        <p className="font-mono text-xl font-semibold tracking-[0.15em] text-foreground">{grouped}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Tunjukkan QR atau bacakan kode ini kepada panitia untuk diverifikasi.
        </p>
      </div>
    </div>
  )
}
