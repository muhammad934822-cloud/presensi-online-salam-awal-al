import { DynamicBackground } from "@/components/dynamic-background"
import { AppRoot } from "@/components/app-root"
import { getCurrentParticipant, isCommittee } from "@/lib/session"
import { getMyCodes, getRecapForEvent, getAllParticipants, getAllActivity, getClassStats, type RecapRow } from "@/lib/queries"
import { EVENTS, type EventKey } from "@/lib/db/schema"
import { DEMO_KELAS, DEMO_NOMOR } from "@/lib/demo"

export const dynamic = "force-dynamic"

export default async function Page() {
  const [participant, committee] = await Promise.all([getCurrentParticipant(), isCommittee()])

  // Mode Ujicoba: panitia yang membuka sesi demo melihat dashboard peserta
  // AKUN DEMO yang asli — semua fitur dapat dicoba end-to-end tanpa
  // mengganggu peserta mana pun. Sesi panitia tetap tersimpan di cookie
  // sendiri, jadi menutup demo cukup menghapus cookie peserta saja.
  const demoActive = Boolean(committee && participant && participant.kelas === DEMO_KELAS && participant.nomorPresensi === DEMO_NOMOR)

  let codes = null
  if (participant) {
    codes = await getMyCodes(participant.id)
  }

  let recaps: Record<EventKey, RecapRow[]> | null = null
  let accounts = null
  let activity = null
  let classStats = null
  if (committee) {
    const [results, allAccounts, recentActivity, stats] = await Promise.all([
      Promise.all(EVENTS.map((ev) => getRecapForEvent(ev))),
      getAllParticipants(),
      getAllActivity(),
      getClassStats(),
    ])
    recaps = {} as Record<EventKey, RecapRow[]>
    EVENTS.forEach((ev, i) => {
      recaps![ev] = results[i]
    })
    accounts = allAccounts
    activity = recentActivity
    classStats = stats
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center px-4 py-8 sm:py-12">
      <DynamicBackground />
      <div className="flex w-full flex-1 items-start justify-center">
        <AppRoot
          participant={
            demoActive
              ? null // sesi demo: jangan tampilkan dashboard peserta biasa — AppRoot akan menampilkan panel Akun Demo
              : participant
                ? { nama: participant.nama, kelas: participant.kelas, nomorPresensi: participant.nomorPresensi }
                : null
          }
          codes={demoActive ? null : codes}
          committee={committee}
          demoActive={demoActive}
          recaps={recaps}
          accounts={accounts}
          activity={activity}
          classStats={classStats}
        />
      </div>
    </main>
  )
}
