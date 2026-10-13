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
import { logActivity } from "@/lib/queries"

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

// Ganti nama peserta yang sedang login (kolom `nama` yang sudah ada).
export async function updateParticipantName(formData: FormData): Promise<ActionResult> {
  const id = await getParticipantId()
  if (!id) return { ok: false, error: "Sesi tidak valid." }

  const nama = String(formData.get("nama") ?? "").trim().toUpperCase()
  if (nama.length < 3) return { ok: false, error: "Nama baru minimal 3 karakter." }
  if (nama.length > 60) return { ok: false, error: "Nama terlalu panjang." }

  await db.update(participants).set({ nama }).where(eq(participants.id, id))
  logActivity(nama, "ganti-nama")
  revalidatePath("/")
  return { ok: true }
}

// Ganti password peserta yang sedang login — diverifikasi dengan PASSWORD LAMA
// ATAU KODE UNIK akun (salah satu cukup). Hanya memakai kolom `password_hash`
// & `kode_unik` yang sudah ada — skema DB tidak berubah.
export async function changePasswordSelf(formData: FormData): Promise<ActionResult> {
  const id = await getParticipantId()
  if (!id) return { ok: false, error: "Sesi tidak valid." }

  const oldPassword = String(formData.get("oldPassword") ?? "")
  const kodeUnik = String(formData.get("kodeUnik") ?? "").trim()
  const newPassword = String(formData.get("newPassword") ?? "")

  if (!oldPassword && !kodeUnik)
    return { ok: false, error: "Isi password lama atau kode unik untuk verifikasi." }
  if (newPassword.length < 6) return { ok: false, error: "Password baru minimal 6 karakter." }

  const [p] = await db.select().from(participants).where(eq(participants.id, id)).limit(1)
  if (!p) return { ok: false, error: "Akun tidak ditemukan." }

  // Verifikasi: cocokkan password lama (hash) ATAU kode unik (plaintext existing column).
  const passLamaCocok = oldPassword ? verifyPassword(oldPassword, p.passwordHash) : false
  const kodeCocok = kodeUnik ? p.kodeUnik === kodeUnik : false
  if (!passLamaCocok && !kodeCocok)
    return { ok: false, error: "Verifikasi gagal — password lama & kode unik tidak cocok. Password tidak diganti." }

  await db
    .update(participants)
    .set({ passwordHash: hashPassword(newPassword), lastActiveAt: new Date() })
    .where(eq(participants.id, id))
  logActivity(p.nama, "ganti-password", passLamaCocok ? "verifikasi: password lama" : "verifikasi: kode unik")
  revalidatePath("/")
  return { ok: true }
}

// Query baca RINGAN untuk polling klien: status kehadiran + waktu verifikasi
// per kegiatan. Dipakai peserta untuk mendeteksi "baru saja discan" secara
// realtime (suara + selebrasi) tanpa re-render seluruh dashboard.
// Tidak mengubah skema/tabel apa pun — hanya SELECT kolom yang sudah ada.
export async function getMyAttendanceStatus(): Promise<
  { event: string; verifiedAt: Date | null }[]
> {
  const id = await getParticipantId()
  if (!id) return []
  const rows = await db
    .select({ event: attendance.event, verifiedAt: attendance.verifiedAt })
    .from(attendance)
    .where(eq(attendance.participantId, id))
  return rows.map((r) => ({ event: r.event, verifiedAt: r.verifiedAt }))
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
