"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import type { FlowNodeData } from "@/data/workflows";

export function IONode({ data }: NodeProps) {
  const node = data as FlowNodeData;
  const isInput = node.kind === "input";

  return (
    <div className="rounded-full border border-border bg-surface-hover px-4 py-2 text-sm font-medium text-foreground">
      {!isInput ? (
        <Handle type="target" position={Position.Left} className="!bg-border" />
      ) : null}
      {node.label}
      {isInput ? (
        <Handle type="source" position={Position.Right} className="!bg-border" />
      ) : null}
    </div>
  );
}
