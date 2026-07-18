import type { BoardColumn, BoardColumnDef, BoardTask, StatusType } from "@/types";

/**
 * Default-Phasen des Kanban-Boards, von links nach rechts. Seit TASK-032 nur noch
 * der Startwert für den `useBoardColumnsStore` – Teams können Phasen anlegen,
 * umbenennen, sortieren und löschen. Konsolidiert die früheren drei Konstanten
 * (Reihenfolge/Label, Status-Akzent, WIP-Limit) in *einer* Quelle pro Phase.
 * Genau eine Phase ist terminal (`done`); siehe `BoardColumnDef.isTerminal`.
 */
export const DEFAULT_BOARD_COLUMNS: BoardColumnDef[] = [
  { id: "backlog", label: "Backlog", status: "idle", order: 0, isTerminal: false },
  { id: "todo", label: "To Do", status: "idle", order: 1, isTerminal: false },
  { id: "in_progress", label: "In Progress", status: "running", order: 2, wipLimit: 4, isTerminal: false },
  { id: "review", label: "Review", status: "info", order: 3, wipLimit: 4, isTerminal: false },
  { id: "testing", label: "Testing", status: "info", order: 4, isTerminal: false },
  { id: "done", label: "Done", status: "success", order: 5, isTerminal: true },
];

/** Phase per Id finden (aus den übergebenen Spalten, sonst aus den Defaults). */
export function findColumn(
  id: BoardColumn,
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
): BoardColumnDef | undefined {
  return columns.find((column) => column.id === id);
}

/**
 * Ids der terminalen Phasen (≙ „abgeschlossen", TASK-032b). Einzige Quelle der
 * Done-Semantik – ersetzt das literale `column === "done"` in Burndown, Velocity,
 * `doneAt`-Stempel, Überfällig-Logik und Projektfortschritt.
 */
export function terminalColumnIds(
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
): Set<BoardColumn> {
  return new Set(
    columns.filter((column) => column.isTerminal).map((column) => column.id),
  );
}

/**
 * Terminale Ids der Default-Phasen (`{"done"}`). Default-Wert überall dort, wo
 * keine Custom-Phasen vorliegen – hält Bestands-Tests/Aufrufer stabil.
 */
export const DEFAULT_TERMINAL_COLUMN_IDS = terminalColumnIds();

/** Ist die Phase mit dieser Id terminal (≙ „abgeschlossen")? */
export function isTerminalColumn(
  id: BoardColumn,
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
): boolean {
  return findColumn(id, columns)?.isTerminal ?? false;
}

/** Label einer Spalte (Fallback: die ID). */
export function columnLabel(
  id: BoardColumn,
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
): string {
  return findColumn(id, columns)?.label ?? id;
}

/** Status-Akzent einer Spalte (Fallback: `idle`). */
export function columnStatus(
  id: BoardColumn,
  columns: BoardColumnDef[] = DEFAULT_BOARD_COLUMNS,
): StatusType {
  return findColumn(id, columns)?.status ?? "idle";
}

/** Summe der geschätzten Personentage einer Task-Liste (fehlende Werte = 0). */
export function sumEstimatePt(tasks: Pick<BoardTask, "estimate_pt">[]): number {
  return tasks.reduce(
    (sum, task) => sum + (typeof task.estimate_pt === "number" ? task.estimate_pt : 0),
    0,
  );
}

/** Überschreitet die Spalte ihr WIP-Limit? (false, wenn kein Limit gesetzt). */
export function isWipExceeded(column: BoardColumnDef, count: number): boolean {
  return typeof column.wipLimit === "number" && count > column.wipLimit;
}

/** Persistierte Board-Ansicht (TASK-023). */
export type BoardView = "kanban" | "list";
