import { getRecapForEvent } from "@/lib/queries"
import { EVENTS, EVENT_LABELS, type EventKey } from "@/lib/db/schema"
import { LiveBoardClient } from "@/components/live-board"

export const dynamic = "force-dynamic"

/**
 * HALAMAN PUBLIK TANPA LOGIN — "Papan Kehadiran Langsung".
 * Diproyeksikan ke layar/TV aula saat hari-H. Membaca rekap yang sama
 * dengan dashboard panitia (SELECT saja, tidak pernah menulis DB).
 */
export default async function LivePage() {
  const recaps: Record<string, { hadir: number; total: number }> = {}
  const latest: { event: string; nama: string; kelas: string; nomorPresensi: number; at: string }[] = []

  for (const ev of EVENTS) {
    const rows = await getRecapForEvent(ev as EventKey)
    const verified = rows.filter((r) => r.verifiedAt)
    recaps[ev] = { hadir: verified.length, total: rows.length }
    for (const r of verified) {
      latest.push({
        event: EVENT_LABELS[ev],
        nama: r.nama,
        kelas: r.kelas,
        nomorPresensi: r.nomorPresensi,
        at: new Date(r.verifiedAt!).toISOString(),
      })
    }
  }
  latest.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  return <LiveBoardClient recaps={recaps} latest={latest.slice(0, 12)} />
}
