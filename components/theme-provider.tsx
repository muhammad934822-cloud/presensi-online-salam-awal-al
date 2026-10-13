"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { Component, type ReactNode } from "react"
import { Moon, Sun } from "lucide-react"

type Theme = "dark" | "light"

const ThemeCtx = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "dark",
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeCtx)
}

function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === "light") {
    root.classList.add("theme-light")
    root.classList.remove("dark")
  } else {
    root.classList.remove("theme-light")
    root.classList.add("dark")
  }
  try {
    localStorage.setItem("presensi-theme", t)
  } catch {}
}

// Baca tema dari DOM (di-set oleh inline script di layout sebelum React mount).
function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark"
  return document.documentElement.classList.contains("theme-light") ? "light" : "dark"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  // Sinkronkan sekali saat mount (mis. jika user mengubah via devtools / tab lain).
  useEffect(() => {
    const t = readInitialTheme()
    setTheme((prev) => (prev === t ? prev : t))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark"
      applyTheme(next)
      return next
    })
  }, [])

  return <ThemeCtx.Provider value={{ theme, toggleTheme }}>{children}</ThemeCtx.Provider>
}

/* ---------- Error Boundary global ----------
   Menangkap error render React (mis. crash tak terduga) supaya halaman
   tetap tampil dengan pesan ramah + tombol muat ulang, bukan layar kosong. */
class GlobalErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.error("Error boundary menangkap:", error)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,var(--gold),var(--purple))] text-2xl shadow-xl">
            ⚠️
          </span>
          <h2 className="font-serif text-xl font-bold text-foreground">Terjadi kesalahan tampilan</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Halaman tidak dapat dimuat. Coba muat ulang — data presensimu tetap aman tersimpan di database.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="min-h-12 rounded-2xl bg-[linear-gradient(100deg,var(--gold),var(--purple))] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95"
          >
            Muat Ulang
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GlobalErrorBoundary>
      <ThemeProvider>{children}</ThemeProvider>
    </GlobalErrorBoundary>
  )
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap"}
      className={
        "relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-white/[0.05] text-foreground transition-all duration-300 hover:-translate-y-px hover:border-[var(--gold)]/60 hover:bg-white/10 active:scale-95 " +
        className
      }
    >
      <Moon
        className={
          "absolute h-4.5 w-4.5 transition-all duration-500 " +
          (theme === "dark" ? "translate-y-0 rotate-0 opacity-100" : "-translate-y-7 -rotate-90 opacity-0")
        }
      />
      <Sun
        className={
          "absolute h-4.5 w-4.5 text-[var(--gold)] transition-all duration-500 " +
          (theme === "light" ? "translate-y-0 rotate-0 opacity-100" : "translate-y-7 rotate-90 opacity-0")
        }
      />
    </button>
  )
}
