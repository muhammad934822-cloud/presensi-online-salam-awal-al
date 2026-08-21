"use client"

import { cn } from "@/lib/utils"
import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes } from "react"

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl",
        "shadow-black/40",
        className,
      )}
    >
      {children}
    </div>
  )
}

const inputBase =
  "w-full rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-base text-foreground " +
  "placeholder:text-muted-foreground outline-none transition focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/40"

export function TextField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground/90">{label}</span>
      <input className={cn(inputBase, className)} {...props} />
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
      <select
        className={cn(inputBase, "appearance-none bg-[var(--background)]/40", className)}
        {...props}
      >
        {children}
      </select>
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
        "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold",
        "bg-gradient-to-r from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] text-white",
        "shadow-lg shadow-[var(--purple)]/30 transition active:scale-[0.98] disabled:opacity-60",
        className,
      )}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  )
}
