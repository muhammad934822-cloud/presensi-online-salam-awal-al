import { pgTable, uuid, text, integer, timestamp, unique } from "drizzle-orm/pg-core"

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nama: text("nama").notNull(),
    kelas: text("kelas").notNull(),
    nomorPresensi: integer("nomor_presensi").notNull(),
    passwordHash: text("password_hash").notNull(),
    kodeUnik: text("kode_unik").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uqKelasNomor: unique("uq_kelas_nomor").on(t.kelas, t.nomorPresensi),
  }),
)

export const attendance = pgTable(
  "attendance",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id").notNull(),
    event: text("event").notNull(),
    code: text("code").notNull(),
    qrShownAt: timestamp("qr_shown_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uqParticipantEvent: unique("uq_participant_event").on(t.participantId, t.event),
  }),
)

export type Participant = typeof participants.$inferSelect
export type Attendance = typeof attendance.$inferSelect

export const EVENTS = ["studium_generale", "mabit", "konsumsi"] as const
export type EventKey = (typeof EVENTS)[number]

export const EVENT_LABELS: Record<EventKey, string> = {
  studium_generale: "Studium Generale",
  mabit: "Kehadiran MABIT",
  konsumsi: "Konsumsi MABIT",
}
