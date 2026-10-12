"use client"

import { useState } from "react"
import { GraduationCap, ShieldCheck, ChevronRight, QrCode, Zap } from "lucide-react"
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

  if (participant && codes) {
    return (
      <ParticipantHome
        nama={participant.nama}
        kelas={participant.kelas}
        nomorPresensi={participant.nomorPresensi}
        codes={codes}
      />
    )
  }

  if (committee && recaps && accounts) {
    return <CommitteeHome recaps={recaps} accounts={accounts} />
  }

  if (choice === "peserta") return <PesertaAuth onBack={() => setChoice("none")} />
  if (choice === "panitia") return <PanitiaAuth onBack={() => setChoice("none")} />

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-10">
      <div className="text-center sm:text-left">
        <BrandHeader />
        <p className="animate-rise-1 mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Sistem presensi digital untuk kegiatan <span className="font-semibold text-foreground/90">Salam Awal Al Uswah</span>.
          Masuk sebagai peserta untuk menampilkan kode QR presensi, atau sebagai panitia untuk memverifikasi dan merekap kehadiran.
        </p>
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
        ].map((f) => (
          <div key={f.label} className="rounded-2xl border border-white/8 bg-white/[0.04] px-2 py-3 backdrop-blur-sm">
            <f.icon className="mx-auto mb-1.5 h-4 w-4 text-[var(--gold)]" aria-hidden="true" />
            <p className="text-xs font-semibold text-foreground">{f.label}</p>
            <p className="text-[11px] text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
