"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";

import { StatusBadge } from "@/components/agents/StatusBadge";
import { agentStatusLabel } from "@/lib/agent-status";
import { AGENT_ICONS } from "@/data/agents";
import type { FlowNodeData } from "@/data/workflows";

export function AgentNode({ data }: NodeProps) {
  const node = data as FlowNodeData;
  const Icon = (node.agentId && AGENT_ICONS[node.agentId]) || Bot;

  return (
    <div className="w-40 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-sm">
      <Handle type="target" position={Position.Left} className="!bg-border" />
      <div className="flex items-center justify-between gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <StatusBadge status={node.status} label={agentStatusLabel(node.status)} />
      </div>
      <p className="mt-2 text-sm font-medium text-foreground">{node.label}</p>
      <Handle type="source" position={Position.Right} className="!bg-border" />
    </div>
  );
}
