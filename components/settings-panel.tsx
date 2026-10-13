"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Moon,
  Sun,
  UserRoundPen,
  KeyRound,
  LogOut,
  CheckCircle2,
  Loader2,
  Sparkles,
  BellRing,
  Volume2,
  VolumeX,
} from "lucide-react"
import { GlassCard, TextField, GradientButton, GhostButton } from "./ui-kit"
import { useTheme } from "./theme-provider"
import { updateParticipantName, changePasswordSelf } from "@/app/actions/participant"
import { isSoundOn, setSoundOn, playSuccess, playClick } from "@/lib/sound"

/**
 * Panel Pengaturan yang dipakai peserta & panitia dengan tampilan sama:
 * tema (gelap/terang), ganti nama (khusus peserta), ganti password, keluar.
 */
export function SettingsPanel({
  role,
  nama,
}: {
  role: "peserta" | "panitia"
  nama?: string
}) {
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Preferensi suara notifikasi (per perangkat, localStorage)
  const [soundOn, setSound] = useState(true)
  useEffect(() => setSound(isSoundOn()), [])

  // Ganti nama
  const [ newName, setNewName ] = useState("")
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Ganti password (peserta — verifikasi pakai password lama ATAU kode unik)
  const [oldPass, setOldPass] = useState("")
  const [kodeUnik, setKodeUnik] = useState("")
  const [newPass, setNewPass] = useState("")
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function saveName() {
    if (!newName.trim()) return
    setNameMsg(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set("nama", newName)
      const res = await updateParticipantName(fd)
      setNameMsg(res.ok ? { ok: true, text: "Nama berhasil diperbarui" } : { ok: false, text: res.error ?? "Gagal." })
      if (res.ok) {
        setNewName("")
        router.refresh()
      }
    })
  }

  function savePassword() {
    setPassMsg(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set("oldPassword", oldPass)
      fd.set("kodeUnik", kodeUnik)
      fd.set("newPassword", newPass)
      const res = await changePasswordSelf(fd)
      setPassMsg(res.ok ? { ok: true, text: "Password berhasil diganti" } : { ok: false, text: res.error ?? "Gagal." })
      if (res.ok) {
        setOldPass("")
        setKodeUnik("")
        setNewPass("")
      }
    })
  }

  return (
    <div className="grid gap-4">
      {/* Tema */}
      <GlassCard className="animate-rise-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--purple),var(--blue))] text-white shadow-lg shadow-[var(--purple)]/30">
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </span>
            <div>
              <p className="font-semibold text-foreground">Tema Aplikasi</p>
              <p className="text-xs text-muted-foreground">
                Saat ini: <b className="capitalize">{theme === "dark" ? "Gelap" : "Terang"}</b> — tersimpan otomatis di perangkatmu
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={
              "relative h-9 w-[4.5rem] shrink-0 rounded-full border transition-all duration-500 " +
              (theme === "dark"
                ? "border-white/20 bg-[oklch(0.2_0.03_255)]"
                : "border-black/10 bg-sky-200")
            }
            aria-label="Ganti tema"
          >
            <span
              className={
                "absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--gold),#e8c87a)] shadow-md transition-all duration-500 " +
                (theme === "dark" ? "left-1" : "left-[calc(100%-2rem)]")
              }
            >
              {theme === "dark" ? <Moon className="h-3.5 w-3.5 text-[oklch(0.2_0.03_255)]" /> : <Sun className="h-3.5 w-3.5 text-[oklch(0.2_0.03_255)]" />}
            </span>
          </button>
        </div>
      </GlassCard>

      {/* Ganti nama (peserta) */}
      {role === "peserta" && nama !== undefined && (
        <GlassCard className="animate-rise-2">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--gold),#e8c87a)] text-[oklch(0.2_0.03_255)] shadow-lg shadow-[var(--gold)]/30">
              <UserRoundPen className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Ganti Nama</p>
              <p className="text-xs text-muted-foreground">Nama saat ini: {nama || "—"}</p>
            </div>
          </div>
          <div className="grid gap-3">
            <TextField
              label="Nama baru"
              placeholder="Tulis nama lengkap baru"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            {nameMsg && (
              <p className={"flex items-center gap-1.5 text-sm " + (nameMsg.ok ? "text-emerald-300" : "text-destructive")}>
                {nameMsg.ok && <CheckCircle2 className="h-4 w-4" />} {nameMsg.text}
              </p>
            )}
            <GradientButton onClick={saveName} disabled={pending || !newName.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Simpan Nama
            </GradientButton>
          </div>
        </GlassCard>
      )}

      {/* Ganti password — KHUSUS PESERTA (opsi panitia dihilangkan) */}
      {role === "peserta" && (
        <GlassCard className="animate-rise-3">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--blue),#8fb8ef)] text-[oklch(0.2_0.03_255)] shadow-lg shadow-[var(--blue)]/30">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-foreground">Ganti Password</p>
              <p className="text-xs text-muted-foreground">Verifikasi dengan password lama <b>atau</b> kode unik, lalu buat password baru</p>
            </div>
          </div>
          <div className="grid gap-3">
            <TextField
              label="Password Lama"
              type="password"
              placeholder="Password yang sedang kamu pakai"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
            />
            <TextField
              label="Kode Unik (opsional)"
              type="password"
              placeholder="Alternatif jika lupa password lama"
              value={kodeUnik}
              onChange={(e) => setKodeUnik(e.target.value)}
            />
            <TextField
              label="Password baru"
              type="password"
              placeholder="Minimal 6 karakter"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            {passMsg && (
              <p className={"flex items-center gap-1.5 text-sm " + (passMsg.ok ? "text-emerald-300" : "text-destructive")}>
                {passMsg.ok && <CheckCircle2 className="h-4 w-4" />} {passMsg.text}
              </p>
            )}
            <GradientButton onClick={savePassword} disabled={pending || (!oldPass && !kodeUnik) || newPass.length < 6}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Perbarui Password
            </GradientButton>
          </div>
        </GlassCard>
      )}

      {/* Suara notifikasi — toggle aktif + tombol tes (perangkat ini saja) */}
      <GlassCard className="animate-rise-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[var(--gold)]">
              {soundOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Suara Notifikasi</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {role === "panitia"
                  ? "Bunyi saat scan berhasil / sudah pernah discan / kode salah. Pastikan volume menyala di hari-H."
                  : "Bunyi meriah saat presensimu berhasil discan panitia, meski kamu sedang membuka halaman lain di tab ini."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <GhostButton
              onClick={() => playSuccess()}
              title="Tes suara"
              className="!px-3 !py-2 text-xs"
            >
              <BellRing className="h-4 w-4" /> Tes
            </GhostButton>
            <button
              type="button"
              role="switch"
              aria-checked={soundOn}
              aria-label="Suara notifikasi"
              onClick={() => {
                const next = !soundOn
                setSound(next)
                if (next) playClick()
              }}
              className={
                "relative h-7 w-12 rounded-full transition-colors duration-300 " +
                (soundOn ? "bg-emerald-400/80" : "bg-white/15")
              }
            >
              <span
                className={
                  "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 " +
                  (soundOn ? "left-6" : "left-1")
                }
              />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Keluar */}
      <GhostButton
        onClick={() =>
          startTransition(async () => {
            if (role === "peserta") {
              const { logoutParticipant } = await import("@/app/actions/participant")
              await logoutParticipant()
            } else {
              const { logoutCommittee } = await import("@/app/actions/committee")
              await logoutCommittee()
            }
            router.refresh()
          })
        }
        disabled={pending}
        className="border-destructive/40 text-destructive hover:border-destructive/70 hover:bg-destructive/10"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Keluar dari akun
      </GhostButton>
    </div>
  )
}
