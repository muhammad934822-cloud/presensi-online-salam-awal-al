import { GraduationCap } from "lucide-react"

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Presensi</p>
        <h1 className={compact ? "text-lg font-semibold tracking-tight" : "text-xl font-semibold tracking-tight sm:text-2xl"}>
          Salam Awal Al Uswah
        </h1>
      </div>
    </header>
  )
}
