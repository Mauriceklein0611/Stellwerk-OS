"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Columns3,
  FolderKanban,
  Menu,
  Plus,
  Rocket,
  Search,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navGroups } from "@/lib/navigation";
import { searchEntities, type SearchResultKind } from "@/lib/search";
import { Sidebar } from "@/components/layout/Sidebar";
import { useBacklogStore } from "@/store/useBacklogStore";
import { useBoardStore } from "@/store/useBoardStore";
import { useItemKeyStore } from "@/store/useItemKeyStore";
import { usePeopleStore } from "@/store/usePeopleStore";
import { useProjectStore } from "@/store/useProjectStore";
import { useReleaseStore } from "@/store/useReleaseStore";
import {
  useCommandActionStore,
  type CommandActionIntent,
} from "@/store/useCommandActionStore";

/** Heading + icon per result kind (group order follows KIND_ORDER). */
const KIND_META: Record<SearchResultKind, { heading: string; icon: LucideIcon }> = {
  project: { heading: "Projekte", icon: FolderKanban },
  task: { heading: "Tasks", icon: Columns3 },
  story: { heading: "Stories", icon: BookOpen },
  person: { heading: "Personen", icon: Users },
  release: { heading: "Releases", icon: Rocket },
};

const KIND_ORDER: SearchResultKind[] = [
  "project",
  "task",
  "story",
  "person",
  "release",
];

/**
 * Create actions reachable from the palette. Each navigates to the owning page;
 * `intent` (when set) additionally tells that page to open its create dialog via
 * the command-action store (TASK-042).
 */
const CREATE_ACTIONS: {
  id: string;
  label: string;
  href: string;
  intent?: Exclude<CommandActionIntent, null>;
}[] = [
  { id: "new-idea", label: "Neue Idee anlegen", href: "/ideas/new" },
  {
    id: "new-story",
    label: "Neue Story anlegen",
    href: "/backlog",
    intent: "new-story",
  },
  {
    id: "new-person",
    label: "Neue Person anlegen",
    href: "/team",
    intent: "new-person",
  },
  {
    id: "new-release",
    label: "Neues Release anlegen",
    href: "/releases",
    intent: "new-release",
  },
];

/**
 * Top command bar: hosts the ⌘K command palette, the mobile burger that opens
 * the sidebar as a Sheet, and a search trigger. The palette searches routes,
 * entities (projects/tasks/stories/people/releases) and create actions – the
 * matching itself lives in src/lib/search.ts (TASK-042).
 */
export function CommandBar() {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const ideas = useProjectStore((state) => state.ideas);
  const stories = useBacklogStore((state) => state.stories);
  const tasks = useBoardStore((state) => state.tasks);
  const persons = usePeopleStore((state) => state.persons);
  const releases = useReleaseStore((state) => state.releases);
  const keys = useItemKeyStore((state) => state.keys);
  const requestAction = useCommandActionStore((state) => state.request);

  // ⌘K / Ctrl+K toggles the command palette.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function setOpen(open: boolean) {
    setCommandOpen(open);
    if (!open) setQuery(""); // reset the search when the palette closes
  }

  function runCommand(action: () => void) {
    setOpen(false);
    action();
  }

  const results = React.useMemo(
    () =>
      searchEntities(query, {
        ideas,
        tasks,
        stories,
        persons,
        releases,
        keys,
      }),
    [query, ideas, tasks, stories, persons, releases, keys],
  );

  // Group entity results by kind for the headed sections.
  const grouped = React.useMemo(() => {
    const map: Partial<Record<SearchResultKind, typeof results>> = {};
    for (const result of results) (map[result.kind] ??= []).push(result);
    return map;
  }, [results]);

  const q = query.trim().toLowerCase();
  const navMatches = navGroups
    .map((group) => ({
      ...group,
      items: q
        ? group.items.filter((item) => item.label.toLowerCase().includes(q))
        : group.items,
    }))
    .filter((group) => group.items.length > 0);
  const actionMatches = q
    ? CREATE_ACTIONS.filter((action) => action.label.toLowerCase().includes(q))
    : CREATE_ACTIONS;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur">
      {/* Mobile: burger opens the sidebar as a Sheet (< md only). */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Navigation öffnen"
            />
          }
        >
          <Menu />
        </SheetTrigger>
        <SheetContent side="left" className="w-60 gap-0 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Search input – opens the command palette. */}
      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        aria-label="Suche öffnen"
        data-testid="command-trigger"
        className="flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-muted transition-colors hover:bg-surface-hover"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Suchen…</span>
        <kbd className="pointer-events-none hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 font-mono text-[11px] text-muted sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={commandOpen} onOpenChange={setOpen}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Suchen: Projekte, Tasks, Stories, Personen, Releases…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>Keine Treffer.</CommandEmpty>

            {/* Entity matches (only when searching). */}
            {KIND_ORDER.map((kind) => {
              const items = grouped[kind];
              if (!items?.length) return null;
              const { heading, icon: Icon } = KIND_META[kind];
              return (
                <CommandGroup key={kind} heading={heading}>
                  {items.map((result) => (
                    <CommandItem
                      key={result.key}
                      value={result.key}
                      onSelect={() => runCommand(() => router.push(result.href))}
                    >
                      <Icon className="text-muted" />
                      {result.badge && (
                        <span className="shrink-0 font-mono text-xs text-muted">
                          {result.badge}
                        </span>
                      )}
                      <span className="truncate">{result.label}</span>
                      {result.sublabel && (
                        <span className="ml-auto truncate text-xs text-muted">
                          {result.sublabel}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}

            {/* Navigation routes. */}
            {navMatches.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={`nav:${item.href}`}
                      onSelect={() => runCommand(() => router.push(item.href))}
                    >
                      <Icon className="text-muted" />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}

            {/* Create actions. */}
            {actionMatches.length > 0 && (
              <CommandGroup heading="Aktionen">
                {actionMatches.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={`action:${action.id}`}
                    onSelect={() =>
                      runCommand(() => {
                        if (action.intent) requestAction(action.intent);
                        router.push(action.href);
                      })
                    }
                  >
                    <Plus className="text-muted" />
                    {action.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </header>
  );
}
