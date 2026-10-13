// Batas waktu presensi per kegiatan.
// Ini adalah SATU-SATUNYA sumber kebenaran untuk jam penutupan presensi:
// dipakai oleh validasi server (app/actions/committee.ts) dan label tampilan.
// Zona waktu yang dipakai panitia/peserta pada hari-H: WITA (Asia/Makassar).

export const PRESENSE_DEADLINE: Record<string, string> = {
  studium_generale: "16:00",
  mabit: "23:00",
  konsumsi: "09:00",
}

/** True jika presensi untuk `event` sudah lewat batas waktu (WITA). */
export function isPresenseClosed(event: string): boolean {
  const deadline = PRESENSE_DEADLINE[event]
  if (!deadline) return false
  const [h, m] = deadline.split(":").map(Number)
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Makassar" }),
  )
  return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)
}
