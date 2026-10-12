"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShieldCheck, KeyRound, Loader2 } from "lucide-react"
import { GlassCard, TextField, GradientButton } from "./ui-kit"
import { loginCommittee } from "@/app/actions/committee"

export function PanitiaAuth({ onBack }: { onBack: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto w-full max-w-md">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground/70 transition hover:-translate-x-0.5 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <GlassCard glow className="animate-pop">
        <div className="mb-5 text-center">
          <span className="relative mx-auto mb-4 inline-block">
            <span className="conic-ring absolute -inset-1.5 rounded-3xl opacity-60 blur-[3px]" aria-hidden="true" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--gold),var(--purple)_60%,var(--blue))] text-white shadow-xl shadow-[var(--purple)]/30">
              <ShieldCheck className="h-8 w-8" />
            </span>
          </span>
          <h2 className="font-serif text-2xl font-semibold text-foreground">Ruang Panitia</h2>
          <p className="mt-1 text-sm text-muted-foreground">Masukkan password untuk mengakses dashboard verifikasi.</p>
        </div>

        {error ? (
          <p role="alert" className="animate-pop mb-4 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-foreground">
            <KeyRound className="h-4 w-4 shrink-0 text-destructive" /> {error}
          </p>
        ) : null}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            const fd = new FormData(e.currentTarget)
            startTransition(async () => {
              const res = await loginCommittee(fd)
              if (res.ok) router.refresh()
              else setError(res.error ?? "Password salah.")
            })
          }}
          className="grid gap-4"
        >
          <TextField
            label="Password Panitia"
            name="password"
            type="password"
            required
            autoFocus
            placeholder="••••••••••••"
            icon={<KeyRound />}
          />
          <GradientButton type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Memeriksa...
              </>
            ) : (
              <>
                <ShieldCheck className="h-5 w-5" /> Masuk Dashboard
              </>
            )}
          </GradientButton>
        </form>
      </GlassCard>
    </div>
  )
}
