import { describe, expect, it } from "vitest";

import {
  ACTIVITY_KIND_META,
  createActivityEvent,
  eventsForEntity,
} from "@/lib/activity";
import type { ActivityEvent } from "@/types";

describe("createActivityEvent (TASK-043)", () => {
  it("fills id/createdAt and defaults the actor to 'human'", () => {
    const event = createActivityEvent(
      {
        entityType: "task",
        entityId: "t1",
        kind: "create",
        summary: "Task „X“ angelegt",
      },
      { id: "e1", now: new Date("2026-06-22T10:00:00.000Z") },
    );

    expect(event).toEqual({
      id: "e1",
      entityType: "task",
      entityId: "t1",
      kind: "create",
      summary: "Task „X“ angelegt",
      actor: "human",
      createdAt: "2026-06-22T10:00:00.000Z",
    });
  });

  it("keeps an explicit actor (agent)", () => {
    const event = createActivityEvent(
      { entityType: "project", entityId: "p1", kind: "run", summary: "Lauf", actor: "agent" },
      { id: "e2" },
    );
    expect(event.actor).toBe("agent");
  });

  it("assigns a real id and timestamp when none are injected", () => {
    const event = createActivityEvent({
      entityType: "sprint",
      entityId: "s1",
      kind: "update",
      summary: "Sprint aktualisiert",
    });
    expect(event.id).toMatch(/[0-9a-f-]{36}/);
    expect(() => new Date(event.createdAt).toISOString()).not.toThrow();
  });
});

function event(patch: Partial<ActivityEvent>): ActivityEvent {
  return {
    id: "e",
    entityType: "task",
    entityId: "t1",
    kind: "create",
    summary: "",
    actor: "human",
    createdAt: "2026-06-22T10:00:00.000Z",
    ...patch,
  };
}

describe("eventsForEntity (TASK-043)", () => {
  const events: ActivityEvent[] = [
    event({ id: "a", entityId: "t1", createdAt: "2026-06-22T10:00:00.000Z" }),
    event({ id: "b", entityId: "t1", createdAt: "2026-06-22T12:00:00.000Z" }),
    event({ id: "c", entityId: "t2", createdAt: "2026-06-22T11:00:00.000Z" }),
    event({ id: "d", entityType: "sprint", entityId: "t1", createdAt: "2026-06-22T13:00:00.000Z" }),
  ];

  it("filters by entityType + entityId and returns newest first", () => {
    const result = eventsForEntity(events, "task", "t1");
    expect(result.map((e) => e.id)).toEqual(["b", "a"]);
  });

  it("does not match a same id of a different entity type", () => {
    const result = eventsForEntity(events, "sprint", "t1");
    expect(result.map((e) => e.id)).toEqual(["d"]);
  });

  it("returns an empty array when nothing matches and never mutates the source", () => {
    const copy = [...events];
    expect(eventsForEntity(events, "release", "x")).toEqual([]);
    expect(events).toEqual(copy);
  });
});

describe("ACTIVITY_KIND_META (TASK-043)", () => {
  it("maps every kind to a label + StatusBadge accent", () => {
    expect(ACTIVITY_KIND_META.create.status).toBe("success");
    expect(ACTIVITY_KIND_META.delete.status).toBe("danger");
    expect(ACTIVITY_KIND_META.update.label).toBe("Geändert");
  });
});
