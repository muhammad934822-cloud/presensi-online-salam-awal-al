"use client"

import { useState } from "react"
import { GraduationCap, ShieldCheck, ChevronRight } from "lucide-react"
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
    <div className="mx-auto w-full max-w-md">
      <BrandHeader />

      <div className="mt-10 grid gap-4">
        <button
          onClick={() => setChoice("peserta")}
          className="group flex items-center gap-4 rounded-3xl border border-white/15 bg-white/[0.06] p-5 text-left shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:border-[var(--gold)]/50 hover:bg-white/[0.1]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--purple)] text-white">
            <GraduationCap className="h-7 w-7" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold text-foreground">Peserta</span>
            <span className="text-sm text-muted-foreground">Daftar / masuk dan tampilkan QR presensi</span>
          </span>
          <ChevronRight className="h-5 w-5 text-foreground/50 transition group-hover:translate-x-0.5" />
        </button>

        <button
          onClick={() => setChoice("panitia")}
          className="group flex items-center gap-4 rounded-3xl border border-white/15 bg-white/[0.06] p-5 text-left shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:border-[var(--blue)]/50 hover:bg-white/[0.1]"
        >
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--blue)] to-[var(--purple)] text-white">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-semibold text-foreground">Panitia</span>
            <span className="text-sm text-muted-foreground">Verifikasi kode & kelola presensi</span>
          </span>
          <ChevronRight className="h-5 w-5 text-foreground/50 transition group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  )
}
