import { expect, test } from "@playwright/test";

const PROJECTS_KEY = "pm-studio-projects";
const SPRINTS_KEY = "pm-studio-sprints";
const BOARD_KEY = "pm-studio-board";

const ideas = [{ id: "e2e-p1", name: "E2E Sprint-Projekt" }];

const artifacts = {
  "e2e-p1": {
    backlog: {
      epics: [
        {
          id: "E-1",
          title: "Epic",
          stories: [
            { id: "US-1", title: "Story Eins", acceptance_criteria: [], estimate_pt: 3, priority: "hoch" },
            { id: "US-2", title: "Story Zwei", acceptance_criteria: [], estimate_pt: 5, priority: "mittel" },
          ],
        },
      ],
      sprint_suggestions: [],
    },
    // Present so the store's v2 shape is satisfied (TASK-045); the seed is
    // written at version 2 below, so the v1→v2 risk migration never runs.
    risks: { risks: [] },
  },
};

const sprints = [
  {
    id: "sp1",
    projectId: "e2e-p1",
    name: "Sprint 1",
    goal: "Erstes Inkrement",
    status: "planned",
    // US-2 is pre-assigned so the detail page has a story + task to show;
    // US-1 stays unassigned for the drag test.
    storyIds: ["US-2"] as string[],
    order: 0,
  },
];

// A board task linked to the assigned story, so the detail list is clickable.
const boardTasks = [
  {
    id: "t-us2",
    title: "US-2 Aufgabe",
    column: "todo",
    order: 0,
    projectId: "e2e-p1",
    projectName: "E2E Sprint-Projekt",
    storyId: "US-2",
    priority: "mittel",
  },
];

test.beforeEach(async ({ page }) => {
  // Seed only if absent, so a reload after a drag keeps the moved state.
  await page.addInitScript(
    ([projectsKey, ideasSeed, artifactsSeed, sprintsKey, sprintsSeed, boardKey, boardSeed]) => {
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
      if (!window.localStorage.getItem(boardKey)) {
        window.localStorage.setItem(
          boardKey,
          JSON.stringify({ state: { tasks: boardSeed }, version: 8 }),
        );
      }
    },
    [PROJECTS_KEY, ideas, artifacts, SPRINTS_KEY, sprints, BOARD_KEY, boardTasks] as const,
  );
});

test("sprint board renders unassigned stories and the seeded sprint", async ({ page }) => {
  await page.goto("/sprints");

  await expect(page.getByRole("heading", { name: "Sprints" })).toBeVisible();
  // Vertical sections since TASK-059 (sprint sections stacked, backlog last).
  await expect(
    page.getByTestId("sprint-section-unassigned").getByTestId("sprint-story-US-1"),
  ).toBeVisible();
  await expect(page.getByTestId("sprint-section-sp1")).toBeVisible();
});

test("assigning a story to a sprint survives a reload", async ({ page }) => {
  await page.goto("/sprints");

  // Since TASK-058 the drag lives on the grip handle (a click on the card body
  // opens the story dialog instead), so grab the handle to start the drag.
  const handle = page.getByTestId("sprint-story-drag-US-1");
  const target = page.getByTestId("sprint-section-sp1");

  const handleBox = await handle.boundingBox();
  const targetBox = await target.boundingBox();
  if (!handleBox || !targetBox) throw new Error("Bounding boxes not available");

  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height - 10, {
    steps: 10,
  });
  await page.mouse.up();

  await expect(target.getByTestId("sprint-story-US-1")).toBeVisible();

  await page.reload();

  await expect(
    page.getByTestId("sprint-section-sp1").getByTestId("sprint-story-US-1"),
  ).toBeVisible();
  await expect(
    page.getByTestId("sprint-section-unassigned").getByTestId("sprint-story-US-1"),
  ).toHaveCount(0);
});

test("opens the sprint detail page and edits a task from its list (TASK-053)", async ({
  page,
}) => {
  await page.goto("/sprints");

  // Navigate to the detail page via the column's open link.
  await page.getByTestId("sprint-detail-link-sp1").click();
  await expect(page).toHaveURL(/\/sprints\/sp1$/);

  await expect(page.getByTestId("sprint-detail")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sprint 1" })).toBeVisible();

  // The assigned story and its board task are listed and clickable.
  await expect(page.getByTestId("sprint-detail-story-US-2")).toBeVisible();
  await page.getByTestId("sprint-detail-task-t-us2").click();

  // Clicking a task opens the same TaskDialog as the board.
  await expect(page.getByRole("heading", { name: "Task bearbeiten" })).toBeVisible();

  // Close the modal before navigating (its overlay would block the back link).
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Task bearbeiten" })).toBeHidden();

  // Back link returns to the overview (scoped to the detail view; the sidebar
  // also has a "Sprints" link).
  await page.getByTestId("sprint-detail").getByRole("link", { name: "Sprints" }).click();
  await expect(page).toHaveURL(/\/sprints$/);
});
