import { CalendarClock } from "lucide-react";

import { STATUS_STYLES } from "@/components/agents/StatusBadge";
import { DUE_STATUS_TOKEN, dueStatus, formatDueDate } from "@/lib/due";
import { cn } from "@/lib/utils";

type DueBadgeProps = {
  /** ISO due date (`YYYY-MM-DD`); nothing renders when missing. */
  dueDate?: string;
  /** Client-side "today" (ISO), passed in past the hydration gate (SSR-safe). */
  today: string;
  /** Whether the task is in a terminal/done column (then never overdue). */
  done: boolean;
  className?: string;
};

/**
 * Compact due-date chip (TASK-034). Shows the date as `DD.MM.` with a calendar
 * icon; overdue/today get a warning tone, everything else stays neutral. Colors
 * come single-sourced from `STATUS_STYLES` (same source as `<StatusBadge>`),
 * the classification is pure logic in `src/lib/due.ts`.
 */
export function DueBadge({ dueDate, today, done, className }: DueBadgeProps) {
  if (!dueDate) return null;

  const status = dueStatus(dueDate, today, done);
  const token = DUE_STATUS_TOKEN[status];
  const style = token ? STATUS_STYLES[token] : undefined;

  return (
    <span
      data-testid="task-due"
      data-due-status={status}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        style ? cn(style.bg, style.text) : "bg-secondary text-muted-foreground",
        className,
      )}
    >
      <CalendarClock className="size-3" aria-hidden />
      {formatDueDate(dueDate)}
    </span>
  );
}
