import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProgressList } from "@/components/dashboard/ProgressList";
import { DashboardEmpty } from "@/components/dashboard/DashboardEmpty";

describe("dashboard empty states", () => {
  it("ActivityFeed shows a CTA when there are no runs", () => {
    render(<ActivityFeed runs={[]} />);
    const cta = screen.getByRole("link", { name: /pipeline/i });
    expect(cta).toHaveAttribute("href", "/projects");
  });

  it("ProgressList shows a CTA when there are no projects", () => {
    render(<ProgressList projects={[]} />);
    const cta = screen.getByRole("link", { name: /idee anlegen/i });
    expect(cta).toHaveAttribute("href", "/ideas/new");
  });

  it("DashboardEmpty offers the primary CTAs", () => {
    render(<DashboardEmpty />);
    expect(screen.getByRole("link", { name: /idee anlegen/i })).toHaveAttribute(
      "href",
      "/ideas/new",
    );
    expect(screen.getByRole("link", { name: /projekte ansehen/i })).toHaveAttribute(
      "href",
      "/projects",
    );
  });
});
