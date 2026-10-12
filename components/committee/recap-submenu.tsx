"use client"

import { useMemo, useState } from "react"
import { Download, CheckCircle2, Clock, Search, Users, UserX } from "lucide-react"
import type { RecapRow } from "@/lib/queries"
import { formatDateTime } from "@/lib/time"

export function RecapSubmenu({
  rows,
  eventLabel,
}: {
  rows: RecapRow[]
  eventLabel: string
}) {
  const [query, setQuery] = useState("")

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
  const pct = rows.length ? Math.round((hadir / rows.length) * 100) : 0

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) => r.nama.toLowerCase().includes(q) || r.kelas.toLowerCase().includes(q) || String(r.nomorPresensi) === q,
    )
  }, [rows, query])

  return (
    <div className="grid gap-4">
      {/* Summary panel with animated progress */}
      <div className="rounded-2xl border border-white/12 bg-white/[0.05] p-4">
        <div className="mb-2 flex items-end justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-[var(--gold)]" />
            <span>
              <span className="font-semibold text-foreground">{rows.length}</span> menampilkan QR ·{" "}
              <span className="font-semibold text-emerald-300">{hadir}</span> hadir
            </span>
          </div>
          <span className="text-2xl font-bold tabular-nums text-gradient-gold">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--gold),var(--purple),var(--blue))] transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama / kelas / nomor..."
            aria-label="Cari peserta"
            className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-2.5 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-[var(--gold)] focus:bg-white/[0.09] focus:ring-2 focus:ring-[var(--gold)]/30"
          />
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-sm font-medium text-foreground transition hover:-translate-y-px hover:bg-[var(--gold)]/20 active:scale-[0.98] disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-[var(--gold)]" /> CSV
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center">
          <UserX className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            Belum ada peserta yang menampilkan QR untuk menu ini.
            <br />
            Data akan muncul otomatis saat peserta membuka halaman presensinya.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-muted-foreground">
          Tidak ada peserta yang cocok dengan pencarian “{query}”.
        </p>
      ) : (
        <ul className="grid max-h-80 gap-2 overflow-y-auto pr-1">
          {filtered.map((r) => (
            <li
              key={r.participantId}
              className="lift flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--gold),var(--purple))] text-xs font-bold text-white shadow-md shadow-[var(--purple)]/25">
                {r.nomorPresensi}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.nama}</p>
                <p className="text-xs text-muted-foreground">
                  {r.kelas}
                  {r.verifiedAt ? <span className="ml-1 text-emerald-300/80">· {formatDateTime(r.verifiedAt)}</span> : null}
                </p>
              </div>
              {r.verifiedAt ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1 text-xs font-medium text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Hadir
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-medium text-foreground/70">
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
