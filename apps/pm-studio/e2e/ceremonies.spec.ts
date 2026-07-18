import { expect, test } from "@playwright/test";

const PROJECTS_KEY = "pm-studio-projects";
const SPRINTS_KEY = "pm-studio-sprints";

const ideas = [{ id: "e2e-c1", name: "E2E Ceremonies-Projekt" }];

const artifacts = {
  "e2e-c1": {
    backlog: {
      epics: [
        {
          id: "E-1",
          title: "Epic",
          stories: [
            { id: "US-1", title: "Story Eins", acceptance_criteria: [], estimate_pt: 3, priority: "hoch" },
          ],
        },
      ],
      sprint_suggestions: [],
    },
    // v2 project shape (TASK-045) so the risk migration never runs and the
    // project is present for the ceremonies page.
    risks: { risks: [] },
  },
};

const sprints = [
  {
    id: "sp1",
    projectId: "e2e-c1",
    name: "Sprint 1",
    goal: "Erstes Inkrement",
    status: "active",
    storyIds: ["US-1"] as string[],
    order: 0,
  },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ([projectsKey, ideasSeed, artifactsSeed, sprintsKey, sprintsSeed]) => {
      if (!window.localStorage.getItem(projectsKey)) {
        window.localStorage.setItem(
          projectsKey,
          JSON.stringify({ state: { ideas: ideasSeed, artifacts: artifactsSeed }, version: 2 }),
        );
      }
      if (!window.localStorage.getItem(sprintsKey)) {
        window.localStorage.setItem(
          sprintsKey,
          JSON.stringify({ state: { sprints: sprintsSeed }, version: 1 }),
        );
      }
    },
    [PROJECTS_KEY, ideas, artifacts, SPRINTS_KEY, sprints] as const,
  );
});

test("creates a review that appears in the history and survives a reload", async ({ page }) => {
  await page.goto("/ceremonies");
  await expect(page.getByRole("heading", { name: "Ceremonies" })).toBeVisible();

  // Open the "Neue Review" flow – the sprint is pre-selected, scope defaults to
  // team-übergreifend, so the review form renders straight away.
  await page.getByTestId("ceremony-new-review").click();
  await expect(page.getByRole("heading", { name: "Neue Review" })).toBeVisible();

  await page.locator("#review-delivered").fill("Login + Profil ausgeliefert");
  await page.locator("#review-achieved").fill("8");
  await page.getByRole("button", { name: "Review speichern" }).click();

  const history = page.getByTestId("ceremony-history");
  await expect(history.getByText("Login + Profil ausgeliefert")).toBeVisible();
  await expect(history.getByText("E2E Ceremonies-Projekt · Sprint 1")).toBeVisible();

  await page.reload();
  await expect(
    page.getByTestId("ceremony-history").getByText("Login + Profil ausgeliefert"),
  ).toBeVisible();
});

test("links a sprint story and comments on a review, both surviving a reload", async ({
  page,
}) => {
  await page.goto("/ceremonies");

  // Create a review first (sprint pre-selected, cross scope by default).
  await page.getByTestId("ceremony-new-review").click();
  await page.locator("#review-delivered").fill("Increment 1");
  await page.locator("#review-achieved").fill("3");
  await page.getByRole("button", { name: "Review speichern" }).click();

  const entry = page.getByTestId("ceremony-entry").first();

  // Link the sprint's story via the picker.
  await entry.getByTestId("ceremony-link-picker").click();
  await entry.getByTestId("ceremony-link-option-story-US-1").click();
  const chip = entry.getByTestId("ceremony-link-US-1");
  await expect(chip).toContainText("Story Eins");
  await expect(chip.locator("a")).toHaveAttribute("href", "/sprints/sp1");

  // Add a comment.
  await entry.getByTestId("ceremony-comment-author").fill("Mia");
  await entry.getByTestId("ceremony-comment-input").fill("Sauber geliefert");
  await entry.getByTestId("ceremony-comment-submit").click();
  await expect(entry.getByTestId("ceremony-comments")).toContainText("Sauber geliefert");

  // Both persist across a reload.
  await page.reload();
  const reloaded = page.getByTestId("ceremony-entry").first();
  await expect(reloaded.getByTestId("ceremony-link-US-1")).toContainText("Story Eins");
  await expect(reloaded.getByTestId("ceremony-comments")).toContainText("Sauber geliefert");
});

test("creates a retro entry from the ceremonies area", async ({ page }) => {
  await page.goto("/ceremonies");

  await page.getByTestId("ceremony-new-retro").click();
  await expect(page.getByRole("heading", { name: "Neue Retro" })).toBeVisible();

  const goodInput = page.getByLabel("Lief gut: neuer Eintrag");
  await goodInput.fill("Gute Zusammenarbeit");
  await goodInput.press("Enter");
  await page.getByRole("button", { name: "Retro speichern" }).click();

  const entry = page.getByTestId("ceremony-entry").filter({ hasText: "Retro" }).first();
  await expect(entry.getByText(/Gute Zusammenarbeit/)).toBeVisible();
});

test("turns a retro action into a board task without creating a duplicate (TASK-065)", async ({
  page,
}) => {
  await page.goto("/ceremonies");

  // Create a retro that carries an action item.
  await page.getByTestId("ceremony-new-retro").click();
  const actionInput = page.getByLabel("Aktionen: neuer Eintrag");
  await actionInput.fill("CI reparieren");
  await actionInput.press("Enter");
  await page.getByRole("button", { name: "Retro speichern" }).click();

  const entry = page.getByTestId("ceremony-entry").filter({ hasText: "Retro" }).first();

  // Turn the action into a task via the pre-filled mini dialog.
  await entry.getByTestId("retro-action-create-task").click();
  await expect(page.getByRole("heading", { name: "Maßnahme als Task" })).toBeVisible();
  await expect(page.getByTestId("retro-action-title")).toHaveValue("CI reparieren");
  await page.getByTestId("retro-action-create").click();

  // The action now shows the linked badge instead of the button (dedup) …
  await expect(entry.getByTestId("retro-action-linked")).toBeVisible();
  await expect(entry.getByTestId("retro-action-create-task")).toHaveCount(0);

  // … and the link survives a reload (task persisted in the board store).
  await page.reload();
  const reloaded = page
    .getByTestId("ceremony-entry")
    .filter({ hasText: "Retro" })
    .first();
  await expect(reloaded.getByTestId("retro-action-linked")).toBeVisible();

  // The task really exists on the board.
  await page.goto("/board");
  await expect(page.getByText("CI reparieren").first()).toBeVisible();
});

test("sprint detail lists the sprint's ceremonies (TASK-065)", async ({ page }) => {
  // Seed a retro via the ceremonies flow so a ceremony exists for the sprint.
  await page.goto("/ceremonies");
  await page.getByTestId("ceremony-new-retro").click();
  const goodInput = page.getByLabel("Lief gut: neuer Eintrag");
  await goodInput.fill("Sauber geliefert");
  await goodInput.press("Enter");
  await page.getByRole("button", { name: "Retro speichern" }).click();
  await expect(page.getByTestId("ceremony-entry").first()).toBeVisible();

  // The sprint detail page links the ceremony back to /ceremonies.
  await page.goto("/sprints/sp1");
  const list = page.getByTestId("sprint-detail-ceremonies");
  await expect(list).toBeVisible();
  await expect(list.getByRole("link").first()).toHaveAttribute("href", "/ceremonies");
});
