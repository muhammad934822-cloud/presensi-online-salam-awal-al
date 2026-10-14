"use client"

/* ============================================================
   lib/sound.ts — Sound feedback ringan berbasis Web Audio API.
   Tidak memakai file audio sama sekali (hemat bandwidth, tanpa
   aset eksternal). Semua fungsi aman dipanggil berkali-kali dan
   tidak pernah melempar error (fallback diam jika browser tidak
   mendukung / volume dimatikan pengguna).

   Preferensi "suara" disimpan di localStorage per perangkat:
     presensi-sound = "on" | "off"  (default: on)
   ============================================================ */

const PREF_KEY = "presensi-sound"

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!ctx || ctx.state === "closed") ctx = new Ctor()
    if (ctx.state === "suspended") void ctx.resume().catch(() => {})
    return ctx
  } catch {
    return null
  }
}

/** Apakah suara sedang aktif (pref default ON). Aman di SSR. */
export function isSoundOn(): boolean {
  if (typeof window === "undefined") return true
  try {
    return localStorage.getItem(PREF_KEY) !== "off"
  } catch {
    return true
  }
}

export function setSoundOn(on: boolean) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off")
  } catch {
    /* private mode — abaikan */
  }
}

type ToneOpts = { freq: number; start: number; dur: number; gain?: number; type?: OscillatorType }

function playTones(tones: ToneOpts[]) {
  if (!isSoundOn()) return
  const ac = getCtx()
  if (!ac) return
  try {
    for (const t of tones) {
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = t.type ?? "sine"
      osc.frequency.value = t.freq
      const v = t.gain ?? 0.16
      g.gain.setValueAtTime(0.0001, ac.currentTime + t.start)
      g.gain.exponentialRampToValueAtTime(v, ac.currentTime + t.start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t.start + t.dur)
      osc.connect(g).connect(ac.destination)
      osc.start(ac.currentTime + t.start)
      osc.stop(ac.currentTime + t.start + t.dur + 0.05)
    }
  } catch {
    /* diam total jika gagal */
  }
}

/** Presensi BARU berhasil — triad naik yang ceria & nyaring (C5-E5-G5-C6). */
export function playSuccess() {
  playTones([
    { freq: 523.25, start: 0, dur: 0.14 },
    { freq: 659.25, start: 0.12, dur: 0.14 },
    { freq: 783.99, start: 0.24, dur: 0.16 },
    { freq: 1046.5, start: 0.36, dur: 0.3, gain: 0.2 },
  ])
}

/** Sudah terverifikasi sebelumnya — dua nada lembut (A4-F#4). */
export function playAlready() {
  playTones([
    { freq: 440, start: 0, dur: 0.16, gain: 0.12, type: "triangle" },
    { freq: 370, start: 0.14, dur: 0.22, gain: 0.12, type: "triangle" },
  ])
}

/** Scan GAGAL / kode salah — dua nada rendah tegas (G4-D4). */
export function playError() {
  playTones([
    { freq: 392, start: 0, dur: 0.16, gain: 0.15, type: "square" },
    { freq: 293.66, start: 0.15, dur: 0.26, gain: 0.15, type: "square" },
  ])
}

/** Klik tombol kecil / tes suara — satu nada pendek. */
export function playClick() {
  playTones([{ freq: 880, start: 0, dur: 0.09, gain: 0.1 }])
}

/** Ada permintaan reset baru masuk (panitia) — dua nada lonceng lembut ke atas. */
export function playIncoming() {
  playTones([
    { freq: 659.25, start: 0, dur: 0.14, gain: 0.13, type: "triangle" },
    { freq: 880, start: 0.14, dur: 0.22, gain: 0.13, type: "triangle" },
  ])
}

/** Keputusan permintaan keluar (peserta): disetujui — triad naik singkat. */
export function playApproved() {
  playTones([
    { freq: 523.25, start: 0, dur: 0.12, gain: 0.14 },
    { freq: 783.99, start: 0.12, dur: 0.22, gain: 0.16 },
  ])
}

/** Keputusan permintaan keluar (peserta): ditolak/dihapus — turun tegas. */
export function playRejected() {
  playTones([
    { freq: 415.3, start: 0, dur: 0.14, gain: 0.13, type: "triangle" },
    { freq: 311.13, start: 0.14, dur: 0.24, gain: 0.13, type: "triangle" },
  ])
}
