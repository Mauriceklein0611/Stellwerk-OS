import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommandBar } from "@/components/layout/CommandBar";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Toaster } from "@/components/common/Toaster";

/**
 * App shell for every page: fixed 240px sidebar (desktop), top command bar and
 * a max-width content area. All routes live in this (dashboard) group so they
 * share one shell. The sidebar collapses into a Sheet < md (see CommandBar).
 */
export default function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border md:block">
          <Sidebar />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <CommandBar />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1440px] px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
      <ConfirmDialog />
      <Toaster />
    </TooltipProvider>
  );
}
