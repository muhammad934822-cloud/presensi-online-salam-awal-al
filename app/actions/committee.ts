"use server"

import { db } from "@/lib/db"
import { participants, attendance, activityLog } from "@/lib/db/schema"
import { and, eq, sql, desc } from "drizzle-orm"
import { hashPassword } from "@/lib/crypto"
import {
  createCommitteeSession,
  destroyCommitteeSession,
  isCommittee,
} from "@/lib/session"
import { COMMITTEE_PASSWORD } from "@/lib/constants"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/queries"
import { ensureActivityLog } from "@/lib/db/migrate"

type ActionResult = { ok: boolean; error?: string }

export async function loginCommittee(formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "")
  if (password !== COMMITTEE_PASSWORD)
    return { ok: false, error: "Password panitia salah." }
  await createCommitteeSession()
  revalidatePath("/")
  return { ok: true }
}

export async function logoutCommittee() {
  await destroyCommitteeSession()
  revalidatePath("/")
}

// Verify a 16-digit code (from QR scan or manual input) for a specific event.
export async function verifyCode(
  event: string,
  rawCode: string,
): Promise<{ ok: boolean; error?: string; nama?: string; kelas?: string; nomor?: number; already?: boolean }> {
  if (!(await isCommittee())) return { ok: false, error: "Tidak diizinkan." }

  const code = rawCode.replace(/\D/g, "").trim()
  if (code.length !== 16) return { ok: false, error: "Kode harus 16 digit angka." }

  const [record] = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.code, code), eq(attendance.event, event)))
    .limit(1)

  if (!record)
    return { ok: false, error: "Kode tidak ditemukan untuk menu ini." }

  const [p] = await db
    .select()
    .from(participants)
    .where(eq(participants.id, record.participantId))
    .limit(1)

  if (!p) return { ok: false, error: "Peserta tidak ditemukan." }

  if (record.verifiedAt) {
    return {
      ok: true,
      already: true,
      nama: p.nama,
      kelas: p.kelas,
      nomor: p.nomorPresensi,
    }
  }

  await db
    .update(attendance)
    .set({ verifiedAt: new Date() })
    .where(eq(attendance.id, record.id))

  logActivity(p.nama, "verifikasi", `${event} · No. ${p.nomorPresensi}`)
  revalidatePath("/")
  return {
    ok: true,
    nama: p.nama,
    kelas: p.kelas,
    nomor: p.nomorPresensi,
  }
}

// Undo / hapus satu verifikasi presensi yang salah (dobel scan / orang salah).
// Hanya mereset kolom `verified_at` yang sudah ada — baris attendance & data
// peserta tetap utuh, sehingga QR bisa discan ulang secara normal.
export async function unverifyAttendance(attendanceId: string): Promise<ActionResult> {
  if (!(await isCommittee())) return { ok: false, error: "Tidak diizinkan." }

  const [rec] = await db
    .select({ id: attendance.id, verifiedAt: attendance.verifiedAt })
    .from(attendance)
    .where(eq(attendance.id, attendanceId))
    .limit(1)
  if (!rec) return { ok: false, error: "Data kehadiran tidak ditemukan." }
  if (!rec.verifiedAt) return { ok: false, error: "Peserta ini belum terverifikasi." }

  await db
    .update(attendance)
    .set({ verifiedAt: null })
    .where(eq(attendance.id, rec.id))
  logActivity("PANITIA", "undo-verifikasi", `attendance ${rec.id}`)
  revalidatePath("/")
  return { ok: true }
}

export async function deleteParticipant(participantId: string): Promise<ActionResult> {
  if (!(await isCommittee())) return { ok: false, error: "Tidak diizinkan." }
  const [dp] = await db
    .select({ nama: participants.nama, kelas: participants.kelas, nomor: participants.nomorPresensi })
    .from(participants)
    .where(eq(participants.id, participantId))
    .limit(1)
  await db.delete(attendance).where(eq(attendance.participantId, participantId))
  await db.delete(participants).where(eq(participants.id, participantId))
  if (dp) logActivity(dp.nama, "hapus-akun", `${dp.kelas} · No. ${dp.nomor}`)
  revalidatePath("/")
  return { ok: true }
}

// Panitia mereset password peserta menjadi "12345678".
// Tidak memerlukan kode unik — cukup konfirmasi dari panitia yang login
// (kolom `password_hash` yang sudah ada — tidak mengubah skema DB).
export async function resetParticipantPassword(
  participantId: string,
): Promise<ActionResult> {
  if (!(await isCommittee())) return { ok: false, error: "Tidak diizinkan." }

  const [p] = await db
    .select({ id: participants.id })
    .from(participants)
    .where(eq(participants.id, participantId))
    .limit(1)
  if (!p) return { ok: false, error: "Peserta tidak ditemukan." }

  await db
    .update(participants)
    .set({ passwordHash: hashPassword("12345678") })
    .where(eq(participants.id, participantId))
  logActivity("PANITIA", "reset-password", `peserta ${participantId}`)
  revalidatePath("/")
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* Tinjauan "Lupa Kode Unik" di beranda panitia                        */
/* Membaca record RESET-BANTU dari activity_log yang SUDAH ADA —        */
/* tidak menambah tabel/kolom DB apa pun.                              */
/* ------------------------------------------------------------------ */

const HELP_PREFIX = "RESET-BANTU::"

export type HelpRequest = { nama: string; kelas: string; nomor: number; phone: string; createdAt: Date }

export async function getPendingResetHelp(): Promise<HelpRequest[]> {
  if (!(await isCommittee())) return []
  await ensureActivityLog()
  const rows = await db
    .select()
    .from(activityLog)
    .where(sql`${activityLog.detail} LIKE ${HELP_PREFIX + "%"}`)
    .orderBy(desc(activityLog.createdAt))
    .limit(200)

  const seen = new Set<string>()
  const out: HelpRequest[] = []
  for (const r of rows) {
    if (r.action === "reset-bantu-dibatalkan") continue
    if (!r.detail?.startsWith(HELP_PREFIX)) continue
    const [nama, kelas, nomor, phone] = r.detail.slice(HELP_PREFIX.length).split("::")
    if (!nama || !kelas || !nomor || !phone) continue
    const key = `${kelas}-${nomor}`
    if (seen.has(key)) continue
    seen.add(key)
    // hanya yang masih aktif: password belum pernah direset setelah permintaan
    out.push({ nama, kelas, nomor: Number(nomor), phone, createdAt: r.createdAt })
  }
  return out
}

// Panitia mereset langsung dari kartu tinjauan → password jadi 12345678.
export async function resetHelpByClassNomor(kelas: string, nomorPresensi: number): Promise<ActionResult> {
  if (!(await isCommittee())) return { ok: false, error: "Tidak diizinkan." }
  const [p] = await db
    .select({ id: participants.id, nama: participants.nama })
    .from(participants)
    .where(and(eq(participants.kelas, kelas), eq(participants.nomorPresensi, nomorPresensi)))
    .limit(1)
  if (!p) return { ok: false, error: "Peserta tidak ditemukan." }

  await db.update(participants).set({ passwordHash: hashPassword("12345678") }).where(eq(participants.id, p.id))
  await cancelResetHelpMarked(kelas, nomorPresensi)
  logActivity("PANITIA", "reset-password-bantuan", `${kelas}/${nomorPresensi} (${p.nama})`)
  revalidatePath("/")
  return { ok: true }
}

async function cancelResetHelpMarked(kelas: string, nomorPresensi: number) {
  await ensureActivityLog()
  await db.insert(activityLog).values({
    actor: "PANITIA",
    action: "reset-bantu-dibatalkan",
    detail: `${HELP_PREFIX}${kelas}::${nomorPresensi}`,
  })
}
