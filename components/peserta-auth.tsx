"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  UserPlus,
  LogIn,
  KeyRound,
  Loader2,
  Sparkles,
  ChevronRight,
  ShieldQuestion,
  Phone,
  Inbox,
  CheckCircle2,
} from "lucide-react"
import { GlassCard, TextField, SelectField, GradientButton, GhostButton } from "./ui-kit"
import { KELAS_OPTIONS, NOMOR_PRESENSI_OPTIONS } from "@/lib/constants"
import {
  signUpParticipant,
  loginParticipant,
  resetPasswordWithKode,
  requestResetHelp,
  checkResetHelpStatus,
} from "@/app/actions/participant"

type Mode = "choice" | "signup" | "login" | "reset" | "help"

const MODE_TITLES: Record<Mode, { title: string; subtitle: string }> = {
  choice: { title: "Peserta", subtitle: "Pilih aksi untuk melanjutkan" },
  signup: { title: "Daftar Akun", subtitle: "Lengkapi identitas kamu untuk membuat akun presensi" },
  login: { title: "Masuk Akun", subtitle: "Gunakan kelas, nomor presensi, dan password kamu" },
  reset: { title: "Reset Password", subtitle: "Gunakan kode unik yang kamu buat saat mendaftar" },
  help: { title: "Lupa Kode Unik?", subtitle: "Kirim permintaan bantu ke panitia — password akan direset menjadi 12345678" },
}

/** Indikator status permintaan bantu (dipakai ulang oleh form & cek status). */
function HelpStatus({ maskedPhone, waitedMinutes }: { maskedPhone: string; waitedMinutes: number }) {
  const overtime = waitedMinutes >= 60
  return (
    <div className="animate-pop grid gap-2 rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-3.5 text-sm">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        {overtime ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--gold)]" />
        ) : (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--blue)]" />
        )}
        {overtime ? "Melewati 60 menit — belum juga diproses?" : "Permintaan sedang diproses panitia"}
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Status: <b className="tabular-nums text-foreground/90">{maskedPhone}</b> · menunggu{" "}
        <b className="tabular-nums text-foreground/90">{waitedMinutes} menit</b>
      </p>
      {overtime ? (
        <p className="rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-xs leading-relaxed text-foreground">
          Jika sudah lebih dari 60 menit dan password belum direset, hubungi panitia langsung dengan menyebutkan nomor HP ini:{" "}
          <a href="tel:089525385080" className="font-bold tabular-nums text-[var(--gold)] underline decoration-dotted underline-offset-4">
            089525385080
          </a>{" "}
          agar mereka dapat memverifikasi identitasmu.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Panitia menanggapi maksimal 60 menit. Nomor HP-mu tersimpan aman untuk verifikasi.
        </p>
      )}
    </div>
  )
}

export function PesertaAuth({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>("choice")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // ---- Alur "Lupa Kode Unik" (permintaan bantu ke panitia) ----
  type HelpState = { maskedPhone: string; waitedMinutes: number; kelas: string; nomor: number }
  const [helpSent, setHelpSent] = useState<HelpState | null>(null)

  // Setelah terkirim: cek status tiap 30 detik agar angka tunggu & pesan >60 menit akurat.
  useEffect(() => {
    if (!helpSent || mode !== "help") return
    const fd = new FormData()
    fd.set("kelas", helpSent.kelas)
    fd.set("nomorPresensi", String(helpSent.nomor))
    const iv = setInterval(async () => {
      const res = await checkResetHelpStatus(fd)
      if (res.found) setHelpSent((h) => h && { ...h, maskedPhone: res.maskedPhone!, waitedMinutes: res.waitedMinutes! })
    }, 30_000)
    return () => clearInterval(iv)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpSent?.kelas, helpSent?.nomor, mode])

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

  const heading = MODE_TITLES[mode]

  return (
    <div className="mx-auto w-full max-w-md">
      <button
        onClick={() => (mode === "choice" ? onBack() : setMode("choice"))}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground/70 transition hover:-translate-x-0.5 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <GlassCard glow className="animate-pop">
        <div className="mb-5 text-center">
          <span className="relative mx-auto mb-4 inline-block">
            <span className="conic-ring absolute -inset-1.5 rounded-3xl opacity-60 blur-[3px]" aria-hidden="true" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--gold),#e8c87a)] text-[oklch(0.2_0.03_255)] shadow-xl shadow-[var(--gold)]/25">
              {mode === "reset" ? <KeyRound className="h-8 w-8" /> : mode === "login" ? <LogIn className="h-8 w-8" /> : <UserPlus className="h-8 w-8" />}
            </span>
          </span>
          <h2 className="font-serif text-2xl font-semibold text-foreground">{heading.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{heading.subtitle}</p>
        </div>

        {error ? (
          <p role="alert" className="animate-pop mb-4 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-foreground">
            <ShieldQuestion className="h-4 w-4 shrink-0 text-destructive" /> {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="animate-pop mb-4 flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/15 px-3 py-2 text-sm text-foreground">
            <Sparkles className="h-4 w-4 shrink-0 text-emerald-300" /> {notice}
          </p>
        ) : null}

        {mode === "choice" && (
          <div className="grid gap-3">
            <GradientButton onClick={() => setMode("signup")}>
              <UserPlus className="h-5 w-5" /> Daftar Akun Baru
            </GradientButton>
            <GhostButton onClick={() => setMode("login")}>
              <LogIn className="h-5 w-5" /> Masuk (Log In)
              <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
            </GhostButton>
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="mt-1 text-center text-xs text-muted-foreground/80 underline decoration-dotted underline-offset-4 transition hover:text-foreground"
            >
              Lupa password? →
            </button>
          </div>
        )}

        {mode === "reset" && (
          <div className="mt-1 text-center">
            <button
              type="button"
              onClick={() => { setError(null); setNotice(null); setHelpSent(null); setMode("help") }}
              className="text-xs text-muted-foreground/80 underline decoration-dotted underline-offset-4 transition hover:text-[var(--gold)]"
            >
              Lupa Kode Unik? Minta bantu panitia →
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
            <TextField
              label="Nama Lengkap"
              name="nama"
              required
              autoFocus
              autoComplete="off"
              placeholder="CONTOH: AHMAD FUADI"
              icon={<UserPlus />}
              style={{ textTransform: "uppercase" }}
              onChange={(e) => {
                e.currentTarget.value = e.currentTarget.value.toUpperCase()
              }}
            />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Kelas" name="kelas" required defaultValue="">
                <option value="" disabled>
                  Pilih kelas
                </option>
                {KELAS_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </SelectField>
              <SelectField label="No. Presensi" name="nomorPresensi" required defaultValue="">
                <option value="" disabled>
                  Pilih nomor
                </option>
                {NOMOR_PRESENSI_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField label="Password" name="password" type="password" required placeholder="Buat password" icon={<KeyRound />} />
            <TextField
              label="Kode Unik"
              name="kodeUnik"
              required
              placeholder="Kata kunci rahasia kamu"
              icon={<Sparkles />}
              hint="Simpan baik-baik. Kode ini dipakai untuk reset password jika lupa."
            />
            <GradientButton type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Mendaftar...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" /> Daftar & Masuk
                </>
              )}
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
                  Pilih kelas
                </option>
                {KELAS_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </SelectField>
              <SelectField label="No. Presensi" name="nomorPresensi" required defaultValue="">
                <option value="" disabled>
                  Pilih nomor
                </option>
                {NOMOR_PRESENSI_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField label="Password" name="password" type="password" required autoFocus placeholder="Masukkan password" icon={<KeyRound />} />
            <button
              type="button"
              onClick={() => setMode("reset")}
              className="-mt-1 text-left text-xs text-muted-foreground/70 underline decoration-dotted underline-offset-4 transition hover:text-foreground/70"
            >
              Lupa password? →
            </button>
            <GradientButton type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Masuk...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" /> Log In
                </>
              )}
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
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Kelas" name="kelas" required defaultValue="">
                <option value="" disabled>
                  Pilih kelas
                </option>
                {KELAS_OPTIONS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </SelectField>
              <SelectField label="No. Presensi" name="nomorPresensi" required defaultValue="">
                <option value="" disabled>
                  Pilih nomor
                </option>
                {NOMOR_PRESENSI_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectField>
            </div>
            <TextField label="Kode Unik" name="kodeUnik" required autoFocus placeholder="Kode unik saat daftar" icon={<Sparkles />} />
            <TextField label="Password Baru" name="newPassword" type="password" required placeholder="Password baru" icon={<KeyRound />} />
            <GradientButton type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Memproses...
                </>
              ) : (
                <>
                  <KeyRound className="h-5 w-5" /> Reset Password
                </>
              )}
            </GradientButton>
          </form>
        )}

        {mode === "help" &&
          (helpSent ? (
            // ---- Indikator: permintaan sedang diproses panitia ----
            <div className="grid gap-4">
              <HelpStatus maskedPhone={helpSent.maskedPhone} waitedMinutes={helpSent.waitedMinutes} />
              <GhostButton onClick={() => { setHelpSent(null); setMode("reset") }}>
                <ChevronRight className="mr-auto h-4 w-4 rotate-180" /> Coba reset mandiri dengan kode unik
              </GhostButton>
            </div>
          ) : (
            // ---- Form kirim permintaan bantu ----
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                setError(null)
                const fd = new FormData(form)
                startTransition(async () => {
                  const res = await requestResetHelp(fd)
                  if (res.ok) {
                    setHelpSent({
                      maskedPhone: res.maskedPhone!,
                      waitedMinutes: res.waitedMinutes!,
                      kelas: String(fd.get("kelas")),
                      nomor: Number(String(fd.get("nomorPresensi"))),
                    })
                  } else {
                    setError(res.error ?? "Gagal mengirim permintaan.")
                  }
                })
              }}
              className="grid gap-4"
            >
              <p className="rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                Prosedur sederhana: kirim permintaan ini, panitia akan memverifikasi lewat nomor HP-mu lalu{" "}
                <b className="text-foreground/90">mereset password menjadi 12345678</b>. Maksimal respon{" "}
                <b className="tabular-nums text-foreground/90">60 menit</b>.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Kelas" name="kelas" required defaultValue="">
                  <option value="" disabled>Pilih kelas</option>
                  {KELAS_OPTIONS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </SelectField>
                <SelectField label="No. Presensi" name="nomorPresensi" required defaultValue="">
                  <option value="" disabled>Pilih nomor</option>
                  {NOMOR_PRESENSI_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </SelectField>
              </div>
              <TextField
                label="Nomor HP (untuk verifikasi panitia)"
                name="phone"
                inputMode="numeric"
                required
                autoFocus
                placeholder="08xxxxxxxxxx"
                icon={<Phone />}
                hint="Nomor hanya dilihat panitia untuk mengonfirmasi identitas kamu."
              />
              <GradientButton type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <Inbox className="h-5 w-5" /> Kirim Permintaan ke Panitia
                  </>
                )}
              </GradientButton>
            </form>
          ))}
      </GlassCard>
    </div>
  )
}
