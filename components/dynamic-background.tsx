export function DynamicBackground() {
  return (
    <div aria-hidden className="grain pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Rainbow aurora — six drifting color blobs sweeping the whole hue wheel */}
      <div className="animate-blob absolute -top-32 -right-24 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,oklch(0.78_0.17_30/.22),transparent_65%)] blur-2xl" />
      <div className="animate-blob-slow absolute top-1/3 -left-32 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,oklch(0.72_0.17_85/.2),transparent_65%)] blur-2xl" />
      <div className="animate-blob-slower absolute -bottom-40 right-1/4 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,oklch(0.68_0.16_150/.18),transparent_65%)] blur-2xl" />
      <div className="animate-blob absolute bottom-1/4 left-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,oklch(0.66_0.18_210/.2),transparent_65%)] blur-2xl" />
      <div className="animate-blob-slow absolute top-10 left-1/4 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,oklch(0.6_0.2_290/.22),transparent_65%)] blur-2xl" />
      <div className="animate-blob-slower absolute -top-20 left-1/2 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,oklch(0.68_0.19_340/.2),transparent_65%)] blur-2xl" />

      {/* Slow rainbow sheen across the page */}
      <div className="rainbow-sweep absolute inset-x-0 top-1/3 h-[40rem] opacity-[0.07]" />

      {/* Subtle grid texture */}
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(oklch(0.96_0.008_255/1)_1px,transparent_1px),linear-gradient(90deg,oklch(0.96_0.008_255/1)_1px,transparent_1px)] [background-size:44px_44px]" />

      {/* Glowing top edge + depth vignette */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,oklch(0.09_0.02_255/.7)_100%)]" />
    </div>
  )
}
