import { PageHeader } from "@/components/layout/PageHeader";
import { AgentCard } from "@/components/agents/AgentCard";
import { agents } from "@/data/agents";

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Agenten"
        description="Die Agenten der Pipeline – Rolle, Status und letzte Läufe."
      />
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </section>
    </div>
  );
}
