"use client"

/* ------------------------------------------------------------------ */
/* DEMO UJICOBA — akun peserta sungguhan bernama "AKUN DEMO".          */
/* Panitia membuka sesi peserta demo, lalu menguji SEMUA fitur peserta  */
/* end-to-end (QR, scan sendiri lewat menu Presensi panitia, ganti      */
/* nama/password, Lupa Password → ajukan & tinjau permintaan) karena    */
/* ini akun nyata — bukan simulasi. Peserta asli tidak pernah terganggu: */
/* kelas "DEMO" disembunyikan dari Daftar Peserta & rekap per kelas.    */
/* ------------------------------------------------------------------ */

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { FlaskConical, LogIn, RotateCcw, KeyRound, Eye, ShieldQuestion } from "lucide-react"
import { GlassCard, GhostButton } from "./ui-kit"
import { openDemoSession, closeDemoSession, ensureDemoAccount } from "@/app/actions/participant"

export function DemoUjicoba({ demoActive }: { demoActive: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) => {
    setErr(null)
    startTransition(() => {
      void fn().then((r) => {
        if (!r.ok) {
          setErr(r.error ?? "Terjadi kesalahan.")
          return
        }
        ;(after ?? (() => router.refresh()))()
      })
    })
  }

  return (
    <div className="grid gap-4">
      {/* Kartu penjelasan + status */}
      <GlassCard className={"p-4 " + (demoActive ? "border-[var(--gold)]/40" : "border-[var(--purple)]/30")}>
        <div className="flex items-start gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--purple),#b78ff0)] text-white shadow-lg shadow-[var(--purple)]/25">
            <FlaskConical className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              Akun Demo{" "}
              <span
                className={
                  "ml-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold " +
                  (demoActive
                    ? "bg-[var(--gold)]/15 text-[var(--gold)]"
                    : "bg-white/[0.06] text-muted-foreground")
                }
              >
                <span className={"h-1.5 w-1.5 rounded-full " + (demoActive ? "bg-[var(--gold)] animate-pulse-dot" : "bg-muted-foreground/50")} />
                {demoActive ? "Sesi demo aktif" : "Sesi belum dibuka"}
              </span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Satu akun peserta sungguhan khusus untuk mencoba semua fitur tanpa mengganggu data peserta asli — QR bisa discan sendiri, password bisa direset, permintaan bantu-bisa diajukan &amp; ditinjau. Akun ini otomatis disembunyikan dari Daftar Peserta dan statistik kelas.
            </p>
          </div>
        </div>

        {err && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500">
            {err}
          </p>
        )}

        {/* Kredensial */}
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            [KeyRound, "Password", "demo123456"],
            [ShieldQuestion, "Kode Unik", "DEMO1234"],
            [Eye, "Kelas / No.", "DEMO / 1"],
          ].map(([Icon, label, val], i) => {
            const I = Icon as typeof KeyRound
            return (
              <div key={i} className="lift flex items-center gap-2 rounded-xl border border-[var(--line)] bg-white/[0.04] px-3 py-2">
                <I className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label as string}</p>
                  <p className="truncate font-mono text-xs font-semibold text-foreground">{val as string}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Aksi utama */}
        <div className="mt-4 flex flex-wrap gap-2">
          {!demoActive ? (
            <button
              onClick={() => run(openDemoSession)}
              disabled={pending}
              className="lift inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--purple)] to-[var(--blue)] px-4 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" />
              {pending ? "Membuka…" : "Buka Sesi Demo"}
            </button>
          ) : (
            <>
              <button
                onClick={() => router.refresh()}
                className="lift inline-flex items-center gap-2 rounded-xl border border-[var(--gold)]/50 bg-[var(--gold)]/10 px-4 py-2 text-xs font-bold text-[var(--gold)] transition active:scale-95"
              >
                <Eye className="h-4 w-4" />
                Lihat Dashboard Demo
              </button>
              <GhostButton
                onClick={() => run(closeDemoSession)}
                disabled={pending}
                className="!text-muted-foreground"
              >
                Tutup Sesi Demo
              </GhostButton>
            </>
          )}
          <GhostButton
            onClick={() =>
              run(() => ensureDemoAccount(), () => {
                if (demoActive) router.replace("/")
                router.refresh()
              })
            }
            disabled={pending}
          >
            <RotateCcw className={"h-3.5 w-3.5 " + (pending ? "animate-spin" : "")} />
            Reset Akun Demo
          </GhostButton>
        </div>

        {/* Panduan singkat */}
        <ol className="mt-4 grid gap-1.5 rounded-xl border border-dashed border-[var(--line)] bg-white/[0.02] p-3 text-[11px] leading-relaxed text-muted-foreground [counter-reset:step]">
          {[
            "Klik Buka Sesi Demo — kamu langsung melihat dashboard persis seperti yang dilihat peserta (menu Beranda, Presensi, Pengaturan).",
            "Buka tab Presensi panitia, scan QR akun demo — centang, confetti, dan suara akan muncul di dashboard demo juga.",
            "Coba Pengaturan: ganti nama (auto kapital) & ganti password pakai kode unik DEMO1234 atau password lama.",
            "Untuk uji alur Lupa Kode Unik: klik Tutup Sesi Demo, masuk lewat halaman login biasa dengan akun demo, ajukan permintaan, lalu tutup dan buka lagi sesi demo untuk meninjau statusnya.",
            "Semua beres? Klik Reset Akun Demo untuk mengembalikannya ke kondisi awal bersih (password & kode unik kembali seperti di atas).",
          ].map((t, i) => (
            <li key={i} className="flex gap-2 before:font-bold before:text-[var(--purple)] before:content-[counter(step)_.] [counter-increment:step]">
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </GlassCard>
    </div>
  )
}
