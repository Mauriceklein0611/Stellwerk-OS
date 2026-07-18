import { notFound } from "next/navigation";

import { AgentDetail } from "@/components/agents/AgentDetail";
import { agents } from "@/data/agents";

export function generateStaticParams() {
  return agents.map((agent) => ({ id: agent.id }));
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = agents.find((a) => a.id === id);
  if (!agent) notFound();
  return <AgentDetail agent={agent} />;
}
