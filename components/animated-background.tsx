export function AnimatedBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Soft blue/white abstract shapes */}
      <div className="animate-blob absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl" />
      <div className="animate-blob-slow absolute right-[-10%] top-1/4 h-[32rem] w-[32rem] rounded-full bg-chart-2/20 blur-3xl" />
      <div className="animate-blob absolute bottom-[-15%] left-1/3 h-[26rem] w-[26rem] rounded-full bg-chart-3/25 blur-3xl" />
      <div className="animate-blob-slow absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

      {/* Subtle grid overlay to keep things crisp and readable */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_55%,var(--background)_100%)]" />
    </div>
  )
}
