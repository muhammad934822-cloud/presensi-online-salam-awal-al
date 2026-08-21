import { db } from "./db"
import { participants, attendance, type EventKey } from "./db/schema"
import { asc, eq } from "drizzle-orm"

export type RecapRow = {
  participantId: string
  nama: string
  kelas: string
  nomorPresensi: number
  qrShownAt: Date | null
  verifiedAt: Date | null
}

export async function getRecapForEvent(event: EventKey): Promise<RecapRow[]> {
  const rows = await db
    .select({
      participantId: participants.id,
      nama: participants.nama,
      kelas: participants.kelas,
      nomorPresensi: participants.nomorPresensi,
      qrShownAt: attendance.qrShownAt,
      verifiedAt: attendance.verifiedAt,
    })
    .from(attendance)
    .innerJoin(participants, eq(attendance.participantId, participants.id))
    .where(eq(attendance.event, event))
    .orderBy(asc(participants.kelas), asc(participants.nomorPresensi))

  // Only participants who have shown a QR or already been verified.
  return rows.filter((r) => r.qrShownAt !== null || r.verifiedAt !== null)
}

export type AccountRow = {
  id: string
  nama: string
  kelas: string
  nomorPresensi: number
  createdAt: Date
  lastActiveAt: Date
}

export async function getAllParticipants(): Promise<AccountRow[]> {
  return db
    .select({
      id: participants.id,
      nama: participants.nama,
      kelas: participants.kelas,
      nomorPresensi: participants.nomorPresensi,
      createdAt: participants.createdAt,
      lastActiveAt: participants.lastActiveAt,
    })
    .from(participants)
    .orderBy(asc(participants.kelas), asc(participants.nomorPresensi))
}

export async function getMyCodes(participantId: string) {
  const rows = await db
    .select({
      event: attendance.event,
      code: attendance.code,
      verifiedAt: attendance.verifiedAt,
    })
    .from(attendance)
    .where(eq(attendance.participantId, participantId))
  const map: Record<string, { code: string; verifiedAt: Date | null }> = {}
  for (const r of rows) map[r.event] = { code: r.code, verifiedAt: r.verifiedAt }
  return map
}
