import { GraduationCap } from "lucide-react"

export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="animate-rise flex items-center gap-4">
      {/* Logo with slowly rotating conic ring + soft breathing halo */}
      <div className="relative shrink-0">
        <span className="logo-halo absolute -inset-3 rounded-3xl bg-[radial-gradient(circle,var(--gold)_0%,transparent_70%)] opacity-50 blur-lg" aria-hidden="true" />
        <span className="conic-ring absolute -inset-1 rounded-2xl opacity-60 blur-[2px]" aria-hidden="true" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gold)] via-[#c98f3d] to-[var(--purple)] text-white shadow-lg shadow-[var(--gold)]/20">
          <GraduationCap className="h-6 w-6" aria-hidden="true" />
        </div>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gradient-gold">Presensi Online</p>
        <h1 className={compact ? "font-serif text-lg font-semibold tracking-tight" : "font-serif text-2xl font-semibold tracking-tight sm:text-3xl"}>
          Salam Awal <span className="rainbow-flow-text">Al Uswah</span>
        </h1>
      </div>
    </header>
  )
}
