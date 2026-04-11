"use client";

export default function AuthLoader() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-surface overflow-hidden">
      {/* Dot pattern */}
      <div className="fixed inset-0 bg-dot-pattern pointer-events-none" />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] bg-primary/5" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Brand */}
        <span className="font-sans font-extrabold text-sm tracking-widest uppercase text-foreground-muted">
          Task Tracker
        </span>

        {/* Spinner */}
        <div className="w-8 h-8 rounded-full border-2 border-outline border-t-primary animate-spin" />

        {/* Skeleton card */}
        <div className="w-80 bg-surface-container border border-outline p-6 space-y-4 mt-2">
          <div className="h-3 w-2/5 bg-surface-highest rounded animate-pulse" />
          <div className="h-2 w-3/5 bg-surface-highest rounded animate-pulse" />
          <div className="space-y-2 pt-2">
            <div className="h-10 bg-surface-highest rounded animate-pulse" />
            <div className="h-10 bg-surface-highest rounded animate-pulse" />
          </div>
          <div className="h-10 bg-primary/20 rounded animate-pulse" />
        </div>

        <p className="text-xs text-foreground-muted tracking-widest uppercase">
          Authenticating...
        </p>
      </div>
    </div>
  );
}
