import type {
  CeremonyComment,
  CeremonyScope,
  RetroContent,
  ReviewContent,
  SprintRetro,
  SprintReview,
  Team,
} from "@/types";

/* ------------------------------------------------------------------ *
 * Ceremonies (TASK-054): reviews & retros as a historical list.
 *
 * The pure layer of the standalone Ceremonies area. `createReview`/`createRetro`
 * combine the form *content* (from sprint-review-schema) with ceremony metadata
 * (id/scope/teamId/createdAt); `ceremonyHistory` merges both kinds into one
 * newest-first timeline.
 * ------------------------------------------------------------------ */

/** Selectable scopes in display order, with German labels for the UI. */
export const CEREMONY_SCOPES: { value: CeremonyScope; label: string }[] = [
  { value: "cross", label: "Team-übergreifend" },
  { value: "team", label: "Team" },
  { value: "project", label: "Projekt" },
];

const SCOPE_LABEL: Record<CeremonyScope, string> = {
  cross: "Team-übergreifend",
  team: "Team",
  project: "Projekt",
};

/**
 * Human-readable scope label; for `team` scope the team's name is appended
 * (falling back to the raw label when the team is unknown/deleted).
 */
export function scopeLabel(
  scope: CeremonyScope,
  teamId: string | undefined,
  teams: Team[],
): string {
  if (scope !== "team") return SCOPE_LABEL[scope];
  const team = teams.find((t) => t.id === teamId);
  return team ? `Team: ${team.name}` : SCOPE_LABEL.team;
}

/** Ceremony metadata a caller supplies when persisting an entry. */
export type CeremonyInput = {
  scope: CeremonyScope;
  /** Required for `scope === "team"`; ignored otherwise. */
  teamId?: string;
};

/** Options for deterministic tests (inject id/now). */
export type CeremonyFactoryOptions = {
  id?: string;
  now?: string;
};

function makeMeta(input: CeremonyInput, options?: CeremonyFactoryOptions) {
  return {
    id: options?.id ?? crypto.randomUUID(),
    scope: input.scope,
    // Only keep teamId for team scope, so cross/project entries never dangle it.
    ...(input.scope === "team" && input.teamId ? { teamId: input.teamId } : {}),
    createdAt: options?.now ?? new Date().toISOString(),
  };
}

/** Combine review content with fresh ceremony metadata into a persisted review. */
export function createReview(
  content: ReviewContent,
  input: CeremonyInput,
  options?: CeremonyFactoryOptions,
): SprintReview {
  return { ...content, ...makeMeta(input, options) };
}

/** Combine retro content with fresh ceremony metadata into a persisted retro. */
export function createRetro(
  content: RetroContent,
  input: CeremonyInput,
  options?: CeremonyFactoryOptions,
): SprintRetro {
  return { ...content, ...makeMeta(input, options) };
}

/** Validation: team scope needs a team; other scopes never carry one. */
export function isCeremonyInputValid(input: CeremonyInput): boolean {
  return input.scope !== "team" || Boolean(input.teamId);
}

/** One entry of the merged ceremony timeline. */
export type CeremonyEntry =
  | { kind: "review"; review: SprintReview }
  | { kind: "retro"; retro: SprintRetro };

/** `createdAt` of an entry, used for sorting. */
function entryCreatedAt(entry: CeremonyEntry): string {
  return entry.kind === "review" ? entry.review.createdAt : entry.retro.createdAt;
}

/**
 * Merge reviews and retros into one chronological history, newest first.
 * Stable sort ⇒ entries sharing a `createdAt` keep their input order.
 */
export function ceremonyHistory(
  reviews: SprintReview[],
  retros: SprintRetro[],
): CeremonyEntry[] {
  const entries: CeremonyEntry[] = [
    ...reviews.map((review): CeremonyEntry => ({ kind: "review", review })),
    ...retros.map((retro): CeremonyEntry => ({ kind: "retro", retro })),
  ];
  return entries.sort((a, b) =>
    entryCreatedAt(b).localeCompare(entryCreatedAt(a)),
  );
}

/* ------------------------------------------------------------------ *
 * TASK-055: linked backlog items + comments.
 *
 * Reviews/retros can link the sprint's stories/tasks (navigate to them) and
 * carry a comment thread. All transforms are pure array ops so the store
 * actions stay thin; deleted items are resolved robustly (never crash).
 * ------------------------------------------------------------------ */

/** Toggle an id in a link array (add if absent, remove if present). */
export function toggleLink(ids: string[] | undefined, id: string): string[] {
  const current = ids ?? [];
  return current.includes(id)
    ? current.filter((existing) => existing !== id)
    : [...current, id];
}

/** A linked item resolved against the current data (title + missing flag). */
export type ResolvedLink = {
  id: string;
  /** Display title, or a placeholder when the item was deleted. */
  label: string;
  /** True when the id no longer resolves to an existing item. */
  missing: boolean;
};

/**
 * Resolve linked ids to display items against the still-existing ones. Deleted
 * items keep their id but are flagged `missing` (rendered as a dead chip) so a
 * dangling link never breaks the view (TASK-055).
 */
export function resolveLinks(
  ids: string[] | undefined,
  items: { id: string; title: string }[],
): ResolvedLink[] {
  const titleById = new Map(items.map((item) => [item.id, item.title]));
  return (ids ?? []).map((id) => {
    const title = titleById.get(id);
    return { id, label: title ?? "Gelöschtes Item", missing: title === undefined };
  });
}

/** Fields a caller supplies when adding a comment. */
export type CommentInput = { author: string; text: string };

/**
 * Build a comment from raw input; returns `null` when the text is blank (the
 * only required field). Author falls back to „Unbekannt". id/now injectable for
 * deterministic tests (mirrors the createReview/createRetro pattern).
 */
export function createComment(
  input: CommentInput,
  options?: CeremonyFactoryOptions,
): CeremonyComment | null {
  const text = input.text.trim();
  if (!text) return null;
  return {
    id: options?.id ?? crypto.randomUUID(),
    author: input.author.trim() || "Unbekannt",
    text,
    createdAt: options?.now ?? new Date().toISOString(),
  };
}

/** Append a comment to a ceremony's (possibly undefined) thread. */
export function addComment(
  comments: CeremonyComment[] | undefined,
  comment: CeremonyComment,
): CeremonyComment[] {
  return [...(comments ?? []), comment];
}

/** Remove a comment by id from a ceremony's thread. */
export function removeComment(
  comments: CeremonyComment[] | undefined,
  commentId: string,
): CeremonyComment[] {
  return (comments ?? []).filter((comment) => comment.id !== commentId);
}

/**
 * Comments ordered chronologically (oldest first). Stable sort ⇒ entries
 * sharing a `createdAt` keep their insertion order.
 */
export function commentsChronological(
  comments: CeremonyComment[] | undefined,
): CeremonyComment[] {
  return [...(comments ?? [])].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}
