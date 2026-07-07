import type { StatusType } from "@/types";

/**
 * Fälligkeits-Zustand eines Tasks relativ zu „heute" (TASK-034). Reine Logik –
 * keine Komponente entscheidet selbst über Farbe oder Wortlaut.
 *
 * - `overdue`  – Termin liegt in der Vergangenheit und der Task ist offen.
 * - `today`    – Termin ist heute und der Task ist offen.
 * - `upcoming` – Termin in der Zukunft ODER der Task ist erledigt (kein Druck).
 */
export type DueStatus = "overdue" | "today" | "upcoming";

/**
 * Ist der Task überfällig? Nur wahr, wenn ein Termin gesetzt ist, dieser vor
 * `today` liegt und der Task **nicht** erledigt ist. Alle Datumsargumente sind
 * ISO-Daten (`YYYY-MM-DD`); für dieses Format ist der lexikografische Vergleich
 * korrekt, daher kein `Date`/Zeitzonen-Handling nötig.
 *
 * `done` kapselt, ob der Task in einer terminalen Phase liegt – seit TASK-032b
 * vom Aufrufer über `terminalColumnIds`/`isTerminalColumn` versorgt (kein literal
 * `done` mehr).
 */
export function isOverdue(
  dueDate: string | undefined,
  today: string,
  done: boolean,
): boolean {
  if (!dueDate || done) return false;
  return dueDate < today;
}

/**
 * Klassifiziert einen gesetzten Termin. Erledigte Tasks sind nie „overdue"/
 * „today", sondern stets `upcoming` (neutral) – erledigte Arbeit erzeugt keinen
 * Termin-Druck mehr.
 */
export function dueStatus(
  dueDate: string,
  today: string,
  done: boolean,
): DueStatus {
  if (done) return "upcoming";
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "today";
  return "upcoming";
}

/**
 * Fälligkeits-Zustand → StatusBadge-Token (eine Quelle für die Warnfärbung).
 * `upcoming` hat bewusst keinen Status-Ton (neutrale Darstellung).
 */
export const DUE_STATUS_TOKEN: Record<DueStatus, StatusType | undefined> = {
  overdue: "danger",
  today: "warning",
  upcoming: undefined,
};

/** ISO-Datum (`YYYY-MM-DD`) als kompaktes `DD.MM.`; "" bei fehlendem/ungültigem Wert. */
export function formatDueDate(dueDate?: string): string {
  if (!dueDate) return "";
  const [, month, day] = dueDate.split("-");
  if (!month || !day) return "";
  return `${day}.${month}.`;
}
