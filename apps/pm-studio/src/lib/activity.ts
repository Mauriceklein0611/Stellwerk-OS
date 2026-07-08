import type {
  ActivityEntityType,
  ActivityEvent,
  ActivityKind,
  ActorKind,
  StatusType,
} from "@/types";

/**
 * Pure helpers for the Activity Feed (TASK-043). Kept free of React/Zustand so
 * the event factory and the per-entity selectors are trivially unit-testable.
 * The single write path is `useActivityStore.log`, which calls
 * {@link createActivityEvent}; reading is always a pure, filtered selector.
 */

/** Input for a new event – id/createdAt are assigned by the factory. */
export type ActivityEventInput = {
  entityType: ActivityEntityType;
  entityId: string;
  kind: ActivityKind;
  summary: string;
  /** Defaults to "human" when omitted (agents set "agent" from M6 on). */
  actor?: ActorKind;
};

/**
 * Build an {@link ActivityEvent} from an input. `id`/`now` are injectable so the
 * factory stays deterministic in tests; in production they default to a random
 * UUID and the current time.
 */
export function createActivityEvent(
  input: ActivityEventInput,
  { id, now }: { id?: string; now?: Date } = {},
): ActivityEvent {
  return {
    id: id ?? crypto.randomUUID(),
    entityType: input.entityType,
    entityId: input.entityId,
    kind: input.kind,
    summary: input.summary,
    actor: input.actor ?? "human",
    createdAt: (now ?? new Date()).toISOString(),
  };
}

/**
 * Events for one entity, newest first. Pure read – never mutates the source.
 * Sort is stable on `createdAt` descending (ties keep their relative order).
 */
export function eventsForEntity(
  events: ActivityEvent[],
  entityType: ActivityEntityType,
  entityId: string,
): ActivityEvent[] {
  return events
    .filter(
      (event) =>
        event.entityType === entityType && event.entityId === entityId,
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/**
 * Display metadata per event kind: a short German label and the StatusBadge
 * accent (single source for the color, like everywhere else in the app).
 */
export const ACTIVITY_KIND_META: Record<
  ActivityKind,
  { label: string; status: StatusType }
> = {
  create: { label: "Angelegt", status: "success" },
  update: { label: "Geändert", status: "info" },
  delete: { label: "Gelöscht", status: "danger" },
  review: { label: "Review", status: "warning" },
  run: { label: "Lauf", status: "running" },
};
