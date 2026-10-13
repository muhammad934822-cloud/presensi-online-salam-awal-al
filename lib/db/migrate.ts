import { pool } from "./index"

/**
 * Migrasi ringan & idempoten: membuat tabel activity_log jika belum ada.
 *
 * - HANYA menambah tabel baru — tidak menyentuh kolom/tabel/data yang sudah ada.
 * - Aman dijalankan berkali-kali (CREATE TABLE IF NOT EXISTS).
 * - Jika gagal, fungsi mengembalikan false tanpa melempar error ke pemanggil,
 *   sehingga fitur audit bersifat opsional dan tidak pernah menjatuhkan aplikasi.
 */
const ENSURE_SQL = `
CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor text NOT NULL,
  action text NOT NULL,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log (created_at DESC);
`

let done: Promise<boolean> | null = null

export function ensureActivityLog(): Promise<boolean> {
  // Cache hasil per proses agar query hanya jalan sekali.
  return (done ??= (async () => {
    try {
      await pool.query(ENSURE_SQL)
      return true
    } catch {
      return false
    }
  })())
}
