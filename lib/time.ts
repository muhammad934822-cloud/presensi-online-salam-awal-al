export function timeAgo(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds} detik lalu`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

// Active if seen within the last 3 minutes.
export function isActiveNow(input: Date | string): boolean {
  const date = typeof input === "string" ? new Date(input) : input
  return Date.now() - date.getTime() < 3 * 60 * 1000
}

export function formatDateTime(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}
