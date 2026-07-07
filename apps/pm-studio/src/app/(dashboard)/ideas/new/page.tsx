import { PageHeader } from "@/components/layout/PageHeader";
import { IdeaForm } from "@/components/ideas/IdeaForm";

export default function NewIdeaPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Neue Projektidee"
        description="Erfasse eine Idee strukturiert – sie ist der Startpunkt der Agenten-Pipeline."
      />
      <div className="max-w-3xl">
        <IdeaForm />
      </div>
    </div>
  );
}
