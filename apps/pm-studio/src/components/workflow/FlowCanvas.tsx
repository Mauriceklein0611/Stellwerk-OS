"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AgentNode } from "@/components/workflow/AgentNode";
import { IONode } from "@/components/workflow/IONode";
import { agents } from "@/data/agents";
import {
  AGENT_NODE_ORDER,
  workflowEdges,
  workflowNodes,
  type FlowNode,
  type FlowNodeData,
} from "@/data/workflows";
import type { StatusType } from "@/types";

const nodeTypes = { agent: AgentNode, io: IONode };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(workflowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflowEdges);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<FlowNodeData | null>(null);

  const setNodeStatus = useCallback(
    (id: string, status: StatusType) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, status } }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const setEdgeAnimated = useCallback(
    (target: string, animated: boolean) => {
      setEdges((current) =>
        current.map((edge) =>
          edge.target === target ? { ...edge, animated } : edge,
        ),
      );
    },
    [setEdges],
  );

  const simulate = useCallback(async () => {
    setRunning(true);
    setNodes((current) =>
      current.map((node) => ({
        ...node,
        data: { ...node.data, status: node.id === "input" ? "success" : "idle" },
      })),
    );

    for (const id of AGENT_NODE_ORDER) {
      setNodeStatus(id, "running");
      setEdgeAnimated(id, true);
      await sleep(2000);
      setNodeStatus(id, "success");
      setEdgeAnimated(id, false);
    }
    setEdgeAnimated("output", true);
    setNodeStatus("output", "success");
    await sleep(400);
    setEdgeAnimated("output", false);
    setRunning(false);
  }, [setNodes, setNodeStatus, setEdgeAnimated]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelected(node.data as FlowNodeData);
  }, []);

  const selectedAgent = selected?.agentId
    ? agents.find((agent) => agent.id === selected.agentId)
    : undefined;

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-border">
      <div className="absolute left-3 top-3 z-10">
        <Button onClick={simulate} disabled={running}>
          {running ? <Loader2 className="animate-spin" /> : <Play />}
          Pipeline simulieren
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        fitView
        colorMode="dark"
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent side="right" className="w-full gap-4 sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>{selected?.label}</SheetTitle>
            <SheetDescription>
              {selectedAgent ? selectedAgent.role : "Pipeline-Ein-/Ausgang"}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 px-4 pb-4 text-sm">
            {selectedAgent ? (
              <>
                <p className="text-muted">{selectedAgent.description}</p>
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-muted">Input</span>
                  <span className="font-mono text-foreground">{selectedAgent.input}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-muted">Output</span>
                  <span className="font-mono text-foreground">{selectedAgent.output}</span>
                </div>
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={<Link href={`/agents/${selectedAgent.id}`} />}
                >
                  Zur Agenten-Detailseite
                </Button>
              </>
            ) : (
              <p className="text-muted">
                {selected?.kind === "input"
                  ? "Startpunkt der Pipeline: die erfasste Projektidee."
                  : "Endpunkt: die erzeugten Artefakte (Draft, Requirements, Backlog, Risiken)."}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
