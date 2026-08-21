export function DynamicBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Base generated gradient image, slowly panning */}
      <div
        className="animate-bg-pan absolute inset-0 bg-cover bg-center opacity-60"
        style={{ backgroundImage: "url(/images/bg-gradient.png)" }}
      />
      {/* Aurora light blobs in the brand palette */}
      <div className="animate-aurora absolute -left-24 -top-24 h-[55vh] w-[55vh] rounded-full bg-[var(--gold)] opacity-25 blur-[90px]" />
      <div className="animate-aurora-slow absolute -right-28 top-1/3 h-[60vh] w-[60vh] rounded-full bg-[var(--purple)] opacity-30 blur-[100px]" />
      <div className="animate-aurora absolute bottom-[-15vh] left-1/4 h-[50vh] w-[50vh] rounded-full bg-[var(--blue)] opacity-25 blur-[90px]" />
      {/* Darkening vignette for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/40 to-background/80" />
    </div>
  )
}
