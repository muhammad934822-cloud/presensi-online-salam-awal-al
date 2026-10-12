export function DynamicBackground() {
  return (
    <div aria-hidden className="grain pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Drifting aurora blobs */}
      <div className="animate-blob absolute -top-32 -right-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,oklch(0.78_0.14_82/.16),transparent_65%)] blur-2xl" />
      <div className="animate-blob-slow absolute top-1/3 -left-32 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,oklch(0.54_0.1_290/.2),transparent_65%)] blur-2xl" />
      <div className="animate-blob-slower absolute -bottom-40 right-1/4 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,oklch(0.68_0.12_235/.16),transparent_65%)] blur-2xl" />

      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(oklch(0.96_0.008_255/1)_1px,transparent_1px),linear-gradient(90deg,oklch(0.96_0.008_255/1)_1px,transparent_1px)] [background-size:44px_44px]" />

      {/* Glowing top edge + depth vignette */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,oklch(0.09_0.02_255/.7)_100%)]" />
    </div>
  )
}
