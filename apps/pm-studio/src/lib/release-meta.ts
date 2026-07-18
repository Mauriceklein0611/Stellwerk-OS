import type { ReleaseStatus, SprintLengthWeeks, StatusType } from "@/types";

/**
 * Release status → label + StatusBadge color (single source, TASK-041). Mirrors
 * `SPRINT_STATUS` in `src/lib/sprint.ts` so release and sprint badges stay
 * visually consistent.
 */
export const RELEASE_STATUS: Record<
  ReleaseStatus,
  { label: string; status: StatusType }
> = {
  planned: { label: "Geplant", status: "idle" },
  active: { label: "Aktiv", status: "running" },
  done: { label: "Abgeschlossen", status: "success" },
};

/** Ordered status options for selects. */
export const RELEASE_STATUS_ORDER: ReleaseStatus[] = ["planned", "active", "done"];

/** Selectable sprint lengths (weeks), in order. */
export const SPRINT_LENGTH_OPTIONS: SprintLengthWeeks[] = [1, 2, 3, 4];

/** Human label for a sprint length. */
export const SPRINT_LENGTH_LABEL: Record<SprintLengthWeeks, string> = {
  1: "1 Woche",
  2: "2 Wochen",
  3: "3 Wochen",
  4: "4 Wochen",
};

/** Format an ISO date (`YYYY-MM-DD`) as `DD.MM.YYYY`; "" if missing/malformed. */
function fullDate(iso?: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${day}.${month}.${year}`;
}

/** Compact human range for a release, e.g. "01.07.2026 – 30.09.2026". */
export function formatReleaseRange(startDate: string, endDate: string): string {
  const start = fullDate(startDate);
  const end = fullDate(endDate);
  if (start && end) return `${start} – ${end}`;
  return start || end;
}
