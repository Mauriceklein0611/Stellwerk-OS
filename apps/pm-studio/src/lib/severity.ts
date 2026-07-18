import type { Priority, Severity, StatusType } from "@/types";

/**
 * Map a priority/severity level (niedrig/mittel/hoch) to StatusBadge props.
 * Keeps color-coding flowing through <StatusBadge> (the single status-color
 * source) instead of introducing ad-hoc colors.
 */
const LEVEL: Record<Severity, { status: StatusType; label: string }> = {
  hoch: { status: "danger", label: "Hoch" },
  mittel: { status: "warning", label: "Mittel" },
  niedrig: { status: "info", label: "Niedrig" },
};

export function severityBadge(value: Severity | Priority): {
  status: StatusType;
  label: string;
} {
  return LEVEL[value];
}
