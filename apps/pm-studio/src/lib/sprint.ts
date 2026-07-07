import type { PlannedSprint, SprintStatus, StatusType } from "@/types";

/** Sprint status → label + StatusBadge color (single source). */
export const SPRINT_STATUS: Record<
  SprintStatus,
  { label: string; status: StatusType }
> = {
  planned: { label: "Geplant", status: "idle" },
  active: { label: "Aktiv", status: "running" },
  done: { label: "Abgeschlossen", status: "success" },
};

/** Ordered status options for selects. */
export const SPRINT_STATUS_ORDER: SprintStatus[] = ["planned", "active", "done"];

/**
 * True when `today` falls within the sprint's timebox (start ≤ today ≤ end),
 * derived purely from the dates – independent of the manually set status.
 * All arguments are ISO dates (`YYYY-MM-DD`); lexicographic compare is safe
 * for that format, so no Date/timezone juggling is needed. Sprints without a
 * full timebox are never "active".
 */
export function isActiveSprint(sprint: PlannedSprint, today: string): boolean {
  const { startDate, endDate } = sprint;
  if (!startDate || !endDate) return false;
  return startDate <= today && today <= endDate;
}

/** Format an ISO date (`YYYY-MM-DD`) as compact `DD.MM.`; "" if missing. */
function shortDate(iso?: string): string {
  if (!iso) return "";
  const [, month, day] = iso.split("-");
  if (!month || !day) return "";
  return `${day}.${month}.`;
}

/**
 * Compact human range for a sprint's timebox, e.g. "01.07.–14.07.".
 * Falls back to "ab …"/"bis …" for a one-sided box and "" for none.
 */
export function formatSprintRange(sprint: PlannedSprint): string {
  const start = shortDate(sprint.startDate);
  const end = shortDate(sprint.endDate);
  if (start && end) return `${start}–${end}`;
  if (start) return `ab ${start}`;
  if (end) return `bis ${end}`;
  return "";
}
