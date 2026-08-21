"use client"

import { Download, CheckCircle2, Clock } from "lucide-react"
import type { RecapRow } from "@/lib/queries"
import { formatDateTime } from "@/lib/time"

export function RecapSubmenu({
  rows,
  eventLabel,
}: {
  rows: RecapRow[]
  eventLabel: string
}) {
  function exportCsv() {
    const header = ["Nama", "Kelas", "No Presensi", "QR Ditampilkan", "Status Presensi", "Waktu Verifikasi"]
    const lines = rows.map((r) => {
      const cells = [
        r.nama,
        r.kelas,
        String(r.nomorPresensi),
        r.qrShownAt ? formatDateTime(r.qrShownAt) : "-",
        r.verifiedAt ? "Hadir" : "Belum",
        r.verifiedAt ? formatDateTime(r.verifiedAt) : "-",
      ]
      return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    })
    const csv = [header.join(","), ...lines].join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rekap-${eventLabel.toLowerCase().replace(/\s+/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const hadir = rows.filter((r) => r.verifiedAt).length

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{rows.length}</span> menampilkan QR &middot;{" "}
          <span className="font-semibold text-emerald-300">{hadir}</span> hadir
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.05] px-3 py-2 text-sm font-medium text-foreground transition hover:bg-white/10 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Cetak CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-muted-foreground">
          Belum ada peserta yang menampilkan QR untuk menu ini.
        </p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((r) => (
            <li
              key={r.participantId}
              className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-foreground">
                {r.nomorPresensi}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.nama}</p>
                <p className="text-xs text-muted-foreground">{r.kelas}</p>
              </div>
              {r.verifiedAt ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Hadir
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-medium text-foreground/70">
                  <Clock className="h-3.5 w-3.5" /> Belum
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
