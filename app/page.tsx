import { DynamicBackground } from "@/components/dynamic-background"
import { AppRoot } from "@/components/app-root"
import { getCurrentParticipant, isCommittee } from "@/lib/session"
import { getMyCodes, getRecapForEvent, getAllParticipants, type RecapRow } from "@/lib/queries"
import { EVENTS, type EventKey } from "@/lib/db/schema"

export const dynamic = "force-dynamic"

export default async function Page() {
  const [participant, committee] = await Promise.all([getCurrentParticipant(), isCommittee()])

  let codes = null
  if (participant) {
    codes = await getMyCodes(participant.id)
  }

  let recaps: Record<EventKey, RecapRow[]> | null = null
  let accounts = null
  if (committee) {
    const results = await Promise.all(EVENTS.map((ev) => getRecapForEvent(ev)))
    recaps = {} as Record<EventKey, RecapRow[]>
    EVENTS.forEach((ev, i) => {
      recaps![ev] = results[i]
    })
    accounts = await getAllParticipants()
  }

  return (
    <main className="relative flex min-h-dvh flex-col items-center px-4 py-8 sm:py-12">
      <DynamicBackground />
      <div className="flex w-full flex-1 items-start justify-center">
        <AppRoot
          participant={
            participant
              ? { nama: participant.nama, kelas: participant.kelas, nomorPresensi: participant.nomorPresensi }
              : null
          }
          codes={codes}
          committee={committee}
          recaps={recaps}
          accounts={accounts}
        />
      </div>
    </main>
  )
}
