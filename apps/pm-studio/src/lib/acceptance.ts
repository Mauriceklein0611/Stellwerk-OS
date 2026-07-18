import type { AcceptanceCriterion } from "@/types";

/**
 * Pure helpers for a story's acceptance criteria (TASK-058). Kept free of
 * React/Zustand so the transforms are trivially unit-testable. Mirrors
 * `src/lib/checklist.ts` (task-level), but AKs live on a story and are a
 * **required** field (`AcceptanceCriterion[]`, default `[]`) – so unlike the
 * optional checklist, `normalizeAcceptance` returns `[]` rather than `undefined`.
 */

/** Fortschritt der Akzeptanzkriterien: erfüllte vs. gesamte. */
export type AcceptanceProgress = {
  done: number;
  total: number;
};

/** Zählt erfüllte und gesamte Kriterien. Fehlt die Liste, ist beides 0. */
export function acceptanceProgress(
  items?: AcceptanceCriterion[],
): AcceptanceProgress {
  const total = items?.length ?? 0;
  const done = items?.filter((item) => item.done).length ?? 0;
  return { done, total };
}

/** Sind alle Kriterien erfüllt? Eine leere/fehlende Liste gilt als nicht „komplett". */
export function acceptanceComplete(items?: AcceptanceCriterion[]): boolean {
  const { done, total } = acceptanceProgress(items);
  return total > 0 && done === total;
}

/**
 * Hängt ein neues, offenes Kriterium an. Leere/whitespace-Texte werden ignoriert
 * (Array bleibt unverändert). Die Id wird hier vergeben.
 */
export function addAcceptanceCriterion(
  items: AcceptanceCriterion[],
  text: string,
): AcceptanceCriterion[] {
  const trimmed = text.trim();
  if (!trimmed) return items;
  return [...items, { id: crypto.randomUUID(), text: trimmed, done: false }];
}

/** Schaltet den `done`-Zustand eines Kriteriums um (per Id). */
export function toggleAcceptanceCriterion(
  items: AcceptanceCriterion[],
  id: string,
): AcceptanceCriterion[] {
  return items.map((item) =>
    item.id === id ? { ...item, done: !item.done } : item,
  );
}

/**
 * Setzt den Text eines Kriteriums (per Id). Bewusst **ohne** Trim/Leer-Prüfung,
 * damit der Nutzer beim Tippen auch zwischenzeitlich leeren darf; die Bereinigung
 * passiert gebündelt beim Speichern (`normalizeAcceptance`).
 */
export function renameAcceptanceCriterion(
  items: AcceptanceCriterion[],
  id: string,
  text: string,
): AcceptanceCriterion[] {
  return items.map((item) => (item.id === id ? { ...item, text } : item));
}

/** Entfernt ein Kriterium (per Id). */
export function removeAcceptanceCriterion(
  items: AcceptanceCriterion[],
  id: string,
): AcceptanceCriterion[] {
  return items.filter((item) => item.id !== id);
}

/**
 * Bereinigt vor dem Speichern: trimmt Texte und wirft leere Kriterien raus. Gibt
 * immer ein Array zurück (ggf. `[]`), weil `acceptance_criteria` ein Pflichtfeld
 * der Story ist.
 */
export function normalizeAcceptance(
  items: AcceptanceCriterion[],
): AcceptanceCriterion[] {
  return items
    .map((item) => ({ ...item, text: item.text.trim() }))
    .filter((item) => item.text);
}

/**
 * Wandelt die Agenten-/Alt-`string[]`-Kriterien in abhakbare {@link
 * AcceptanceCriterion} um (alle offen). Genutzt beim `importBacklog`-Mapping
 * (Artefakt bleibt `string[]`) und in der Persist-Migration v1→v2. Leere Strings
 * werden verworfen. `id` ist injizierbar für deterministische Tests.
 */
export function criteriaFromStrings(
  texts: string[],
  makeId: (index: number) => string = () => crypto.randomUUID(),
): AcceptanceCriterion[] {
  return texts
    .map((text) => text.trim())
    .filter((text) => text)
    .map((text, index) => ({ id: makeId(index), text, done: false }));
}
