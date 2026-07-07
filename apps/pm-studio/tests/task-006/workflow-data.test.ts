import { describe, expect, it } from "vitest";

import {
  AGENT_NODE_ORDER,
  workflowEdges,
  workflowNodes,
} from "@/data/workflows";

describe("workflow pipeline definition", () => {
  it("has input, the 6 agent nodes and output", () => {
    expect(workflowNodes).toHaveLength(8);
    expect(workflowNodes[0].id).toBe("input");
    expect(workflowNodes.at(-1)?.id).toBe("output");

    const agentIds = workflowNodes
      .filter((node) => node.type === "agent")
      .map((node) => node.id);
    expect(agentIds).toEqual([...AGENT_NODE_ORDER]);
  });

  it("connects the nodes sequentially without gaps", () => {
    expect(workflowEdges).toHaveLength(7);
    const ids = workflowNodes.map((node) => node.id);
    workflowEdges.forEach((edge, index) => {
      expect(edge.source).toBe(ids[index]);
      expect(edge.target).toBe(ids[index + 1]);
    });
  });

  it("starts every node in idle status", () => {
    expect(workflowNodes.every((node) => node.data.status === "idle")).toBe(true);
  });
});
