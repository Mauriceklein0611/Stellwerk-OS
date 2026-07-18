import { describe, expect, it } from "vitest";

import { navGroups, navItems } from "@/lib/navigation";
import { SWIMLANE_MODES } from "@/lib/swimlanes";

/**
 * TASK-066 – UI-Sprache konsequent deutsch.
 *
 * Smoke-Test auf der einzigen Quelle der Navigation (`navGroups`), aus der sich
 * sowohl <Sidebar> als auch <CommandBar> speisen. Statt beide Komponenten zu
 * rendern (next/navigation-Mock), prüfen wir die Datenquelle direkt: erwartete
 * deutsche Labels vorhanden, keine bekannten englischen Alt-Labels mehr da,
 * etablierte Fachbegriffe bewusst erhalten.
 */

const allLabels = [
  ...navGroups.map((group) => group.label),
  ...navItems.map((item) => item.label),
];

describe("Navigation UI-Sprache (TASK-066)", () => {
  it("übersetzt die Gruppen-Labels ins Deutsche", () => {
    const groupLabels = navGroups.map((group) => group.label);
    expect(groupLabels).toEqual([
      "Übersicht",
      "Projekte",
      "Agenten",
      "Umsetzung",
      "System",
    ]);
  });

  it("übersetzt generische Item-Labels (Projekte, Neue Idee, Agenten)", () => {
    const hrefLabel = new Map(navItems.map((item) => [item.href, item.label]));
    expect(hrefLabel.get("/projects")).toBe("Projekte");
    expect(hrefLabel.get("/ideas/new")).toBe("Neue Idee");
    expect(hrefLabel.get("/agents")).toBe("Agenten");
  });

  it("enthält keine der bekannten englischen Alt-Labels mehr", () => {
    const retired = ["Overview", "Projects", "Agents", "Delivery", "New Idea"];
    for (const label of retired) {
      expect(allLabels).not.toContain(label);
    }
  });

  it("behält etablierte Scrum-/Kanban-Fachbegriffe unübersetzt", () => {
    const kept = ["Backlog", "Board", "Sprints", "Ceremonies", "Releases"];
    for (const label of kept) {
      expect(allLabels).toContain(label);
    }
  });

  it("übersetzt die Swimlane-Dimension Assignee → Zuständig", () => {
    const labels = SWIMLANE_MODES.map((mode) => mode.label);
    expect(labels).toContain("Zuständig");
    expect(labels).not.toContain("Assignee");
  });
});
