import type { Edge, Node } from "@xyflow/react";

import type { StatusType } from "@/types";

export type FlowNodeKind = "input" | "agent" | "output";

export type FlowNodeData = {
  label: string;
  kind: FlowNodeKind;
  /** Agent id for agent nodes (links to /agents/[id]). */
  agentId?: string;
  status: StatusType;
  [key: string]: unknown;
};

export type FlowNode = Node<FlowNodeData>;

const STEP_X = 230;
const ROW_Y = 80;

/** Order of agent nodes for the left-to-right simulation. */
export const AGENT_NODE_ORDER = [
  "draft",
  "requirements",
  "scrum",
  "po",
  "risk",
  "review",
] as const;

const agentNode = (
  index: number,
  agentId: string,
  label: string,
): FlowNode => ({
  id: agentId,
  type: "agent",
  position: { x: STEP_X * index, y: ROW_Y },
  data: { label, kind: "agent", agentId, status: "idle" },
});

/** Pipeline nodes (fixed positions; layout = data, no auto-layout needed). */
export const workflowNodes: FlowNode[] = [
  {
    id: "input",
    type: "io",
    position: { x: STEP_X * 0, y: ROW_Y },
    data: { label: "Projektidee", kind: "input", status: "idle" },
  },
  agentNode(1, "draft", "Draft"),
  agentNode(2, "requirements", "Requirements"),
  agentNode(3, "scrum", "Scrum"),
  agentNode(4, "po", "PO"),
  agentNode(5, "risk", "Risk"),
  agentNode(6, "review", "Review"),
  {
    id: "output",
    type: "io",
    position: { x: STEP_X * 7, y: ROW_Y },
    data: { label: "Artefakte", kind: "output", status: "idle" },
  },
];

const edge = (source: string, target: string): Edge => ({
  id: `e-${source}-${target}`,
  source,
  target,
});

export const workflowEdges: Edge[] = [
  edge("input", "draft"),
  edge("draft", "requirements"),
  edge("requirements", "scrum"),
  edge("scrum", "po"),
  edge("po", "risk"),
  edge("risk", "review"),
  edge("review", "output"),
];
