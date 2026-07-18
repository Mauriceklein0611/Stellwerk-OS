import { STATUS_STYLES } from "@/components/agents/StatusBadge";
import { cn } from "@/lib/utils";
import type { StatusType } from "@/types";

type ProgressBarProps = {
  /** Current value; clamped into [0, max] for both the fill and ARIA. */
  value: number;
  /** Upper bound. `max <= 0` renders an empty bar (no divide-by-zero). */
  max: number;
  /**
   * Drives the fill color. Reuses the StatusBadge token map so progress colors
   * stay single-sourced with every other status indicator (design-system.md).
   * Defaults to `info`.
   */
  status?: StatusType;
  /** Accessible name for the bar (sets `aria-label`). */
  label?: string;
  className?: string;
};

/**
 * Slim, accessible progress/utilization bar. Pure presentation: callers pass the
 * already-computed value/max (e.g. donePt/plannedPt, assignedPt/capacityPt) and a
 * status that maps to a design token. The fill clamps to 100 % even on overload –
 * the overload itself is conveyed via the `danger` status and the caller's label.
 */
export function ProgressBar({
  value,
  max,
  status = "info",
  label,
  className,
}: ProgressBarProps) {
  const safeMax = Math.max(0, max);
  const safeValue = Math.min(Math.max(0, value), safeMax);
  const ratio = safeMax > 0 ? safeValue / safeMax : 0;
  const pct = Math.round(ratio * 100);
  // STATUS_STYLES.dot is a literal `bg-<token>` class → Tailwind keeps it.
  const fill = STATUS_STYLES[status].dot;

  return (
    <div
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={label}
      data-status={status}
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
    >
      <div
        data-testid="progress-bar-fill"
        className={cn(
          "h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none",
          fill,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
