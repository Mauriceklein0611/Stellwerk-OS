"use client";

import { useMemo } from "react";

import { StatusBadge } from "@/components/agents/StatusBadge";
import { ACTIVITY_KIND_META, eventsForEntity } from "@/lib/activity";
import { formatRelativeTime } from "@/lib/format";
import { useHydrated } from "@/lib/use-hydrated";
import { useActivityStore } from "@/store/useActivityStore";
import type { ActivityEntityType } from "@/types";

type ActivityFeedPanelProps = {
  entityType: ActivityEntityType;
  entityId: string;
  /** Heading shown above the feed. */
  title?: string;
  /** Cap the number of events rendered (newest first); 0/undefined = all. */
  limit?: number;
};

/**
 * Read-only Activity Feed for one entity (TASK-043). Chronological (newest
 * first), with a kind badge (single-sourced color via <StatusBadge>) and the
 * relative time. Pure read – the filtering lives in `eventsForEntity`.
 *
 * The store's `events` array is selected as-is and the per-entity slice is
 * derived via useMemo; returning `eventsForEntity(...)` straight from the
 * selector would create a new array each render and trip zustand's
 * "getSnapshot should be cached" loop (see TASK-031).
 */
export function ActivityFeedPanel({
  entityType,
  entityId,
  title = "Aktivität",
  limit,
}: ActivityFeedPanelProps) {
  const hydrated = useHydrated();
  const allEvents = useActivityStore((state) => state.events);

  const events = useMemo(() => {
    const filtered = eventsForEntity(allEvents, entityType, entityId);
    return limit && limit > 0 ? filtered.slice(0, limit) : filtered;
  }, [allEvents, entityType, entityId, limit]);

  return (
    <section
      data-testid="activity-feed"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <h3 className="text-sm font-medium text-foreground">{title}</h3>

      {!hydrated ? (
        <p className="text-sm text-muted">Lädt …</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted" data-testid="activity-feed-empty">
          Noch keine Aktivität.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {events.map((event) => (
            <li
              key={event.id}
              data-testid="activity-event"
              className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-sm text-foreground">{event.summary}</span>
                <StatusBadge
                  status={ACTIVITY_KIND_META[event.kind].status}
                  label={ACTIVITY_KIND_META[event.kind].label}
                  className="w-fit"
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-muted">
                {formatRelativeTime(event.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
