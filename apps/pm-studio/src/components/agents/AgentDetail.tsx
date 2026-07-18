"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { AgentRunList } from "@/components/agents/AgentRunList";
import { useAgentStore } from "@/store/useAgentStore";
import { agentStatusLabel } from "@/lib/agent-status";
import { AGENT_ICONS } from "@/data/agents";
import type { AgentDefinition } from "@/types";

export function AgentDetail({ agent }: { agent: AgentDefinition }) {
  const status = useAgentStore((state) => state.agentStatuses[agent.id] ?? "idle");
  const runs = useAgentStore((state) => state.agentRuns[agent.id] ?? []);
  const simulateAgentRun = useAgentStore((state) => state.simulateAgentRun);
  const Icon = AGENT_ICONS[agent.id] ?? FileText;
  const isRunning = status === "running";

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/agents"
        className="inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Agenten
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
              {agent.name}
            </h1>
            <span className="text-xs text-muted">{agent.role}</span>
          </div>
          <StatusBadge status={status} label={agentStatusLabel(status)} />
        </div>
        <Button onClick={() => simulateAgentRun(agent.id)} disabled={isRunning}>
          {isRunning ? <Loader2 className="animate-spin" /> : <Play />}
          Run (Simulation)
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList
          variant="line"
          className="w-full justify-start gap-5 border-b border-border [&_[data-slot=tabs-trigger]]:flex-none [&_[data-slot=tabs-trigger]]:px-0"
        >
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="runs">Läufe</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rolle</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-foreground">
                {agent.description}
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm">Input</CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-sm text-muted">
                  {agent.input}
                </CardContent>
              </Card>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-sm">Output</CardTitle>
                </CardHeader>
                <CardContent className="font-mono text-sm text-muted">
                  {agent.output}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          <AgentRunList runs={runs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
