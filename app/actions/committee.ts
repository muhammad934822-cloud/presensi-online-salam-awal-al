"use server"

import { db } from "@/lib/db"
import { participants, attendance } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import {
  createCommitteeSession,
  destroyCommitteeSession,
  isCommittee,
} from "@/lib/session"
import { COMMITTEE_PASSWORD } from "@/lib/constants"
import { revalidatePath } from "next/cache"

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

  revalidatePath("/")
  return {
    ok: true,
    nama: p.nama,
    kelas: p.kelas,
    nomor: p.nomorPresensi,
  }
}

export async function deleteParticipant(participantId: string): Promise<ActionResult> {
  if (!(await isCommittee())) return { ok: false, error: "Tidak diizinkan." }
  await db.delete(attendance).where(eq(attendance.participantId, participantId))
  await db.delete(participants).where(eq(participants.id, participantId))
  revalidatePath("/")
  return { ok: true }
}
