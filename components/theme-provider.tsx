"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
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
  if (t === "light") root.classList.add("theme-light")
  else root.classList.remove("theme-light")
  try {
    localStorage.setItem("presensi-theme", t)
  } catch {}
}

// Inline script in <body> sets the initial class before React mounts.
function readInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  try {
    const saved = localStorage.getItem("presensi-theme")
    if (saved === "light" || saved === "dark") return saved
  } catch {}
  return document.documentElement.classList.contains("theme-light") ? "light" : "dark"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    setTheme(readInitialTheme())
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
