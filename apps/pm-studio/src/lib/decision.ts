import type { ActivityEntityType, ActorKind, Decision } from "@/types";

/**
 * Pure helpers for the Decision Log (TASK-043): human approvals and scope
 * decisions with an optional rationale. Free of React/Zustand so the factory
 * and the per-entity selector are trivially unit-testable.
 */

/** Input for a new decision – id/createdAt are assigned by the factory. */
export type DecisionInput = {
  context: string;
  choice: string;
  rationale?: string;
  /** Defaults to "human" when omitted. */
  actor?: ActorKind;
  relatedEntity?: { type: ActivityEntityType; id: string };
};

/**
 * Build a {@link Decision} from an input, trimming text fields. Returns `null`
 * when `context` or `choice` is blank, so the store never persists an empty
 * decision. `id`/`now` are injectable for deterministic tests.
 */
export function createDecision(
  input: DecisionInput,
  { id, now }: { id?: string; now?: Date } = {},
): Decision | null {
  const context = input.context.trim();
  const choice = input.choice.trim();
  if (!context || !choice) return null;

  const rationale = input.rationale?.trim();
  return {
    id: id ?? crypto.randomUUID(),
    context,
    choice,
    rationale: rationale ? rationale : undefined,
    actor: input.actor ?? "human",
    createdAt: (now ?? new Date()).toISOString(),
    relatedEntity: input.relatedEntity,
  };
}

/** Decisions for one entity, newest first. Pure read – never mutates the source. */
export function decisionsForEntity(
  decisions: Decision[],
  entityType: ActivityEntityType,
  entityId: string,
): Decision[] {
  return decisions
    .filter(
      (decision) =>
        decision.relatedEntity?.type === entityType &&
        decision.relatedEntity.id === entityId,
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}
