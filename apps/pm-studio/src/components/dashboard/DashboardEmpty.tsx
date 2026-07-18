import Link from "next/link";
import { Lightbulb } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

/**
 * Prominent fresh-state banner shown when no project ideas exist yet. Gives the
 * primary CTA so the dashboard is never a dead end on first visit.
 */
export function DashboardEmpty() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-surface-hover text-muted">
          <Lightbulb className="size-5" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-medium text-foreground">
            Noch keine Projekte
          </h2>
          <p className="max-w-md text-sm text-muted">
            Leg eine Projektidee an und starte die Pipeline – danach füllen sich
            Metriken, Aktivitäts-Feed und Charts mit echten Daten.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link href="/ideas/new" className={buttonVariants()}>
            Erste Idee anlegen
          </Link>
          <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
            Projekte ansehen
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
