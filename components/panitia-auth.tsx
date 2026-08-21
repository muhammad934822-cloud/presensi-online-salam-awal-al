"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShieldCheck } from "lucide-react"
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
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground/70 transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <GlassCard>
        <div className="mb-5 text-center">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] text-white">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h2 className="font-serif text-2xl font-semibold text-foreground">Panitia</h2>
          <p className="mt-1 text-sm text-muted-foreground">Masukkan password untuk mengakses dashboard.</p>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-foreground">
            {error}
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
          <TextField label="Password Panitia" name="password" type="password" required placeholder="Password" />
          <GradientButton type="submit" disabled={pending}>
            {pending ? "Memeriksa..." : "Masuk Dashboard"}
          </GradientButton>
        </form>
      </GlassCard>
    </div>
  )
}
