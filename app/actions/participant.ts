"use server"

import { db } from "@/lib/db"
import { activityLog } from "@/lib/db/schema"
import { participants, attendance, EVENTS } from "@/lib/db/schema"
import { and, desc, eq, sql } from "drizzle-orm"
import { hashPassword, verifyPassword, generate16DigitCode } from "@/lib/crypto"
import {
  createParticipantSession,
  destroyParticipantSession,
  getParticipantId,
  isCommittee,
} from "@/lib/session"
import { KELAS_OPTIONS } from "@/lib/constants"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/queries"
import { ensureActivityLog } from "@/lib/db/migrate"

type ActionResult = {
  ok: boolean
  error?: string
  maskedPhone?: string
  waitedMinutes?: number
  kodeTinjau?: string
  status?: "pending" | "approved" | "ignored"
}

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

// Reset password mandiri dengan KODE UNIK — hanya untuk akun yang belum
// sempat login sama sekali (belum ada sesi). Kalau sudah login, pakai
// changePasswordSelf di Pengaturan. Memakai kolom existing saja.
export async function resetPasswordWithKode(formData: FormData): Promise<ActionResult> {
  const kelas = String(formData.get("kelas") ?? "").trim()
  const nomorPresensi = Number(formData.get("nomorPresensi"))
  const kodeUnik = String(formData.get("kodeUnik") ?? "").trim()
  const newPassword = String(formData.get("newPassword") ?? "")

  if (!validKelas(kelas)) return { ok: false, error: "Kelas tidak valid." }
  if (!Number.isInteger(nomorPresensi))
    return { ok: false, error: "Nomor presensi tidak valid." }
  if (newPassword.length < 6)
    return { ok: false, error: "Password baru minimal 6 karakter." }

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

  // Sinyal "sudah selesai" utk permintaan bantu (deteksi otomatis di sisi panitia).
  logActivity(p.nama, "ganti-password", `reset-mandiri:${p.id}`)
  revalidatePath("/")
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* Permintaan bantu "Lupa Kode Unik" (alur sederhana via panitia)      */
/* Disimpan di tabel activity_log yang SUDAH ADA sebagai record         */
/* berformat khusus — TIDAK menambah tabel/kolom DB apa pun.           */
/* ------------------------------------------------------------------ */

/* Format record di activity_log (tabel SUDAH ADA — tanpa skema baru):
   permintaan : detail = "RESET-BANTU::<kode>::<nama>::<kelas>::<nomor>::<hp>"
   keputusan  : action = "reset-bantu-approved" | "reset-bantu-ignored"
                detail = "RESET-DECISION::<kode>::<ket>"
   <kode> adalah kode tinjau 6 karakter (huruf besar + angka) yang dipakai
   peserta untuk memantau status permintaannya lewat menu "Tinjau Permintaan". */
const HELP_PREFIX = "RESET-BANTU::"
const DECISION_PREFIX = "RESET-DECISION::"
const PHONE_RE = /^08\d{8,12}$/

function maskPhone(phone: string): string {
  // 08xx…xxxx -> 08xx****xxxx (disembunyikan sebagian)
  if (phone.length <= 8) return `${phone.slice(0, 3)}****`
  return `${phone.slice(0, 4)}****${phone.slice(-4)}`
}

/** Kode tinjau 6 karakter acak (tanpa huruf/angka yang mudah tertukar). */
function generateKodeTinjau(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let out = ""
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return out
}

type HelpRecord = {
  kode: string
  nama: string
  kelas: string
  nomor: number
  phone: string
  createdAt: Date
  status: "pending" | "approved" | "ignored"
  decidedAt?: Date
  note?: string
}

async function readAllHelpRecords(): Promise<HelpRecord[]> {
  await ensureActivityLog()
  const rows = await db
    .select()
    .from(activityLog)
    .where(sql`${activityLog.detail} LIKE ${HELP_PREFIX + "%"} OR ${activityLog.detail} LIKE ${DECISION_PREFIX + "%"}`)
    .orderBy(desc(activityLog.createdAt))
    .limit(500)

  // Kumpulkan keputusan per kode dulu (bisa lebih dari satu; ambil terbaru).
  const decisions = new Map<string, { action: string; at: Date; note: string }>()
  for (const r of rows) {
    if (!r.detail?.startsWith(DECISION_PREFIX)) continue
    const [kode, ...rest] = r.detail.slice(DECISION_PREFIX.length).split("::")
    if (!kode) continue
    if (!decisions.has(kode)) decisions.set(kode, { action: r.action, at: r.createdAt, note: rest.join("::") })
  }

  const seen = new Set<string>()
  const out: HelpRecord[] = []
  for (const r of rows) {
    if (!r.detail?.startsWith(HELP_PREFIX)) continue
    const [kode, nama, kelas, nomor, phone] = r.detail.slice(HELP_PREFIX.length).split("::")
    if (!kode || !nama || !kelas || !nomor || !phone) continue
    const key = `${kelas}-${nomor}`
    if (seen.has(key)) continue // satu permintaan aktif per akun (yang terbaru)
    seen.add(key)
    const dec = decisions.get(kode)
    out.push({
      kode,
      nama,
      kelas,
      nomor: Number(nomor),
      phone,
      createdAt: r.createdAt,
      status: dec ? (dec.action === "reset-bantu-approved" ? "approved" : "ignored") : "pending",
      decidedAt: dec?.at,
      note: dec?.note,
    })
  }
  return out
}

// Peserta mengirim permintaan reset dibantu panitia (dengan nomor HP).
export async function requestResetHelp(formData: FormData): Promise<ActionResult> {
  const kelas = String(formData.get("kelas") ?? "").trim()
  const nomorPresensi = Number(formData.get("nomorPresensi"))
  const phone = String(formData.get("phone") ?? "").replace(/[\s-]/g, "")

  if (!validKelas(kelas)) return { ok: false, error: "Kelas tidak valid." }
  if (!Number.isInteger(nomorPresensi))
    return { ok: false, error: "Nomor presensi tidak valid." }
  if (!PHONE_RE.test(phone))
    return { ok: false, error: "Nomor HP tidak valid. Contoh: 08xxxxxxxxxx." }

  const [p] = await db
    .select({ id: participants.id, nama: participants.nama })
    .from(participants)
    .where(and(eq(participants.kelas, kelas), eq(participants.nomorPresensi, nomorPresensi)))
    .limit(1)
  if (!p) return { ok: false, error: "Akun tidak ditemukan. Periksa kelas & nomor presensi." }

  const existing = await readAllHelpRecords()
  const active = existing.find((h) => h.kelas === kelas && h.nomor === nomorPresensi)
  if (active) {
    return {
      ok: true,
      kodeTinjau: active.kode,
      maskedPhone: maskPhone(active.phone),
      waitedMinutes: Math.floor((Date.now() - active.createdAt.getTime()) / 60000),
      status: active.status,
    }
  }

  const kode = generateKodeTinjau()
  await db.insert(activityLog).values({
    actor: p.nama,
    action: "reset-bantu",
    detail: `${HELP_PREFIX}${kode}::${p.nama}::${kelas}::${nomorPresensi}::${phone}`,
  })
  revalidatePath("/")
  return {
    ok: true,
    kodeTinjau: kode,
    maskedPhone: maskPhone(phone),
    waitedMinutes: 0,
    status: "pending",
  }
}

// Peserta mengecek status permintaan lewat KODE TINJAU (menu "Tinjau Permintaan").
export async function checkResetHelpByKode(kodeTinjauRaw: string): Promise<ActionResult & { found?: boolean }> {
  const kode = kodeTinjauRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (kode.length !== 6) return { ok: false, error: "Kode tinjau harus 6 karakter (contoh: A7B2C9)." }
  const records = await readAllHelpRecords()
  const mine = records.find((h) => h.kode === kode)
  if (!mine) return { ok: true, found: false, error: "Kode tidak ditemukan. Pastikan kode tinjau kamu benar." }
  return {
    ok: true,
    found: true,
    kodeTinjau: mine.kode,
    maskedPhone: maskPhone(mine.phone),
    waitedMinutes: Math.max(0, Math.floor((Date.now() - mine.createdAt.getTime()) / 60000)),
    status: mine.status,
  }
}

// Peserta membatalkan permintaannya sendiri lewat kode tinjau.
export async function cancelResetHelpByKode(kodeTinjauRaw: string): Promise<ActionResult> {
  const kode = kodeTinjauRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (kode.length !== 6) return { ok: false, error: "Kode tinjau harus 6 karakter." }
  const records = await readAllHelpRecords()
  const mine = records.find((h) => h.kode === kode)
  if (!mine) return { ok: false, error: "Kode tidak ditemukan." }
  if (mine.status !== "pending") return { ok: false, error: "Permintaan sudah diproses dan tidak bisa dibatalkan." }
  await ensureActivityLog()
  await db.insert(activityLog).values({
    actor: mine.nama,
    action: "reset-bantu-ignored",
    detail: `${DECISION_PREFIX}${kode}::dibatalkan-peserta`,
  })
  revalidatePath("/")
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
  // Sertakan id peserta → dipakai deteksi otomatis permintaan bantu panitia.
  logActivity(p.nama, "ganti-password", `${passLamaCocok ? "verifikasi: password lama" : "verifikasi: kode unik"} · ${id}`)
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
