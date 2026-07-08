import type { BacklogProvenance, StatusType } from "@/types";

/**
 * Provenance → badge meta (TASK-060). Single-sourced through `<StatusBadge>` like
 * every other status color. Manually created stories (`human`) get no badge to
 * avoid noise; only agent-provided (`agent`) and agent-then-edited
 * (`human_edited`) items carry a visible provenance mark (AC).
 */
export const PROVENANCE_META: Record<
  BacklogProvenance,
  { status: StatusType; label: string } | null
> = {
  agent: { status: "info", label: "Agent" },
  human_edited: { status: "warning", label: "bearbeitet" },
  human: null,
};
