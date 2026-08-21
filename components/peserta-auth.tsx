"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, UserPlus, LogIn, KeyRound } from "lucide-react"
import { GlassCard, TextField, SelectField, GradientButton } from "./ui-kit"
import { KELAS_OPTIONS, NOMOR_PRESENSI_OPTIONS } from "@/lib/constants"
import {
  signUpParticipant,
  loginParticipant,
  resetPasswordWithKode,
} from "@/app/actions/participant"

type Mode = "choice" | "signup" | "login" | "reset"

export function PesertaAuth({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>("choice")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function handle(action: (fd: FormData) => Promise<{ ok: boolean; error?: string }>, form: HTMLFormElement, onOk?: () => void) {
    setError(null)
    setNotice(null)
    const fd = new FormData(form)
    startTransition(async () => {
      const res = await action(fd)
      if (res.ok) {
        if (onOk) onOk()
        else router.refresh()
      } else {
        setError(res.error ?? "Terjadi kesalahan.")
      }
    })
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <button
        onClick={() => (mode === "choice" ? onBack() : setMode("choice"))}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground/70 transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <GlassCard>
        <div className="mb-5 text-center">
          <h2 className="font-serif text-2xl font-semibold text-foreground">Peserta</h2>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-foreground">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="mb-4 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/15 px-3 py-2 text-sm text-foreground">
            {notice}
          </p>
        ) : null}

        {mode === "choice" && (
          <div className="grid gap-3">
            <GradientButton onClick={() => setMode("signup")}>
              <UserPlus className="h-5 w-5" /> Sign In (Daftar Akun)
            </GradientButton>
            <button
              onClick={() => setMode("login")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.05] px-5 py-3 text-base font-semibold text-foreground transition hover:bg-white/10"
            >
              <LogIn className="h-5 w-5" /> Log In (Masuk)
            </button>
          </div>
        )}

        {mode === "signup" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handle(signUpParticipant, e.currentTarget)
            }}
            className="grid gap-4"
          >
            <p className="text-center text-sm font-medium text-foreground/80">Identitas</p>
            <TextField
              label="Nama Lengkap"
              name="nama"
              required
              autoComplete="off"
              placeholder="NAMA LENGKAP"
              style={{ textTransform: "uppercase" }}
              onChange={(e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase()
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Kelas" name="kelas" required defaultValue="">
                <option value="" disabled>
                  Pilih
                </option>
                {KELAS_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </SelectField>
              <SelectField label="No. Presensi" name="nomorPresensi" required defaultValue="">
                <option value="" disabled>
                  Pilih
                </option>
                {NOMOR_PRESENSI_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField label="Password" name="password" type="password" required placeholder="Buat password" />
            <TextField
              label="Kode Unik"
              name="kodeUnik"
              required
              placeholder="Untuk reset password"
              hint="Simpan baik-baik. Kode ini dipakai untuk reset password jika lupa."
            />
            <GradientButton type="submit" disabled={pending}>
              {pending ? "Mendaftar..." : "Daftar & Masuk"}
            </GradientButton>
          </form>
        )}

        {mode === "login" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handle(loginParticipant, e.currentTarget)
            }}
            className="grid gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Kelas" name="kelas" required defaultValue="">
                <option value="" disabled>
                  Pilih
                </option>
                {KELAS_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </SelectField>
              <SelectField label="No. Presensi" name="nomorPresensi" required defaultValue="">
                <option value="" disabled>
                  Pilih
                </option>
                {NOMOR_PRESENSI_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField label="Password" name="password" type="password" required placeholder="Masukkan password" />
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="-mt-1 text-left text-xs text-muted-foreground/70 underline decoration-dotted underline-offset-4 transition hover:text-foreground/70"
            >
              Lupa password? Reset di sini memakai kode unik yang kamu buat saat daftar.
            </button>
            <GradientButton type="submit" disabled={pending}>
              {pending ? "Masuk..." : "Log In"}
            </GradientButton>
          </form>
        )}

        {mode === "reset" && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget
              handle(resetPasswordWithKode, form, () => {
                setNotice("Password berhasil direset. Silakan login dengan password baru.")
                setMode("login")
              })
            }}
            className="grid gap-4"
          >
            <p className="flex items-center justify-center gap-2 text-center text-sm font-medium text-foreground/80">
              <KeyRound className="h-4 w-4" /> Reset Password
            </p>
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Kelas" name="kelas" required defaultValue="">
                <option value="" disabled>
                  Pilih
                </option>
                {KELAS_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </SelectField>
              <SelectField label="No. Presensi" name="nomorPresensi" required defaultValue="">
                <option value="" disabled>
                  Pilih
                </option>
                {NOMOR_PRESENSI_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField label="Kode Unik" name="kodeUnik" required placeholder="Kode unik saat daftar" />
            <TextField label="Password Baru" name="newPassword" type="password" required placeholder="Password baru" />
            <GradientButton type="submit" disabled={pending}>
              {pending ? "Memproses..." : "Reset Password"}
            </GradientButton>
          </form>
        )}
      </GlassCard>
    </div>
  )
}
