"use client"

import { useState } from "react"
import { GraduationCap, ShieldCheck, ChevronRight, QrCode, Zap, LayoutDashboard, Sparkles, Moon as MoonIcon, UtensilsCrossed } from "lucide-react"
import { BrandHeader } from "./brand-header"
import { PesertaAuth } from "./peserta-auth"
import { PanitiaAuth } from "./panitia-auth"
import { ParticipantHome } from "./participant-home"
import { CommitteeHome } from "./committee-home"
import type { EventKey } from "@/lib/db/schema"
import type { RecapRow, AccountRow } from "@/lib/queries"

type Codes = Record<string, { code: string; verifiedAt: Date | string | null }>

type Props = {
  participant: { nama: string; kelas: string; nomorPresensi: number } | null
  codes: Codes | null
  committee: boolean
  recaps: Record<EventKey, RecapRow[]> | null
  accounts: AccountRow[] | null
}

export function AppRoot({ participant, codes, committee, recaps, accounts }: Props) {
  const [choice, setChoice] = useState<"none" | "peserta" | "panitia">("none")
  // Setelah login: tampilkan halaman utama dulu; dashboard dibuka lewat tombol.
  const [openDash, setOpenDash] = useState(false)

  // Sudah login tapi belum membuka dashboard -> tampilkan HALAMAN UTAMA sambutan dulu.
  const loggedIn = Boolean(participant && codes) || Boolean(committee && recaps && accounts)
  if (loggedIn && !openDash) {
    const isPanitia = Boolean(committee && recaps && accounts)
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-8 text-center">
        <BrandHeader />
        <div className="animate-rise-2 mx-auto max-w-md">
          <span className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[linear-gradient(135deg,var(--gold),var(--purple)_60%,var(--blue))] text-white shadow-xl shadow-[var(--purple)]/30">
            {isPanitia ? <ShieldCheck className="h-10 w-10" /> : <GraduationCap className="h-10 w-10" />}
          </span>
          <h2 className="font-serif text-2xl font-bold text-foreground">
            {isPanitia ? "Selamat datang, Panitia! 👋" : `Halo, ${(participant?.nama ?? "").split(" ")[0] || "Peserta"}! 👋`}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {isPanitia
              ? "Kamu sudah masuk sebagai panitia. Siap memverifikasi kehadiran Salam Awal Al Uswah hari ini?"
              : "Akun presensimu aktif. Buka dashboard untuk menampilkan QR, melihat progres kehadiran, dan mengatur akunmu."}
          </p>
        </div>
        <button
          onClick={() => setOpenDash(true)}
          className="lift sheen-host animate-rise-3 group mx-auto inline-flex min-h-14 items-center gap-2 rounded-2xl bg-[linear-gradient(100deg,var(--gold),var(--purple)_55%,var(--blue))] bg-[length:200%_100%] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[var(--purple)]/40 transition-all duration-300 hover:bg-right hover:shadow-xl active:scale-[0.98]"
        >
          <LayoutDashboard className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
          Buka Dashboard
          <ChevronRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <p className="animate-rise-4 text-xs text-muted-foreground">
          Tip: menu lengkap tersedia di sidebar kiri setelah dashboard dibuka.
        </p>
      </div>
    )
  }

  if (participant && codes && openDash) {
    return (
      <ParticipantHome
        nama={participant.nama}
        kelas={participant.kelas}
        nomorPresensi={participant.nomorPresensi}
        codes={codes}
        onExit={() => setOpenDash(false)}
      />
    )
  }

  if (committee && recaps && accounts && openDash) {
    return <CommitteeHome recaps={recaps} accounts={accounts} onExit={() => setOpenDash(false)} />
  }

  if (choice === "peserta") return <PesertaAuth onBack={() => setChoice("none")} />
  if (choice === "panitia") return <PanitiaAuth onBack={() => setChoice("none")} />


  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-10">
      <div className="text-center sm:text-left">
        {/* Badge meriah */}
        <span className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-foreground/90 backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-[var(--gold)]" aria-hidden="true" />
          🕌 Salam Awal Al Uswah — Presensi Digital
        </span>
        {/* Jarak aman: badge tidak menempel ke judul di bawahnya */}
        <div className="mt-7">
          <BrandHeader />
        </div>
        <p className="animate-rise-1 mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Sistem presensi digital untuk kegiatan <span className="font-bold text-[var(--gold)]">Salam Awal Al Uswah</span>.
          Masuk sebagai peserta untuk menampilkan kode QR presensi, atau sebagai panitia untuk memverifikasi dan merekap kehadiran.
        </p>

        {/* Marquee tiga kegiatan */}
        <div className="animate-rise-2 mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          {[
            { icon: GraduationCap, label: "Studium Generale", color: "var(--gold)" },
            { icon: MoonIcon, label: "Mabit", color: "var(--purple)" },
            { icon: UtensilsCrossed, label: "Konsumsi", color: "var(--blue)" },
          ].map((e) => (
            <span
              key={e.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-foreground/85 backdrop-blur"
            >
              <e.icon className="h-3.5 w-3.5" style={{ color: e.color }} aria-hidden="true" />
              {e.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setChoice("peserta")}
          className="lift sheen-host animate-rise-2 group relative flex min-h-40 flex-col items-start gap-4 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 text-left backdrop-blur-xl hover:border-[var(--gold)]/60"
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,var(--gold)_0%,transparent_70%)] opacity-20 transition-opacity duration-300 group-hover:opacity-40" />
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--gold),#e8c87a)] text-[oklch(0.2_0.03_255)] shadow-lg shadow-[var(--gold)]/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
            <GraduationCap className="h-7 w-7" aria-hidden="true" />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block font-serif text-lg font-semibold text-foreground">Saya Peserta</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              Daftar akun, masuk, dan tampilkan kode QR presensi kegiatan
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--gold)] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
              Masuk sekarang <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </span>
        </button>

        <button
          onClick={() => setChoice("panitia")}
          className="lift sheen-host animate-rise-3 group relative flex min-h-40 flex-col items-start gap-4 overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 text-left backdrop-blur-xl hover:border-[var(--blue)]/60"
        >
          <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,var(--blue)_0%,transparent_70%)] opacity-20 transition-opacity duration-300 group-hover:opacity-40" />
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--blue),var(--purple))] text-white shadow-lg shadow-[var(--blue)]/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
            <ShieldCheck className="h-7 w-7" aria-hidden="true" />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block font-serif text-lg font-semibold text-foreground">Saya Panitia</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
              Scan QR, verifikasi kehadiran, dan unduh rekap peserta
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--blue)] opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
              Buka dashboard <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </span>
        </button>
      </div>

      {/* Feature strip to fill the page with useful context */}
      <div className="animate-rise-4 grid grid-cols-3 gap-3 text-center">
        {[
          { icon: QrCode, label: "Scan QR", desc: "Verifikasi cepat" },
          { icon: Zap, label: "Real-time", desc: "Rekap langsung" },
          { icon: ShieldCheck, label: "Aman", desc: "Kode unik 16 digit" },
        ].map((f, i) => (
          <div
            key={f.label}
            className={`lift group rounded-2xl border border-white/8 bg-white/[0.04] px-2 py-3 backdrop-blur-sm transition-colors hover:border-[var(--gold)]/40 `}
          >
            <f.icon className="mx-auto mb-1.5 h-4 w-4 text-[var(--gold)] transition-transform duration-300 group-hover:scale-125" aria-hidden="true" />
            <p className="text-xs font-semibold text-foreground">{f.label}</p>
            <p className="text-[11px] text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer meriah */}
      <p className="animate-rise-4 text-center text-[11px] text-muted-foreground/70">
        ✨ Dibuat untuk kelancaran Salam Awal Al Uswah — presensi cepat, rekap rapi, data aman.
      </p>
    </div>
  )
}
