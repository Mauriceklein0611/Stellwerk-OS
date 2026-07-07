"use client";

import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { AgentOutputView } from "@/components/agents/AgentOutputView";
import { useHydrated } from "@/lib/use-hydrated";
import { formatRelativeTime } from "@/lib/format";
import { agentStatusLabel } from "@/lib/agent-status";
import type { AgentRunRecord } from "@/types";

export function AgentRunList({ runs }: { runs: AgentRunRecord[] }) {
  const hydrated = useHydrated();
  const [selected, setSelected] = useState<AgentRunRecord | null>(null);

  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
        Noch keine Läufe – starte eine Simulation.
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[420px] rounded-xl border border-border">
        <ul className="divide-y divide-border">
          {runs.map((run) => (
            <li key={run.id}>
              <button
                type="button"
                onClick={() => setSelected(run)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-foreground">
                    {run.summary}
                  </span>
                  <span className="font-mono text-xs text-muted">
                    {hydrated ? formatRelativeTime(run.timestamp) : "—"}
                  </span>
                </div>
                <StatusBadge
                  status={run.status}
                  label={agentStatusLabel(run.status)}
                />
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent side="right" className="w-full gap-4 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.summary}</SheetTitle>
            <SheetDescription>Agenten-Output (Simulation)</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-4">
            {selected ? <AgentOutputView output={selected.output} /> : null}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
