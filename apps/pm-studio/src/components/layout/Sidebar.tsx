"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";

import { cn } from "@/lib/utils";
import { isActiveRoute, navGroups } from "@/lib/navigation";

type SidebarProps = {
  /** Called after a nav item is clicked – used to close the mobile sheet. */
  onNavigate?: () => void;
};

/**
 * Sidebar content: brand header + grouped navigation with active indicator.
 * Rendered both inside the fixed desktop rail (see dashboard layout) and the
 * mobile <Sheet> (see CommandBar), so the nav lives in exactly one component.
 */
export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-full flex-col bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary">
          <Bot className="size-4" />
        </span>
        <span className="font-mono text-sm font-semibold tracking-tight text-foreground">
          PM Studio
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
        {navGroups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted">
              {group.label}
            </span>
            {group.items.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-surface-hover font-medium text-foreground"
                      : "text-muted hover:bg-surface-hover hover:text-foreground",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                  )}
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-primary" : "text-muted",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
