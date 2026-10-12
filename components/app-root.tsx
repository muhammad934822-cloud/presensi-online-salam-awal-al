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
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
      <section className="surface-grid relative overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-6 shadow-2xl shadow-black/20 sm:p-10">
        <div className="absolute right-8 top-8 h-24 w-24 rounded-full border border-primary/20" aria-hidden="true" />
        <div className="absolute right-14 top-14 h-12 w-12 rounded-full bg-primary/10" aria-hidden="true" />
        <BrandHeader />
        <div className="mt-12 max-w-lg">
          <p className="section-kicker">Sistem kehadiran digital</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">Satu tempat untuk setiap kehadiran.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">Akses kode presensi, pantau status, dan bantu panitia menjaga data kegiatan tetap rapi.</p>
        </div>
        <div className="mt-10 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center sm:max-w-md sm:gap-6">
          <div><p className="text-xl font-semibold text-foreground">03</p><p className="mt-1 text-[11px] text-muted-foreground">Agenda</p></div>
          <div><p className="text-xl font-semibold text-foreground">24/7</p><p className="mt-1 text-[11px] text-muted-foreground">Akses</p></div>
          <div><p className="text-xl font-semibold text-foreground">100%</p><p className="mt-1 text-[11px] text-muted-foreground">Terdata</p></div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-card/80 p-5 shadow-2xl shadow-black/20 sm:p-7">
        <div className="mb-6"><p className="section-kicker">Mulai di sini</p><h2 className="mt-2 text-xl font-semibold text-foreground">Pilih akses Anda</h2><p className="mt-1 text-sm text-muted-foreground">Gunakan ruang yang sesuai dengan kebutuhan.</p></div>
        <div className="grid gap-3">
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
        <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Sistem siap digunakan</div>
      </section>
    </div>
  )
}
