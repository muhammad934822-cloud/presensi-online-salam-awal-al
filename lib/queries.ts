import { db } from "./db"
import { participants, attendance, activityLog, type EventKey } from "./db/schema"
import { asc, desc, eq, sql } from "drizzle-orm"
import { ensureActivityLog } from "./db/migrate"

/**
 * Tulis satu baris riwayat aktivitas. Sepenuhnya opsional: error ditelan
 * (fire-and-forget) supaya logging tidak pernah mengganggu aksi utama.
 */
export function logActivity(actor: string, action: string, detail?: string) {
  void ensureActivityLog()
    .then((ok) => (ok ? db.insert(activityLog).values({ actor, action, detail: detail ?? null }) : undefined))
    .catch(() => {})
}

export type ActivityRow = {
  id: string
  actor: string
  action: string
  detail: string | null
  createdAt: Date
}

/** Ambil SEMUA riwayat aktivitas (untuk halaman rekap lengkap). */
export async function getAllActivity(): Promise<ActivityRow[]> {
  const ok = await ensureActivityLog()
  if (!ok) return []
  try {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(1000)
  } catch {
    return []
  }
}

/** Ambil riwayat aktivitas terbaru (hanya jika tabelnya sudah ada). */
export async function getRecentActivity(limit = 20): Promise<ActivityRow[]> {
  const ok = await ensureActivityLog()
  if (!ok) return []
  try {
    return await db
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(limit)
  } catch {
    return []
  }
}

export type ClassStat = { event: EventKey; kelas: string; total: number; hadir: number }

/** Statistik kehadiran per kelas, dikelompokkan per kegiatan. */
export async function getClassStats(): Promise<ClassStat[]> {
  const rows = await db
    .select({
      event: attendance.event,
      kelas: participants.kelas,
      total: sql<number>`count(*)`,
      hadir: sql<number>`count(*) filter (where ${attendance.verifiedAt} is not null)`,
    })
    .from(attendance)
    .innerJoin(participants, eq(attendance.participantId, participants.id))
    .groupBy(attendance.event, participants.kelas)
    .orderBy(asc(attendance.event), asc(participants.kelas))
  return rows.map((r) => ({
    event: r.event as EventKey,
    kelas: r.kelas,
    total: Number(r.total),
    hadir: Number(r.hadir),
  }))
}

export type RecapRow = {
  attendanceId: string
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
      attendanceId: attendance.id,
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
