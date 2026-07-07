import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/agents/StatusBadge";
import { buttonVariants } from "@/components/ui/button";
import type { Project } from "@/types";

/**
 * Projects with a completion bar. The bar width is data-driven via inline
 * style (a dynamic Tailwind width class can't be statically detected).
 */
export function ProgressList({ projects }: { projects: Project[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Projektfortschritt</CardTitle>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted">Noch keine Projekte vorhanden.</p>
            <Link href="/ideas/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Erste Idee anlegen
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {projects.map((project) => (
              <li key={project.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium text-foreground">
                    {project.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={project.status} />
                    <span className="w-9 text-right font-mono text-xs tabular-nums text-muted">
                      {project.progress}%
                    </span>
                  </div>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover"
                  role="progressbar"
                  aria-valuenow={project.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={project.name}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
