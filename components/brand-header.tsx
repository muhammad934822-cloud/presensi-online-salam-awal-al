export function BrandHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className="flex flex-col items-center text-center">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-medium tracking-wide text-foreground/80 backdrop-blur">
        <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--blue)]" />
        Presensi Online
      </div>
      <h1
        className={
          "text-balance bg-gradient-to-r from-[var(--gold)] via-[var(--purple)] to-[var(--blue)] bg-clip-text font-serif font-semibold text-transparent " +
          (compact ? "text-2xl" : "text-3xl sm:text-4xl")
        }
      >
        Presensi Online Salam Awal Al-Uswah
      </h1>
    </header>
  )
}
