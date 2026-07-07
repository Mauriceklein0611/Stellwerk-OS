import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { IdeaTable } from "@/components/ideas/IdeaTable";

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Projekte"
        description="Erfasste Projektideen – der Eingang der Agenten-Pipeline."
        actions={
          <Button nativeButton={false} render={<Link href="/ideas/new" />}>
            <Plus />
            Neue Idee
          </Button>
        }
      />
      <IdeaTable />
    </div>
  );
}
