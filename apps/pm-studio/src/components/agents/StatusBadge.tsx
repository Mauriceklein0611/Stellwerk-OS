import { cn } from "@/lib/utils";
import type { StatusType } from "@/types";

/**
 * Single source of truth for status colors. Every status indicator in the app
 * goes through <StatusBadge> – no component maps a status to a color on its own
 * (see docs/design-system.md). Class strings are literal so Tailwind detects them.
 */
const STATUS_STYLES: Record<
  StatusType,
  { label: string; dot: string; text: string; bg: string }
> = {
  success: { label: "OK", dot: "bg-success", text: "text-success", bg: "bg-success/10" },
  warning: { label: "Warnung", dot: "bg-warning", text: "text-warning", bg: "bg-warning/10" },
  danger: { label: "Kritisch", dot: "bg-danger", text: "text-danger", bg: "bg-danger/10" },
  info: { label: "Info", dot: "bg-info", text: "text-info", bg: "bg-info/10" },
  idle: { label: "Inaktiv", dot: "bg-idle", text: "text-idle", bg: "bg-idle/10" },
  running: { label: "Läuft", dot: "bg-running", text: "text-running", bg: "bg-running/10" },
};

/**
 * Status → design-token CSS variable. Same source/file as STATUS_STYLES so
 * status colors stay single-sourced; used where a literal color value is
 * required (e.g. Recharts chart fills, which can't render a <StatusBadge>).
 */
export const STATUS_COLOR_VARS: Record<StatusType, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
  idle: "var(--idle)",
  running: "var(--running)",
};

type StatusBadgeProps = {
  status: StatusType;
  /** Optional context label; falls back to the status default. */
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        style.bg,
        style.text,
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          style.dot,
          // Pulse only for running; respect reduced-motion (design-system.md).
          status === "running" && "animate-pulse motion-reduce:animate-none",
        )}
      />
      {label ?? style.label}
    </span>
  );
}

export { STATUS_STYLES };
