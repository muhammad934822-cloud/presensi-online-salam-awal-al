export function DynamicBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.25_0.04_235/.28),transparent_38%),radial-gradient(circle_at_bottom_left,oklch(0.22_0.035_290/.24),transparent_42%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-primary/30" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,oklch(0.12_0.018_255/.35)_72%,oklch(0.12_0.018_255/.8)_100%)]" />
    </div>
  )
}
