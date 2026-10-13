"use client"

import { useState } from "react"
import { History, Search, Download, ArrowLeft } from "lucide-react"
import type { ActivityRow } from "@/lib/queries"

const ACTION_LABELS: Record<string, string> = {
  verify: "Verifikasi kehadiran",
  unverify: "Batalkan kehadiran",
  "reset-password": "Reset password peserta",
  "rename-participant": "Ganti nama peserta",
  "change-password": "Ganti password",
  create: "Buat akun",
  delete: "Hapus akun",
}

/** Warna aksen per jenis aksi agar mudah dipindai matanya. */
function accent(action: string) {
  if (action === "verify") return "var(--gold)"
  if (action === "unverify") return "#f87171"
  if (action.includes("password")) return "var(--blue)"
  return "var(--purple)"
}

function fmtTime(d: Date | string) {
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Daftar aktivitas dengan pencarian + export CSV.
 * Dipakai di beranda (compact, max 6 baris) dan halaman /riwayat (semua).
 */
export function ActivityList({
  rows,
  compact = false,
}: {
  rows: ActivityRow[]
  compact?: boolean
}) {
  const [q, setQ] = useState("")

  const filtered = q.trim()
    ? rows.filter((r) =>
        `${r.actor} ${r.action} ${r.detail ?? ""}`.toLowerCase().includes(q.toLowerCase()),
      )
    : rows

  const shown = compact ? filtered.slice(0, 6) : filtered

  const exportCsv = () => {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`
    const head = "Waktu,Pelaku,Aksi,Keterangan"
    const body = rows
      .map((r) => [fmtTime(r.createdAt), r.actor, ACTION_LABELS[r.action] ?? r.action, r.detail ?? ""].map(esc).join(","))
      .join("\n")
    const blob = new Blob(["\ufeff" + head + "\n" + body], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `riwayat-aktivitas-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-6 text-center text-sm text-muted-foreground">
        Belum ada aktivitas tercatat. Riwayat akan terisi otomatis saat scan & kelola akun dimulai.
      </p>
    )
  }

  return (
    <div>
      {!compact && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari pelaku / aksi / keterangan…"
              className="w-full rounded-xl border border-[var(--line)] bg-white/[0.05] py-2 pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-[var(--gold)]/60"
            />
          </label>
          <button
            onClick={exportCsv}
            className="lift inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[var(--line)] bg-white/[0.05] px-3 py-2 text-xs font-semibold text-foreground transition hover:border-[var(--gold)]/50 hover:bg-white/10 active:scale-95"
          >
            <Download className="h-3.5 w-3.5 text-[var(--gold)]" /> Export CSV
          </button>
        </div>
      )}

      <ul className="grid gap-1.5">
        {shown.map((a, i) => (
          <li
            key={a.id}
            style={{ animationDelay: compact ? `${i * 0.04}s` : undefined }}
            className={"flex items-baseline justify-between gap-3 rounded-xl bg-white/[0.04] px-3 py-2 text-xs transition-colors hover:bg-white/[0.07] " + (compact ? "animate-rise" : "")}
          >
            <span className="min-w-0 flex-1">
              <span className="mr-2 inline-block h-2 w-2 shrink-0 translate-y-px rounded-full" style={{ background: accent(a.action) }} aria-hidden="true" />
              <b className="font-semibold text-foreground">{a.actor}</b>
              <span className="mx-1.5 text-muted-foreground">·</span>
              <span className="text-muted-foreground">{ACTION_LABELS[a.action] ?? a.action.replace(/-/g, " ")}</span>
              {a.detail && <span className="ml-1.5 break-words text-foreground/70">({a.detail})</span>}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground/80">{fmtTime(a.createdAt)}</span>
          </li>
        ))}
      </ul>

      {!compact && filtered.length !== rows.length && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Menampilkan {filtered.length} dari {rows.length} aktivitas
        </p>
      )}
      {!compact && rows.length >= 1000 && (
        <p className="mt-2 text-center text-[11px] text-muted-foreground/70">
          Menampilkan 1000 aktivitas terbaru dari log.
        </p>
      )}
    </div>
  )
}

/** Header kecil utk halaman /riwayat */
export function ActivityPageHeader({ onBack }: { onBack?: () => void }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--line)] bg-white/[0.05] text-foreground/80 transition hover:-translate-x-0.5 hover:border-[var(--gold)]/50 active:scale-95"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
          <History className="h-5 w-5 text-[var(--purple)]" /> Riwayat Aktivitas
        </p>
        <p className="text-xs text-muted-foreground">Semua kejadian sistem terekap di sini — scan, undo, reset, kelola akun.</p>
      </div>
    </div>
  )
}
