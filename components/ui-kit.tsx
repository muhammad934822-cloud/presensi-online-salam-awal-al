"use client"

import { cn } from "@/lib/utils"
import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react"

export function GlassCard({
  children,
  className,
  glow = false,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div
      className={cn(
        "group relative rounded-3xl",
        // Gradient hairline border wrapper
        "bg-gradient-to-br from-white/20 via-white/5 to-white/15 p-px shadow-2xl backdrop-blur-xl",
        glow && "shadow-[var(--purple)]/25",
        className,
      )}
    >
      <div className="rounded-[calc(1.5rem-1px)] bg-[oklch(0.16_0.024_258/0.82)] p-5">{children}</div>
    </div>
  )
}

const inputBase =
  "peer w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-base text-foreground " +
  "placeholder:text-muted-foreground outline-none transition-all duration-200 " +
  "focus:border-[var(--gold)] focus:bg-white/[0.09] focus:ring-2 focus:ring-[var(--gold)]/40"

export function TextField({
  label,
  hint,
  icon,
  className,
  ...props
}: { label: string; hint?: string; icon?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground/90">{label}</span>
      <span className="relative block">
        {icon ? (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors peer-focus:text-[var(--gold)] [&>svg]:h-4 [&>svg]:w-4">
            {icon}
          </span>
        ) : null}
        <input className={cn(inputBase, icon && "pl-10", className)} {...props} />
      </span>
      {hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

export function SelectField({
  label,
  children,
  className,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground/90">{label}</span>
      <span className="relative block">
        <select
          className={cn(inputBase, "appearance-none bg-[var(--background)]/40 pr-10", className)}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </label>
  )
}

export function GradientButton({
  children,
  className,
  ...props
}: { children: ReactNode } & InputHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "sheen-host inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold",
        "bg-[linear-gradient(100deg,var(--gold),var(--purple)_55%,var(--blue))] bg-[length:200%_100%] bg-left text-white",
        "shadow-lg shadow-[var(--purple)]/30 transition-all duration-300 hover:bg-right hover:shadow-xl hover:shadow-[var(--purple)]/40 active:scale-[0.98] disabled:opacity-60",
        className,
      )}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className,
  ...props
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.05] px-5 py-3 text-base font-semibold text-foreground",
        "transition-all duration-200 hover:-translate-y-px hover:border-white/35 hover:bg-white/10 active:scale-[0.98] disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
