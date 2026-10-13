"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { KeyRound, CheckCircle2, AlertTriangle, Loader2, RotateCcw } from "lucide-react"
import type { AccountRow } from "@/lib/queries"
import { resetParticipantPassword } from "@/app/actions/committee"

/** Reset password peserta menjadi 12345678 oleh panitia — wajib konfirmasi kode unik peserta. */
export function PasswordResetButton({ account }: { account: AccountRow }) {
  const [confirm, setConfirm] = useState(false)
  const [kode, setKode] = useState("")
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function reset() {
    setError(null)
    if (kode.trim().length < 4) {
      setError("Masukkan kode unik peserta (min. 4 karakter).")
      return
    }
    startTransition(async () => {
      const res = await resetParticipantPassword(account.id, kode)
      if (res.ok) {
        setDone(true)
        setConfirm(false)
        setKode("")
        router.refresh()
        window.setTimeout(() => setDone(false), 3000)
      } else {
        setError(res.error ?? "Gagal mereset password.")
      }
    })
  }

  if (done) {
    return (
      <span className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 animate-pop">
        <CheckCircle2 className="h-3.5 w-3.5" /> Jadi 12345678
      </span>
    )
  }

  return (
    <span className="relative inline-flex flex-col items-end gap-1">
      {confirm ? (
        <span className="flex flex-col gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-2 shadow-xl backdrop-blur-xl">
          <span className="text-[11px] font-medium leading-snug text-muted-foreground">
            Masukkan <b className="text-foreground">kode unik</b> {account.nama} untuk konfirmasi
          </span>
          <input
            autoFocus
            type="password"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && reset()}
            placeholder="Kode unik saat daftar akun…"
            className="w-44 rounded-xl border border-[var(--line)] bg-white/[0.06] px-3 py-2 text-xs text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/30"
          />
          <span className="flex items-center gap-1.5">
            <button
              onClick={reset}
              disabled={pending || kode.trim().length < 4}
              className="inline-flex min-h-9 flex-1 items-center justify-center gap-1 rounded-xl bg-[linear-gradient(100deg,var(--gold),var(--purple))] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />} Reset
            </button>
            <button
              onClick={() => {
                setConfirm(false)
                setKode("")
                setError(null)
              }}
              className="inline-flex min-h-9 items-center rounded-xl border border-[var(--line)] px-2.5 py-1.5 text-xs text-foreground transition hover:bg-white/10"
            >
              Batal
            </button>
          </span>
        </span>
      ) : (
        <button
          onClick={() => setConfirm(true)}
          aria-label={`Reset password ${account.nama}`}
          title="Reset password menjadi 12345678 (butuh kode unik)"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-white/[0.04] text-foreground/70 transition hover:border-[var(--blue)]/60 hover:text-[var(--blue)] active:scale-95"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
      {error && (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
          <KeyRound className="h-3 w-3" /> {error}
        </span>
      )}
    </span>
  )
}
