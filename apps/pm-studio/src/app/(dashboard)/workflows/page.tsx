import { PageHeader } from "@/components/layout/PageHeader";
import { FlowCanvas } from "@/components/workflow/FlowCanvas";

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Workflows"
        description="Die Standard-Pipeline als Graph – Status je Knoten, Simulation von links nach rechts."
      />
      <FlowCanvas />
    </div>
  );
}
