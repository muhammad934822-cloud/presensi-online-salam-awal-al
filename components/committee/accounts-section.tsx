"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Users, AlertTriangle, RotateCcw, FlaskConical } from "lucide-react"
import type { AccountRow } from "@/lib/queries"
import { isActiveNow, timeAgo } from "@/lib/time"
import { deleteParticipant } from "@/app/actions/committee"
import { PasswordResetButton } from "./password-reset-button"

export function AccountsSection({
  accounts,
  onUjicoba,
}: {
  accounts: AccountRow[]
  /** Opsional: buka mode Ujicoba akun ini (simulasi tampilan peserta) */
  onUjicoba?: (a: AccountRow) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function remove(id: string) {
    startTransition(async () => {
      await deleteParticipant(id)
      setConfirmId(null)
      router.refresh()
    })
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? accounts.filter(
        (a) => a.nama.toLowerCase().includes(q) || a.kelas.toLowerCase().includes(q) || String(a.nomorPresensi) === q,
      )
    : accounts

  return (
    <section className="mt-1">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Users className="h-5 w-5 text-[var(--gold)]" />
        <h3 className="font-serif text-lg font-semibold text-foreground">Daftar Akun Peserta</h3>
        <span className="ml-auto rounded-full border border-[var(--line)] bg-white/[0.05] px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">
          {accounts.length} akun
        </span>
      </div>

      {/* Pencarian */}
      <div className="relative mb-3">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama, kelas, atau nomor presensi…"
          className="w-full rounded-2xl border border-[var(--line)] bg-white/[0.06] py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30"
        />
      </div>

      <p className="mb-3 px-1 text-xs leading-relaxed text-muted-foreground">
        <RotateCcw className="mr-1 inline h-3.5 w-3.5 text-[var(--blue)]" /> Tombol reset mengganti password peserta
        menjadi <b className="text-foreground">12345678</b>. Peserta disarankan menggantinya lagi setelah login. Hapus hanya akun yang bermasalah — data presensinya ikut terhapus.
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center">
          <Users className="h-8 w-8 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            {accounts.length === 0 ? "Belum ada akun peserta terdaftar." : "Tidak ada peserta yang cocok dengan pencarian."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-2">
          {filtered.map((a, i) => {
            const active = isActiveNow(a.lastActiveAt)
            return (
              <li
                key={a.id}
                style={{ animationDelay: `${Math.min(i, 12) * 0.04}s` }}
                className="lift animate-rise flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[var(--line)] bg-white/[0.05] px-4 py-3"
              >
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-foreground">
                  {a.nomorPresensi}
                  <span
                    className={
                      "absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--background)] " +
                      (active ? "pulse-dot bg-emerald-400 shadow-[0_0_8px_2px_rgba(52,211,153,0.5)]" : "bg-zinc-500")
                    }
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-medium leading-snug text-foreground">{a.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.kelas} &middot;{" "}
                    {active ? (
                      <span className="text-emerald-300">Aktif sekarang</span>
                    ) : (
                      <span>Tidak aktif sejak {timeAgo(a.lastActiveAt)}</span>
                    )}
                  </p>
                </div>

                {/* Grup aksi: turun rapi ke baris baru jika nama panjang */}
                <span className="ml-auto flex shrink-0 items-center gap-1.5 lg:ml-0">
                  {onUjicoba && (
                    <button
                      onClick={() => onUjicoba(a)}
                      title={`Ujicoba tampilan akun ${a.nama}`}
                      aria-label={`Ujicoba tampilan akun ${a.nama}`}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-white/[0.04] text-foreground/70 transition hover:border-[var(--purple)]/60 hover:text-[var(--purple)] active:scale-95"
                    >
                      <FlaskConical className="h-4 w-4" />
                    </button>
                  )}
                  <PasswordResetButton account={a} />

                  {confirmId === a.id ? (
                    <span className="flex items-center gap-1.5">
                    <button
                      onClick={() => remove(a.id)}
                      disabled={pending}
                      className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-destructive px-2.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Hapus
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="inline-flex min-h-9 items-center rounded-xl border border-[var(--line)] px-2.5 py-1.5 text-xs text-foreground transition hover:bg-white/10"
                    >
                      Batal
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmId(a.id)}
                    aria-label={`Hapus akun ${a.nama}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-white/[0.04] text-foreground/70 transition hover:border-destructive/50 hover:text-destructive active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
