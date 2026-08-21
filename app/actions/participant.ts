"use server"

import { db } from "@/lib/db"
import { participants, attendance, EVENTS } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { hashPassword, verifyPassword, generate16DigitCode } from "@/lib/crypto"
import {
  createParticipantSession,
  destroyParticipantSession,
  getParticipantId,
} from "@/lib/session"
import { KELAS_OPTIONS } from "@/lib/constants"
import { revalidatePath } from "next/cache"

type ActionResult = { ok: boolean; error?: string }

function validKelas(kelas: string) {
  return (KELAS_OPTIONS as readonly string[]).includes(kelas)
}

export async function signUpParticipant(formData: FormData): Promise<ActionResult> {
  const nama = String(formData.get("nama") ?? "").trim().toUpperCase()
  const kelas = String(formData.get("kelas") ?? "").trim()
  const nomorPresensi = Number(formData.get("nomorPresensi"))
  const password = String(formData.get("password") ?? "")
  const kodeUnik = String(formData.get("kodeUnik") ?? "").trim()

  if (!nama) return { ok: false, error: "Nama lengkap wajib diisi." }
  if (!validKelas(kelas)) return { ok: false, error: "Kelas tidak valid." }
  if (!Number.isInteger(nomorPresensi) || nomorPresensi < 1 || nomorPresensi > 37)
    return { ok: false, error: "Nomor presensi harus antara 1 dan 37." }
  if (password.length < 1) return { ok: false, error: "Password wajib diisi." }
  if (kodeUnik.length < 4)
    return { ok: false, error: "Kode unik minimal 4 karakter." }

  // Enforce 1 account per (kelas, nomor presensi)
  const existing = await db
    .select({ id: participants.id })
    .from(participants)
    .where(and(eq(participants.kelas, kelas), eq(participants.nomorPresensi, nomorPresensi)))
    .limit(1)

  if (existing.length > 0)
    return {
      ok: false,
      error: `Akun untuk ${kelas} No. ${nomorPresensi} sudah terdaftar.`,
    }

  const [created] = await db
    .insert(participants)
    .values({
      nama,
      kelas,
      nomorPresensi,
      passwordHash: hashPassword(password),
      kodeUnik,
    })
    .returning({ id: participants.id })

  // Pre-generate one unique 16-digit code per event.
  for (const event of EVENTS) {
    await db.insert(attendance).values({
      participantId: created.id,
      event,
      code: generate16DigitCode(),
    })
  }

  await createParticipantSession(created.id)
  revalidatePath("/")
  return { ok: true }
}

export async function loginParticipant(formData: FormData): Promise<ActionResult> {
  const kelas = String(formData.get("kelas") ?? "").trim()
  const nomorPresensi = Number(formData.get("nomorPresensi"))
  const password = String(formData.get("password") ?? "")

  if (!validKelas(kelas)) return { ok: false, error: "Kelas tidak valid." }
  if (!Number.isInteger(nomorPresensi))
    return { ok: false, error: "Nomor presensi tidak valid." }

  const [p] = await db
    .select()
    .from(participants)
    .where(and(eq(participants.kelas, kelas), eq(participants.nomorPresensi, nomorPresensi)))
    .limit(1)

  if (!p) return { ok: false, error: "Akun tidak ditemukan." }
  if (!verifyPassword(password, p.passwordHash))
    return { ok: false, error: "Password salah." }

  await db
    .update(participants)
    .set({ lastActiveAt: new Date() })
    .where(eq(participants.id, p.id))

  await createParticipantSession(p.id)
  revalidatePath("/")
  return { ok: true }
}

export async function resetPasswordWithKode(formData: FormData): Promise<ActionResult> {
  const kelas = String(formData.get("kelas") ?? "").trim()
  const nomorPresensi = Number(formData.get("nomorPresensi"))
  const kodeUnik = String(formData.get("kodeUnik") ?? "").trim()
  const newPassword = String(formData.get("newPassword") ?? "")

  if (!validKelas(kelas)) return { ok: false, error: "Kelas tidak valid." }
  if (!Number.isInteger(nomorPresensi))
    return { ok: false, error: "Nomor presensi tidak valid." }
  if (newPassword.length < 1)
    return { ok: false, error: "Password baru wajib diisi." }

  const [p] = await db
    .select()
    .from(participants)
    .where(and(eq(participants.kelas, kelas), eq(participants.nomorPresensi, nomorPresensi)))
    .limit(1)

  if (!p) return { ok: false, error: "Akun tidak ditemukan." }
  if (p.kodeUnik !== kodeUnik)
    return { ok: false, error: "Kode unik tidak cocok." }

  await db
    .update(participants)
    .set({ passwordHash: hashPassword(newPassword) })
    .where(eq(participants.id, p.id))

  return { ok: true }
}

export async function logoutParticipant() {
  await destroyParticipantSession()
  revalidatePath("/")
}

export async function touchParticipant() {
  const id = await getParticipantId()
  if (!id) return
  await db
    .update(participants)
    .set({ lastActiveAt: new Date() })
    .where(eq(participants.id, id))
}

// Mark that the participant has displayed a QR / code for a given event.
export async function markQrShown(event: string) {
  const id = await getParticipantId()
  if (!id) return
  await db
    .update(attendance)
    .set({ qrShownAt: new Date() })
    .where(and(eq(attendance.participantId, id), eq(attendance.event, event)))
  await db
    .update(participants)
    .set({ lastActiveAt: new Date() })
    .where(eq(participants.id, id))
}
