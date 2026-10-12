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
    <div className="mx-auto flex w-full max-w-2xl flex-col justify-center gap-10">
      <BrandHeader />

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setChoice("peserta")}
          className="group flex min-h-32 items-center gap-4 rounded-2xl border border-border bg-card/80 p-5 text-left shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-primary/60 hover:bg-card"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">Peserta</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Masuk untuk menampilkan kode presensi</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
        </button>

        <button
          onClick={() => setChoice("panitia")}
          className="group flex min-h-32 items-center gap-4 rounded-2xl border border-border bg-card/80 p-5 text-left shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-accent/60 hover:bg-card"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-foreground">Panitia</span>
            <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">Kelola verifikasi dan rekap presensi</span>
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
