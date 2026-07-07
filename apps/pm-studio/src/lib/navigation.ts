import {
  Bot,
  CalendarRange,
  ClipboardList,
  Columns3,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  ListTree,
  Rocket,
  Settings,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for the app navigation.
 *
 * Both the <Sidebar> (grouped) and the <CommandBar> (flat ⌘K list) read from
 * here, so a route is added in exactly one place. Per docs/frontend-plan.md.
 */
export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navGroups: NavGroup[] = [
  {
    label: "Übersicht",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Meine Aufgaben", href: "/my-work", icon: ListTodo },
    ],
  },
  {
    label: "Projekte",
    items: [
      { label: "Projekte", href: "/projects", icon: FolderKanban },
      { label: "Neue Idee", href: "/ideas/new", icon: Lightbulb },
    ],
  },
  {
    label: "Agenten",
    items: [
      { label: "Agenten", href: "/agents", icon: Bot },
      { label: "Workflows", href: "/workflows", icon: Workflow },
      { label: "Team", href: "/team", icon: Users },
    ],
  },
  {
    label: "Umsetzung",
    items: [
      { label: "Backlog", href: "/backlog", icon: ListTree },
      { label: "Board", href: "/board", icon: Columns3 },
      { label: "Sprints", href: "/sprints", icon: CalendarRange },
      { label: "Ceremonies", href: "/ceremonies", icon: ClipboardList },
      { label: "Releases", href: "/releases", icon: Rocket },
    ],
  },
  {
    label: "System",
    items: [{ label: "Einstellungen", href: "/settings", icon: Settings }],
  },
];

/** Flat list of every navigable route – used by the ⌘K command palette. */
export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

/**
 * Active-state rule shared by Sidebar and CommandBar.
 * "/" only matches exactly; every other route also matches its sub-routes
 * (e.g. /projects/123 keeps "Projects" active) without false positives.
 */
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
