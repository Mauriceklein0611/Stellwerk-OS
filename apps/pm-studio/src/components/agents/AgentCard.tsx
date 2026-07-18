"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { useAgentStore } from "@/store/useAgentStore";
import { useHydrated } from "@/lib/use-hydrated";
import { formatRelativeTime } from "@/lib/format";
import { agentStatusLabel } from "@/lib/agent-status";
import { AGENT_ICONS } from "@/data/agents";
import type { AgentDefinition } from "@/types";

export function AgentCard({ agent }: { agent: AgentDefinition }) {
  const hydrated = useHydrated();
  const status = useAgentStore((state) => state.agentStatuses[agent.id] ?? "idle");
  const lastRun = useAgentStore((state) => state.agentRuns[agent.id]?.[0]);
  const Icon = AGENT_ICONS[agent.id] ?? FileText;

  return (
    <Link href={`/agents/${agent.id}`} className="block">
      <Card className="h-full transition-colors hover:bg-surface-hover">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <StatusBadge status={status} label={agentStatusLabel(status)} />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{agent.name}</span>
            <span className="text-xs text-muted">{agent.role}</span>
          </div>
          <p className="line-clamp-2 text-sm text-muted">{agent.description}</p>
          <span className="font-mono text-xs text-muted">
            {hydrated && lastRun
              ? `Letzter Lauf: ${formatRelativeTime(lastRun.timestamp)}`
              : "—"}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
