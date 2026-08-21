import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "crypto"

// Server-only signing key derived from the database connection string.
// Stable across restarts, never exposed to the client.
const SIGNING_KEY = process.env.DATABASE_URL ?? "insecure-dev-key-change-me"

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, "hex")
  const testBuf = scryptSync(password, salt, 64)
  if (hashBuf.length !== testBuf.length) return false
  return timingSafeEqual(hashBuf, testBuf)
}

// 16-digit numeric code, unique per participant/event.
export function generate16DigitCode(): string {
  let code = ""
  for (let i = 0; i < 16; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

// HMAC-signed cookie value: `${payload}.${signature}`
export function signValue(payload: string): string {
  const sig = createHmac("sha256", SIGNING_KEY).update(payload).digest("hex")
  return `${payload}.${sig}`
}

export function verifySignedValue(signed: string | undefined): string | null {
  if (!signed) return null
  const idx = signed.lastIndexOf(".")
  if (idx === -1) return null
  const payload = signed.slice(0, idx)
  const sig = signed.slice(idx + 1)
  const expected = createHmac("sha256", SIGNING_KEY).update(payload).digest("hex")
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  return timingSafeEqual(a, b) ? payload : null
}
