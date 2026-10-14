"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
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
  Eye,
  ListChecks,
  Copy,
  PhoneCall,
  Clock3,
  XCircle,
} from "lucide-react"
import { GlassCard, TextField, SelectField, GradientButton, GhostButton } from "./ui-kit"
import { KELAS_OPTIONS, NOMOR_PRESENSI_OPTIONS } from "@/lib/constants"
import {
  signUpParticipant,
  loginParticipant,
  resetPasswordWithKode,
  requestResetHelp,
  checkResetHelpByKode,
  cancelResetHelpByKode,
} from "@/app/actions/participant"
import { playApproved, playRejected } from "@/lib/sound"

type Mode = "choice" | "signup" | "login" | "reset" | "help"

const MODE_TITLES: Record<Mode, { title: string; subtitle: string }> = {
  choice: { title: "Peserta", subtitle: "Pilih aksi untuk melanjutkan" },
  signup: { title: "Daftar Akun", subtitle: "Lengkapi identitas kamu untuk membuat akun presensi" },
  login: { title: "Masuk Akun", subtitle: "Gunakan kelas, nomor presensi, dan password kamu" },
  reset: { title: "Lupa Password?", subtitle: "Pilih cara memulihkan akses akun kamu" },
  help: { title: "Lupa Kode Unik?", subtitle: "Ajukan permintaan reset atau tinjau status permintaanmu" },
}

/** Judul dinamis per cabang layar "Lupa Kode Unik?" */
function helpTitle(helpBranch: "ajukan" | "tinjau" | null, helpSent: unknown) {
  if (helpSent) return { title: "Permintaan Terkirim", subtitle: "Simpan kode tinjau kamu — panitia memproses maksimal 60 menit" }
  if (helpBranch === "ajukan") return { title: "Ajukan Permintaan Reset", subtitle: "Panitia akan memverifikasi nomor HP-mu sebelum mereset" }
  if (helpBranch === "tinjau") return { title: "Tinjau Permintaan Reset", subtitle: "Masukkan kode tinjau 6 karakter untuk memantau status" }
  return { title: "Lupa Kode Unik?", subtitle: "Ajukan permintaan reset atau tinjau status permintaanmu" }
}

/** Daftar prosedur bernomor — dipakai di form kirim & halaman hasil. */
function ProsedurList() {
  const steps = [
    "Isi kelas, nomor presensi, dan nomor HP yang aktif.",
    "Permintaan terkirim ke panitia beserta kode tinjau kamu.",
    "Panitia menghubungi/verifikasi nomor HP-mu lalu mereset password menjadi 12345678.",
    "Maksimal respon 60 menit — pantau status lewat menu Tinjau Permintaan.",
  ]
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-3.5">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--gold)]">
        <ListChecks className="h-3.5 w-3.5" /> Prosedur Permintaan Reset Password
      </p>
      <ol className="grid gap-1.5 text-xs leading-relaxed text-muted-foreground">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--gold)]/15 text-[10px] font-bold tabular-nums text-[var(--gold)]">
              {i + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** Kartu hasil berisi kode tinjau + indikator proses + tombol telepon >60 menit. */
function HelpResult({
  kode,
  maskedPhone,
  waitedMinutes,
  status,
}: {
  kode: string
  maskedPhone: string
  waitedMinutes: number
  status: "pending" | "approved" | "ignored"
}) {
  const overtime = status === "pending" && waitedMinutes >= 60
  const [copied, setCopied] = useState(false)
  return (
    <div className="animate-pop grid gap-3">
      {/* Kode tinjau */}
      <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-3.5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Kode Tinjau Permintaanmu</p>
        <div className="mt-1 flex items-center justify-center gap-2">
          <p className="font-mono text-2xl font-black tracking-[0.3em] text-[var(--gold)]">{kode}</p>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(kode).then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              })
            }}
            className="rounded-lg border border-[var(--line)] p-1.5 text-muted-foreground transition hover:scale-105 hover:text-foreground"
            aria-label="Salin kode tinjau"
          >
            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Simpan kode ini untuk mengecek status kapan saja.</p>
      </div>

      {/* Status */}
      {status === "pending" ? (
        <div className="grid gap-2 rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-3.5 text-sm">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--blue)]" /> Permintaan sedang diproses panitia
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Status: <b className="tabular-nums text-foreground/90">{maskedPhone}</b> · menunggu{" "}
            <b className="tabular-nums text-foreground/90">{waitedMinutes} menit</b> · maksimal respon{" "}
            <b className="tabular-nums text-foreground/90">60 menit</b>
          </p>
          {overtime ? (
            <p className="rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-2 text-xs leading-relaxed text-foreground">
              Sudah lebih dari 60 menit dan password belum direset? Hubungi panitia untuk konfirmasi dengan menyebutkan nomor HP ini:{" "}
              <a href="tel:089525385080" className="inline-flex items-center gap-1 font-bold tabular-nums text-[var(--gold)] underline decoration-dotted underline-offset-4">
                <PhoneCall className="h-3.5 w-3.5" /> 089525385080
              </a>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Clock3 className="h-3 w-3" /> Nomor HP-mu tersimpan aman untuk verifikasi panitia.
            </p>
          )}
        </div>
      ) : status === "approved" ? (
        <div className="grid gap-1.5 rounded-2xl border border-emerald-400/40 bg-emerald-400/15 px-4 py-3.5 text-sm">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> Disetujui! Password-mu sudah direset
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Login sekarang dengan password baru <b className="tabular-nums text-foreground/90">12345678</b>, lalu segera ganti lewat menu Pengaturan.
          </p>
        </div>
      ) : (
        <div className="grid gap-1.5 rounded-2xl border border-destructive/40 bg-destructive/15 px-4 py-3.5 text-sm">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <XCircle className="h-4 w-4 shrink-0 text-destructive" /> Permintaan tidak disetujui / dihapus panitia
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Coba lagi mengirim permintaan, atau hubungi panitia langsung.
          </p>
        </div>
      )}

      <Link
        href="/#tinjau"
        className="text-center text-xs text-muted-foreground/80 underline decoration-dotted underline-offset-4 transition hover:text-foreground"
      >
        Buka menu Tinjau Permintaan →
      </Link>
    </div>
  )
}

/** Polling status untuk mode "review" (cek via kode tinjau) tiap 30 detik. */
export function PesertaAuth({ onBack }: { onBack: () => void }) {
  const [mode, setMode] = useState<Mode>("choice")
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // ---- Alur "Lupa Kode Unik" (permintaan bantu ke panitia) ----
  type HelpState = { kode: string; maskedPhone: string; waitedMinutes: number; status: "pending" | "approved" | "ignored" }
  const [helpSent, setHelpSent] = useState<HelpState | null>(null)
  // Cabang layar "Lupa Kode Unik?": dua cabang dulu (ajukan / tinjau), baru form-nya.
  const [helpBranch, setHelpBranch] = useState<"ajukan" | "tinjau" | null>(null)

  // Cabang form reset mandiri (kode unik) — default tertutup di layar dua cabang.
  const [showResetForm, setShowResetForm] = useState(false)

  // ---- Menu "Tinjau Permintaan" (cek status via kode tinjau) ----
  const [reviewKode, setReviewKode] = useState("")
  const [reviewResult, setReviewResult] = useState<HelpState | null>(null)
  const lastReviewedStatus = useRef<string | null>(null)

  // Polling status permintaan aktif (setelah kirim / setelah cek kode) tiap 30 detik,
  // plus bunyikan notifikasi suara saat status berubah jadi disetujui/ditolak.
  function applyStatus(res: Awaited<ReturnType<typeof checkResetHelpByKode>>, setter: (h: HelpState) => void) {
    if (!res.ok || !res.found || !res.kodeTinjau) return
    const next: HelpState = {
      kode: res.kodeTinjau,
      maskedPhone: res.maskedPhone!,
      waitedMinutes: res.waitedMinutes!,
      status: res.status ?? "pending",
    }
    setter(next)
    if (lastReviewedStatus.current !== null && res.status && res.status !== lastReviewedStatus.current) {
      if (res.status === "approved") playApproved()
      else if (res.status === "ignored") playRejected()
    }
    lastReviewedStatus.current = res.status ?? "pending"
  }

  useEffect(() => {
    if (!helpSent || mode !== "help") return
    let cancelled = false
    const iv = setInterval(async () => {
      try {
        const res = await checkResetHelpByKode(helpSent.kode)
        if (!cancelled) applyStatus(res, (h) => setHelpSent(h))
      } catch { /* diam */ }
    }, 30_000)
    return () => { cancelled = true; clearInterval(iv) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helpSent?.kode, mode])

  useEffect(() => {
    if (!reviewResult || mode !== "help" || helpBranch !== "tinjau") return
    let cancelled = false
    const iv = setInterval(async () => {
      try {
        const res = await checkResetHelpByKode(reviewResult.kode)
        if (!cancelled) applyStatus(res, (h) => setReviewResult(h))
      } catch { /* diam */ }
    }, 30_000)
    return () => { cancelled = true; clearInterval(iv) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewResult?.kode, mode])

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

  const heading = mode === "help" ? helpTitle(helpBranch, helpSent) : MODE_TITLES[mode]

  return (
    <div className="mx-auto w-full max-w-md">
      <button
        onClick={() => {
          // Back selalu kembali satu level ke cabang UTAMA, bukan melompat acak.
          setError(null)
          setNotice(null)
          if (mode === "choice") return onBack()
          if (mode === "reset" && showResetForm) return setShowResetForm(false)
          if (mode === "help" && helpSent) return setHelpSent(null)
          if (mode === "help" && reviewResult) return setReviewResult(null)
          if (mode === "help" && helpBranch) { setHelpBranch(null); return }
          if (mode === "help") return setMode("reset")
          setMode("choice")
        }}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground/70 transition hover:-translate-x-0.5 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali
      </button>

      <GlassCard glow className="animate-pop">
        <div className="mb-5 text-center">
          <span className="relative mx-auto mb-4 inline-block">
            <span className="conic-ring absolute -inset-1.5 rounded-3xl opacity-60 blur-[3px]" aria-hidden="true" />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--gold),#e8c87a)] text-[oklch(0.2_0.03_255)] shadow-xl shadow-[var(--gold)]/25">
              {mode === "reset" ? <KeyRound className="h-8 w-8" /> : mode === "login" ? <LogIn className="h-8 w-8" /> : mode === "help" ? <Inbox className="h-8 w-8" /> : <UserPlus className="h-8 w-8" />}
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
              onClick={() => { setError(null); setNotice(null); setHelpSent(null); setReviewKode(""); setReviewResult(null); setMode("reset") }}
              className="mt-1 text-center text-xs text-muted-foreground/80 underline decoration-dotted underline-offset-4 transition hover:text-foreground"
            >
              Lupa password? →
            </button>
          </div>
        )}

        {mode === "reset" && !showResetForm && (
          // ---- Reset mandiri dulu; di bawahnya link samar "Lupa Kode Unik?" ----
          <div className="grid gap-3">
            <GradientButton onClick={() => { setError(null); setNotice(null); setShowResetForm(true) }}>
              <KeyRound className="h-5 w-5" /> Reset Password
              <span className="ml-auto rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-[var(--gold)]">kode unik</span>
              <ChevronRight className="ml-1 h-4 w-4 opacity-60" />
            </GradientButton>
            <button
              type="button"
              onClick={() => { setError(null); setNotice(null); setHelpSent(null); setReviewKode(""); setReviewResult(null); setHelpBranch(null); setMode("help") }}
              className="text-center text-xs text-muted-foreground/70 underline decoration-dotted underline-offset-4 transition hover:text-[var(--gold)]"
            >
              Lupa Kode Unik? →
            </button>
          </div>
        )}

        {mode === "help" && !helpBranch && !helpSent && !reviewResult && (
          // ---- Dua cabang: ajukan permintaan baru ATAU tinjau yang sudah ada ----
          <div className="grid gap-3">
            <p className="text-center text-xs leading-relaxed text-muted-foreground">
              Panitia akan memverifikasi nomor HP-mu sebelum mereset akses akun.
            </p>
            <GradientButton onClick={() => { setError(null); setNotice(null); setHelpBranch("ajukan") }}>
              <Inbox className="h-5 w-5" /> Ajukan Permintaan Reset Password
              <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
            </GradientButton>
            <GhostButton onClick={() => { setError(null); setNotice(null); setHelpBranch("tinjau") }}>
              <Eye className="h-5 w-5" /> Tinjau Permintaan Reset Password
              <span className="ml-auto rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-[var(--gold)]">kode 6 karakter</span>
            </GhostButton>
            <button
              type="button"
              onClick={() => { setError(null); setNotice(null); setHelpBranch(null); setMode("reset") }}
              className="mt-1 text-center text-xs text-muted-foreground/70 underline decoration-dotted underline-offset-4 transition hover:text-foreground"
            >
              ← Kembali ke reset mandiri
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

        {mode === "reset" && showResetForm && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const form = e.currentTarget
              handle(resetPasswordWithKode, form, () => {
                setNotice("Password berhasil direset. Silakan login dengan password baru.")
                setShowResetForm(false)
                setMode("login")
              })
            }}
            className="grid gap-4"
          >
            <button
              type="button"
              onClick={() => setShowResetForm(false)}
              className="-mt-1 flex items-center gap-1 self-start text-xs text-muted-foreground/70 underline decoration-dotted underline-offset-4 transition hover:text-foreground"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Kembali
            </button>
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

        {mode === "help" && helpBranch === "ajukan" && !helpSent && (
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
                    lastReviewedStatus.current = res.status ?? "pending"
                    setHelpSent({
                      kode: res.kodeTinjau!,
                      maskedPhone: res.maskedPhone!,
                      waitedMinutes: res.waitedMinutes!,
                      status: res.status ?? "pending",
                    })
                  } else {
                    setError(res.error ?? "Gagal mengirim permintaan.")
                  }
                })
              }}
              className="grid gap-4"
            >
              <button
                type="button"
                onClick={() => { setError(null); setHelpBranch(null) }}
                className="-mt-1 flex items-center gap-1 self-start text-xs text-muted-foreground/70 underline decoration-dotted underline-offset-4 transition hover:text-foreground"
              >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" /> Kembali
              </button>
              <ProsedurList />
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
        )}

        {/* Indikator hasil permintaan — tampil di cabang mana pun (kode tinjau, proses, telepon >60 mnt) */}
        {mode === "help" && helpSent && (
          <div className="grid gap-4">
            <HelpResult kode={helpSent.kode} maskedPhone={helpSent.maskedPhone} waitedMinutes={helpSent.waitedMinutes} status={helpSent.status} />
            <GhostButton onClick={() => { setHelpSent(null); setHelpBranch(null) }}>
              <ChevronRight className="mr-auto h-4 w-4 rotate-180" /> Kembali ke menu Lupa Kode Unik
            </GhostButton>
          </div>
        )}

        {/* ---- Hasil tinjauan via kode 6 karakter (tampil di cabang mana pun) ---- */}
        {mode === "help" && reviewResult && (
            // ---- Hasil tinjauan via kode 6 karakter ----
            <div className="grid gap-4">
              <HelpResult
                kode={reviewResult.kode}
                maskedPhone={reviewResult.maskedPhone}
                waitedMinutes={reviewResult.waitedMinutes}
                status={reviewResult.status}
              />
              {reviewResult.status === "pending" && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("Batalkan permintaan reset ini?")) return
                    const res = await cancelResetHelpByKode(reviewResult.kode)
                    if (res.ok) {
                      setReviewResult(null)
                      setNotice("Permintaan dibatalkan. Kamu bisa mengirim baru kapan saja.")
                      setHelpBranch(null)
                    } else {
                      setError(res.error ?? "Gagal membatalkan permintaan.")
                    }
                  }}
                  className="text-center text-xs text-muted-foreground/80 underline decoration-dotted underline-offset-4 transition hover:text-destructive"
                >
                  Batalkan permintaan ini →
                </button>
              )}
              <GhostButton onClick={() => { setReviewResult(null); setReviewKode("") }}>
                <ChevronRight className="mr-auto h-4 w-4 rotate-180" /> Cek kode lain
              </GhostButton>
              <GhostButton onClick={() => { setReviewResult(null); setReviewKode(""); setHelpBranch(null) }}>
                <ChevronRight className="mr-auto h-4 w-4 rotate-180" /> Kembali ke menu Lupa Kode Unik
              </GhostButton>
            </div>
        )}

        {mode === "help" && helpBranch === "tinjau" && !reviewResult && (
            // ---- Form masukkan kode tinjau ----
            <form
              onSubmit={(e) => {
                e.preventDefault()
                setError(null)
                startTransition(async () => {
                  const res = await checkResetHelpByKode(reviewKode)
                  if (res.ok && res.found) {
                    lastReviewedStatus.current = res.status ?? "pending"
                    if (res.status === "approved") playApproved()
                    else if (res.status === "ignored") playRejected()
                    setReviewResult({
                      kode: res.kodeTinjau!,
                      maskedPhone: res.maskedPhone!,
                      waitedMinutes: res.waitedMinutes!,
                      status: res.status ?? "pending",
                    })
                  } else {
                    setError(res.error ?? "Kode tidak ditemukan.")
                  }
                })
              }}
              className="grid gap-4"
            >
              <p className="rounded-2xl border border-[var(--line)] bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                Masukkan <b className="text-foreground/90">kode tinjau 6 karakter</b> yang kamu terima saat mengirim permintaan reset. Status akan muncul di sini dan diperbarui otomatis.
              </p>
              <TextField
                label="Kode Tinjau"
                name="kodeTinjau"
                required
                autoFocus
                maxLength={8}
                placeholder="Contoh: A7B2C9"
                icon={<Eye />}
                style={{ textTransform: "uppercase", letterSpacing: "0.3em", textAlign: "center", fontFamily: "monospace" }}
                value={reviewKode}
                onChange={(e) => setReviewKode(e.currentTarget.value.toUpperCase())}
              />
              <GradientButton type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Mengecek...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> Cek Status Permintaan
                  </>
                )}
              </GradientButton>
            </form>
        )}
      </GlassCard>
    </div>
  )
}
