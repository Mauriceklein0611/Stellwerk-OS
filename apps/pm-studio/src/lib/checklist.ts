import type { ChecklistItem } from "@/types";

/** Fortschritt einer Checkliste: erledigte vs. gesamte Punkte (TASK-035). */
export type ChecklistProgress = {
  done: number;
  total: number;
};

/**
 * Reiner Fortschritts-Helfer: zählt erledigte und gesamte Punkte. Fehlt die
 * Checkliste, ist beides 0. Quelle der „n/m"-Anzeige auf Karte und in der Liste –
 * keine Komponente zählt selbst.
 */
export function checklistProgress(items?: ChecklistItem[]): ChecklistProgress {
  const total = items?.length ?? 0;
  const done = items?.filter((item) => item.done).length ?? 0;
  return { done, total };
}

/** Sind alle Punkte erledigt? Eine leere/fehlende Checkliste gilt als nicht „komplett". */
export function checklistComplete(items?: ChecklistItem[]): boolean {
  const { done, total } = checklistProgress(items);
  return total > 0 && done === total;
}

/**
 * Hängt einen neuen, offenen Punkt an. Leere/whitespace-Texte werden ignoriert
 * (Array bleibt unverändert). Die Id wird hier vergeben, damit die Komponente
 * keine Logik tragen muss.
 */
export function addChecklistItem(
  items: ChecklistItem[],
  text: string,
): ChecklistItem[] {
  const trimmed = text.trim();
  if (!trimmed) return items;
  return [...items, { id: crypto.randomUUID(), text: trimmed, done: false }];
}

/** Schaltet den `done`-Zustand eines Punkts um (per Id). */
export function toggleChecklistItem(
  items: ChecklistItem[],
  id: string,
): ChecklistItem[] {
  return items.map((item) =>
    item.id === id ? { ...item, done: !item.done } : item,
  );
}

/**
 * Setzt den Text eines Punkts (per Id). Bewusst **ohne** Trim/Leer-Prüfung,
 * damit der Nutzer beim Tippen auch zwischenzeitlich leeren darf; die
 * Bereinigung passiert gebündelt beim Speichern (`normalizeChecklist`).
 */
export function renameChecklistItem(
  items: ChecklistItem[],
  id: string,
  text: string,
): ChecklistItem[] {
  return items.map((item) => (item.id === id ? { ...item, text } : item));
}

/** Entfernt einen Punkt (per Id). */
export function removeChecklistItem(
  items: ChecklistItem[],
  id: string,
): ChecklistItem[] {
  return items.filter((item) => item.id !== id);
}

/**
 * Bereinigt vor dem Speichern: trimmt Texte und wirft leere Punkte raus. Gibt
 * `undefined` zurück, wenn nichts übrig bleibt – so wird das Feld (wie `tagIds`/
 * `dueDate`) gar nicht erst persistiert.
 */
export function normalizeChecklist(
  items: ChecklistItem[],
): ChecklistItem[] | undefined {
  const cleaned = items
    .map((item) => ({ ...item, text: item.text.trim() }))
    .filter((item) => item.text);
  return cleaned.length ? cleaned : undefined;
}
