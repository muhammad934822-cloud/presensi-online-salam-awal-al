"use server"

import { db } from "@/lib/db"
import { participants, attendance, activityLog } from "@/lib/db/schema"
import { and, eq, sql, desc, inArray } from "drizzle-orm"
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
const DECISION_PREFIX = "RESET-DECISION::"

export type HelpRequest = {
  kode: string
  nama: string
  kelas: string
  nomor: number
  phone: string
  createdAt: Date
}

/** Ambil SEMUA permintaan yang masih menunggu (pending) — untuk beranda panitia. */
export async function getPendingResetHelp(): Promise<HelpRequest[]> {
  if (!(await isCommittee())) return []
  await ensureActivityLog()
  const rows = await db
    .select()
    .from(activityLog)
    .where(sql`${activityLog.detail} LIKE ${HELP_PREFIX + "%"} OR ${activityLog.detail} LIKE ${DECISION_PREFIX + "%"}`)
    .orderBy(desc(activityLog.createdAt))
    .limit(500)

  // Kumpulkan keputusan per kode (yang terbaru menang karena urutan desc).
  const decided = new Set<string>()
  for (const r of rows) {
    if (!r.detail?.startsWith(DECISION_PREFIX)) continue
    const [kode] = r.detail.slice(DECISION_PREFIX.length).split("::")
    if (kode) decided.add(kode)
  }

  const seen = new Set<string>()
  const out: HelpRequest[] = []
  for (const r of rows) {
    if (!r.detail?.startsWith(HELP_PREFIX)) continue
    const [kode, nama, kelas, nomor, phone] = r.detail.slice(HELP_PREFIX.length).split("::")
    if (!kode || !nama || !kelas || !nomor || !phone) continue
    const key = `${kelas}-${nomor}`
    if (seen.has(key)) continue
    seen.add(key)
    if (decided.has(kode)) continue // sudah direset / dihapus panitia

    // Deteksi OTOMATIS: jika password peserta sudah diganti setelah permintaan
    // dikirim (mis. panitia reset lewat Daftar Peserta), tandai selesai sendiri.
    const [p] = await db
      .select({ id: participants.id })
      .from(participants)
      .where(and(eq(participants.kelas, kelas), eq(participants.nomorPresensi, Number(nomor))))
      .limit(1)
    if (p) {
      const pwChanged = await db
        .select({ createdAt: activityLog.createdAt })
        .from(activityLog)
        .where(
          and(
            inArray(activityLog.action, ["reset-password", "ganti-password"]),
            sql`${activityLog.detail} LIKE ${`%${p.id}%`}`,
          ),
        )
        .orderBy(desc(activityLog.createdAt))
        .limit(1)
      if (pwChanged[0] && pwChanged[0].createdAt.getTime() >= r.createdAt.getTime()) {
        await markHelpApproved(kode, "auto:password-sudah-direset")
        continue
      }
    }

    out.push({ kode, nama, kelas, nomor: Number(nomor), phone, createdAt: r.createdAt })
  }
  return out
}

async function insertDecision(action: "reset-bantu-approved" | "reset-bantu-ignored", kode: string, note: string) {
  await ensureActivityLog()
  await db.insert(activityLog).values({
    actor: "PANITIA",
    action,
    detail: `${DECISION_PREFIX}${kode}::${note}`,
  })
}

async function markHelpApproved(kode: string, note: string) {
  await insertDecision("reset-bantu-approved", kode, note)
}

// Panitia mereset langsung dari kartu tinjauan → password jadi 12345678.
export async function resetHelpByCode(kode: string): Promise<ActionResult> {
  if (!(await isCommittee())) return { ok: false, error: "Tidak diizinkan." }
  const pending = await getPendingResetHelp()
  const req = pending.find((h) => h.kode === kode.toUpperCase())
  if (!req) return { ok: false, error: "Permintaan tidak ditemukan / sudah diproses." }

  const [p] = await db
    .select({ id: participants.id, nama: participants.nama })
    .from(participants)
    .where(and(eq(participants.kelas, req.kelas), eq(participants.nomorPresensi, req.nomor)))
    .limit(1)
  if (!p) return { ok: false, error: "Peserta tidak ditemukan." }

  await db.update(participants).set({ passwordHash: hashPassword("12345678") }).where(eq(participants.id, p.id))
  await insertDecision("reset-bantu-approved", req.kode, `disetujui-${p.nama}`)
  logActivity("PANITIA", "reset-password-bantuan", `${req.kelas}/${req.nomor} (${p.nama})`)
  revalidatePath("/")
  return { ok: true }
}

// Panitia menghapus permintaan tanpa mereset password (peserta bisa cek alasannya).
export async function deleteHelpByCode(kode: string): Promise<ActionResult> {
  if (!(await isCommittee())) return { ok: false, error: "Tidak diizinkan." }
  await insertDecision("reset-bantu-ignored", kode.toUpperCase(), "dihapus-panitia")
  logActivity("PANITIA", "hapus-permintaan-reset", kode.toUpperCase())
  revalidatePath("/")
  return { ok: true }
}
