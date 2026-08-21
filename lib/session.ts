import { cookies } from "next/headers"
import { db } from "./db"
import { participants } from "./db/schema"
import { eq } from "drizzle-orm"
import { signValue, verifySignedValue } from "./crypto"
import { PARTICIPANT_COOKIE, COMMITTEE_COOKIE } from "./constants"

const ONE_YEAR = 60 * 60 * 24 * 365

export async function createParticipantSession(participantId: string) {
  const store = await cookies()
  store.set(PARTICIPANT_COOKIE, signValue(participantId), {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: ONE_YEAR,
  })
}

export async function destroyParticipantSession() {
  const store = await cookies()
  store.delete(PARTICIPANT_COOKIE)
}

export async function getParticipantId(): Promise<string | null> {
  const store = await cookies()
  return verifySignedValue(store.get(PARTICIPANT_COOKIE)?.value)
}

export async function getCurrentParticipant() {
  const id = await getParticipantId()
  if (!id) return null
  const [p] = await db.select().from(participants).where(eq(participants.id, id)).limit(1)
  return p ?? null
}

export async function createCommitteeSession() {
  const store = await cookies()
  store.set(COMMITTEE_COOKIE, signValue("panitia"), {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: ONE_YEAR,
  })
}

export async function destroyCommitteeSession() {
  const store = await cookies()
  store.delete(COMMITTEE_COOKIE)
}

export async function isCommittee(): Promise<boolean> {
  const store = await cookies()
  return verifySignedValue(store.get(COMMITTEE_COOKIE)?.value) === "panitia"
}
