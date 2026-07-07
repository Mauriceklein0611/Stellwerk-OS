import type { BoardTask, Priority } from "@/types";

/* ------------------------------------------------------------------ *
 * Retro-Maßnahmen als Board-Tasks (TASK-065).
 *
 * Aus einer Retro-„Aktion" (reiner String in {@link SprintRetro.actions}) wird
 * mit einem Klick ein echter Board-Task – so versanden Maßnahmen nicht. Die
 * Verknüpfung läuft über zwei Felder am Task: `sourceRetroId` (welche Retro) +
 * `sourceRetroAction` (welcher Aktions-Text). Beide zusammen bilden die
 * Identität einer *einzelnen* Maßnahme; die Retro-Id allein reicht nicht, weil
 * eine Retro mehrere Aktionen hat. Reine Funktionen ⇒ Store/UI bleiben dünn.
 * ------------------------------------------------------------------ */

/** Default-Priorität eines aus einer Maßnahme erzeugten Tasks. */
const DEFAULT_PRIORITY: Priority = "mittel";

/** Params, aus denen ein Board-Task für eine Retro-Maßnahme gebaut wird. */
export type RetroActionTaskInput = {
  /** Id der Retro ({@link CeremonyMeta.id}). */
  retroId: string;
  /** Original-Text der Maßnahme (stabile Verknüpfung). */
  action: string;
  /** Vom Nutzer (vor-)ausgefüllter Task-Titel. */
  title: string;
  projectId: string;
  projectName: string;
  assigneeId?: string;
  dueDate?: string;
  /** Injizierbar für deterministische Tests. */
  id?: string;
};

/**
 * Den bereits aus einer Maßnahme erzeugten Board-Task finden (TASK-065).
 * Identität = Retro-Id **und** Original-Aktionstext, damit die Aktionen einer
 * Retro einzeln nachverfolgt werden. `undefined`, wenn noch keiner existiert ⇒
 * die UI zeigt dann den „→ Task"-Button statt des Verknüpfungs-Badges.
 */
export function findRetroActionTask(
  retroId: string,
  action: string,
  tasks: BoardTask[],
): BoardTask | undefined {
  return tasks.find(
    (task) =>
      task.sourceRetroId === retroId && task.sourceRetroAction === action,
  );
}

/** True, wenn eine Maßnahme bereits einen verknüpften Board-Task hat. */
export function retroActionHasTask(
  retroId: string,
  action: string,
  tasks: BoardTask[],
): boolean {
  return findRetroActionTask(retroId, action, tasks) !== undefined;
}

/**
 * Den Board-Task für eine Retro-Maßnahme bauen (TASK-065). Spalte default
 * `todo`, Priorität `mittel`; trägt die Herkunfts-Referenz (`sourceRetroId` +
 * Original-`action`), damit der Task dedupliziert und rück-verlinkt. `order`
 * vergibt der Store. Leerer Titel fällt auf den Aktions-Text zurück.
 */
export function buildRetroActionTask(
  input: RetroActionTaskInput,
): Omit<BoardTask, "order"> {
  const title = input.title.trim() || input.action;
  return {
    id: input.id ?? crypto.randomUUID(),
    title,
    column: "todo",
    projectId: input.projectId,
    projectName: input.projectName,
    priority: DEFAULT_PRIORITY,
    ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
    ...(input.dueDate ? { dueDate: input.dueDate } : {}),
    sourceRetroId: input.retroId,
    sourceRetroAction: input.action,
  };
}
