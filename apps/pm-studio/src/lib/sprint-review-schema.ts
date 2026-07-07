import { z } from "zod";

import type {
  RetroContent,
  ReviewContent,
  SprintRetro,
  SprintReview,
} from "@/types";

/* ------------------------------------------------------------------ *
 * Sprint-Review (TASK-018).
 * ------------------------------------------------------------------ */

/** Validation schema for the sprint-review form (German UI messages). */
export const reviewFormSchema = z.object({
  delivered: z
    .string()
    .trim()
    .min(1, "Bitte beschreibe, was geliefert wurde."),
  /** `valueAsNumber` from the input → empty becomes NaN and fails here. */
  achievedPt: z
    .number({ error: "Bitte eine Zahl ≥ 0 angeben." })
    .min(0, "Story-Points dürfen nicht negativ sein."),
  notes: z.string().trim().optional(),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

/** Form defaults, pre-filled from an existing review when re-opening. */
export function reviewFormDefaults(review?: SprintReview): ReviewFormValues {
  return {
    delivered: review?.delivered ?? "",
    achievedPt: review?.achievedPt ?? 0,
    notes: review?.notes ?? "",
  };
}

/**
 * Build the review *content* (no ceremony metadata) from validated form values.
 * `createReview` (src/lib/ceremonies.ts) adds id/scope/teamId/createdAt.
 */
export function reviewFromForm(
  sprintId: string,
  values: ReviewFormValues,
): ReviewContent {
  const notes = values.notes?.trim();
  return {
    sprintId,
    delivered: values.delivered.trim(),
    achievedPt: values.achievedPt,
    ...(notes ? { notes } : {}),
  };
}

/* ------------------------------------------------------------------ *
 * Sprint-Retrospektive (TASK-018).
 * ------------------------------------------------------------------ */

/** The three retro lists, in display order. */
export const RETRO_COLUMNS = [
  { key: "good", label: "Lief gut" },
  { key: "improve", label: "Verbessern" },
  { key: "actions", label: "Aktionen" },
] as const;

export type RetroColumnKey = (typeof RETRO_COLUMNS)[number]["key"];

/** Trim each item and drop empty ones (pure; used by the form on save). */
export function cleanRetroItems(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

/** Build the retro *content* (no ceremony metadata) from the three (raw) lists, cleaned. */
export function retroFromLists(
  sprintId: string,
  lists: Record<RetroColumnKey, string[]>,
): RetroContent {
  return {
    sprintId,
    good: cleanRetroItems(lists.good),
    improve: cleanRetroItems(lists.improve),
    actions: cleanRetroItems(lists.actions),
  };
}

/** Retro lists pre-filled from an existing retro, or empty lists. */
export function retroListsFromRetro(
  retro?: SprintRetro,
): Record<RetroColumnKey, string[]> {
  return {
    good: retro?.good ?? [],
    improve: retro?.improve ?? [],
    actions: retro?.actions ?? [],
  };
}
