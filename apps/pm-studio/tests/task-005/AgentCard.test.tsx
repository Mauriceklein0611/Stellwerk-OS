import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { AgentCard } from "@/components/agents/AgentCard";
import { useAgentStore } from "@/store/useAgentStore";
import type { AgentDefinition } from "@/types";

const agent: AgentDefinition = {
  id: "draft",
  name: "Projektentwurfs-Agent",
  role: "Entwurf",
  description: "Formt aus einer Idee einen Entwurf.",
  input: "ProjectIdea",
  output: "ProjectDraft",
};

beforeEach(() => {
  useAgentStore.setState({
    agentStatuses: { draft: "success" },
    agentRuns: { draft: [] },
  });
});

describe("AgentCard", () => {
  it("renders the agent name, role and status badge", () => {
    render(<AgentCard agent={agent} />);

    expect(screen.getByText("Projektentwurfs-Agent")).toBeInTheDocument();
    expect(screen.getByText("Entwurf")).toBeInTheDocument();
    expect(screen.getByText("Erfolg")).toBeInTheDocument();
  });

  it("links to the agent detail route", () => {
    render(<AgentCard agent={agent} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/agents/draft");
  });
});
