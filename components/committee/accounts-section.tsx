"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Users, AlertTriangle } from "lucide-react"
import type { AccountRow } from "@/lib/queries"
import { isActiveNow, timeAgo } from "@/lib/time"
import { deleteParticipant } from "@/app/actions/committee"

export function AccountsSection({ accounts }: { accounts: AccountRow[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function remove(id: string) {
    startTransition(async () => {
      await deleteParticipant(id)
      setConfirmId(null)
      router.refresh()
    })
  }

  return (
    <section className="mt-4">
      <div className="mb-3 flex items-center gap-2 px-1">
        <Users className="h-5 w-5 text-[var(--gold)]" />
        <h3 className="font-serif text-lg font-semibold text-foreground">Tinjau Akun Peserta Aktif</h3>
      </div>
      <p className="mb-3 px-1 text-xs text-muted-foreground">
        Total {accounts.length} akun. Hapus akun yang bermasalah bila diperlukan.
      </p>

      {accounts.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-muted-foreground">
          Belum ada akun peserta terdaftar.
        </p>
      ) : (
        <ul className="grid gap-2">
          {accounts.map((a) => {
            const active = isActiveNow(a.lastActiveAt)
            return (
              <li
                key={a.id}
                className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3"
              >
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xs font-semibold text-foreground">
                  {a.nomorPresensi}
                  <span
                    className={
                      "absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--background)] " +
                      (active ? "bg-emerald-400" : "bg-zinc-500")
                    }
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{a.nama}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.kelas} &middot;{" "}
                    {active ? (
                      <span className="text-emerald-300">Aktif sekarang</span>
                    ) : (
                      <span>Tidak aktif sejak {timeAgo(a.lastActiveAt)}</span>
                    )}
                  </p>
                </div>

                {confirmId === a.id ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => remove(a.id)}
                      disabled={pending}
                      className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-destructive px-2.5 py-1.5 text-xs font-semibold text-white transition disabled:opacity-60"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" /> Hapus
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="inline-flex min-h-9 items-center rounded-xl border border-white/20 px-2.5 py-1.5 text-xs text-foreground"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(a.id)}
                    aria-label={`Hapus akun ${a.nama}`}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] text-foreground/70 transition hover:border-destructive/50 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
