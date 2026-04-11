/**
 * skeletons.jsx
 *
 * Reusable skeleton components for all admin pages.
 * Uses your CSS tokens (bg-surface-high, bg-surface-container)
 * so they automatically respect light/dark mode.
 *
 * Usage:
 *   import { TableSkeleton, StatsSkeleton, UsersSkeleton } from "@/components/skeletons";
 */

// ─── Base pulse block ─────────────────────────────────────────
export function Bone({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-sm bg-surface-high ${className}`} />
  );
}

// ─── Stats row (4 cards) ──────────────────────────────────────
const STATS_GRID = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
};

export function StatsSkeleton({ count = 4 }) {
  const lgCols = STATS_GRID[count] ?? "lg:grid-cols-4";
  return (
    <div className={`grid grid-cols-2 ${lgCols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-outline bg-surface-low p-5 space-y-3"
        >
          <div className="flex justify-between items-center">
            <Bone className="h-2.5 w-24" />
            <Bone className="h-4 w-4" />
          </div>
          <Bone className="h-8 w-16" />
          <Bone className="h-2 w-28" />
        </div>
      ))}
    </div>
  );
}

// ─── Table skeleton ───────────────────────────────────────────
export function TableSkeleton({ rows = 3, cols = 5 }) {
  return (
    <div className="border border-outline bg-surface-low overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-outline bg-surface-container">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-2.5 flex-1" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-outline">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 flex-1">
              <Bone className="h-7 w-7 shrink-0" />
              <Bone className="h-3 w-32" />
            </div>
            {/* Other cols */}
            {Array.from({ length: cols - 1 }).map((_, j) => (
              <Bone key={j} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Search + filter bar skeleton ────────────────────────────
export function FilterSkeleton({ filters = 2 }) {
  return (
    <div className="flex items-center gap-3">
      <Bone className="h-10 flex-1 max-w-sm" />
      {Array.from({ length: filters }).map((_, i) => (
        <Bone key={i} className="h-10 w-32" />
      ))}
    </div>
  );
}

// ─── Page header skeleton ─────────────────────────────────────
export function HeaderSkeleton({ hasButton = true }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Bone className="h-2.5 w-40" />
        <Bone className="h-7 w-32" />
      </div>
      {hasButton && <Bone className="h-10 w-32" />}
    </div>
  );
}

// ─── Dashboard scoreboard skeleton ───────────────────────────
export function ScoreboardSkeleton() {
  return (
    <div className="border border-outline bg-surface-low">
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
        <div className="space-y-1.5">
          <Bone className="h-3 w-44" />
          <Bone className="h-2.5 w-32" />
        </div>
        <Bone className="h-2.5 w-20" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 divide-y xl:divide-y-0 xl:divide-x divide-outline">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-5 space-y-3">
            <div className="flex justify-between">
              <Bone className="h-8 w-8" />
              <Bone className="h-5 w-20" />
            </div>
            <Bone className="h-7 w-16" />
            <Bone className="h-3 w-32" />
            <Bone className="h-2.5 w-24" />
            <Bone className="h-2.5 w-full mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Activity feed skeleton ───────────────────────────────────
export function ActivitySkeleton({ rows = 6 }) {
  return (
    <div className="border border-outline bg-surface-low">
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline">
        <Bone className="h-3 w-36" />
        <Bone className="h-2.5 w-12" />
      </div>
      <div className="divide-y divide-outline">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-6 py-3.5"
          >
            <div className="flex items-center gap-3">
              <Bone className="h-1.5 w-1.5 rounded-full" />
              <div className="space-y-1.5">
                <Bone className="h-2.5 w-36" />
                <Bone className="h-3 w-48" />
              </div>
            </div>
            <Bone className="h-2.5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Card grid skeleton (projects grid view) ─────────────────
export function CardGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="border border-outline bg-surface-low p-5 space-y-4"
        >
          <div className="flex justify-between">
            <div className="space-y-1.5">
              <Bone className="h-2.5 w-20" />
              <Bone className="h-4 w-40" />
            </div>
            <Bone className="h-5 w-20" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-2.5 w-10" />
            </div>
            <Bone className="h-1 w-full" />
            <Bone className="h-2.5 w-24" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-3 w-28" />
            </div>
            <div className="space-y-1.5">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-3 w-20" />
            </div>
          </div>
          <div className="flex justify-between pt-2 border-t border-outline">
            <Bone className="h-3 w-20" />
            <Bone className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Full page skeletons per section ─────────────────────────

export function UsersSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <FilterSkeleton filters={2} />
      <TableSkeleton rows={7} cols={6} />
    </div>
  );
}

export function DepartmentsSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <StatsSkeleton count={3} />
      <FilterSkeleton filters={0} />
      <TableSkeleton rows={6} cols={5} />
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <StatsSkeleton count={4} />
      <FilterSkeleton filters={3} />
      <TableSkeleton rows={6} cols={7} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Bone className="h-2.5 w-28" />
          <Bone className="h-9 w-48" />
        </div>
        <Bone className="h-2.5 w-36" />
      </div>
      <StatsSkeleton count={4} />
      <ScoreboardSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ActivitySkeleton rows={5} />
        <ActivitySkeleton rows={6} />
        <ActivitySkeleton rows={4} />
      </div>
    </div>
  );
}
