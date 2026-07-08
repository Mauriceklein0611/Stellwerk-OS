import { expect, test } from "@playwright/test";

const PROJECTS_KEY = "pm-studio-projects";
const BACKLOG_KEY = "pm-studio-backlog";
const RELEASES_KEY = "pm-studio-releases";

// Two projects: p1 has a hand-seeded backlog (no pipeline artifacts at all),
// p2 is empty so the empty-state can be reached via the ?project deep-link.
const ideas = [
  { id: "e2e-p1", name: "E2E Backlog-Projekt" },
  { id: "e2e-p2", name: "E2E Leeres Projekt" },
];

const epics = [{ id: "E-1", projectId: "e2e-p1", title: "Kern", rank: 0 }];

// One release on p1 so the scope filter appears; US-1 is pre-assigned (TASK-062).
const releases = [
  {
    id: "e2e-r1",
    projectId: "e2e-p1",
    name: "Release Q3",
    status: "planned",
    startDate: "2026-07-01",
    endDate: "2026-07-28",
    sprintLengthWeeks: 2,
  },
];

const stories = [
  {
    id: "US-1",
    epicId: "E-1",
    projectId: "e2e-p1",
    title: "Story Eins",
    acceptance_criteria: [],
    estimate_pt: 3,
    priority: "hoch",
    rank: 0,
    provenance: "human",
    releaseId: "e2e-r1",
  },
  {
    id: "US-2",
    epicId: "E-1",
    projectId: "e2e-p1",
    title: "Story Zwei",
    acceptance_criteria: [],
    estimate_pt: 2,
    priority: "mittel",
    rank: 1,
    provenance: "human",
  },
];

test.beforeEach(async ({ page }) => {
  // Seed only if absent so a reload keeps any changes made during the test.
  await page.addInitScript(
    ([
      projectsKey,
      ideasSeed,
      backlogKey,
      epicsSeed,
      storiesSeed,
      releasesKey,
      releasesSeed,
    ]) => {
      if (!window.localStorage.getItem(projectsKey)) {
        window.localStorage.setItem(
          projectsKey,
          JSON.stringify({
            state: { ideas: ideasSeed, artifacts: {} },
            version: 2,
          }),
        );
      }
      if (!window.localStorage.getItem(backlogKey)) {
        window.localStorage.setItem(
          backlogKey,
          JSON.stringify({
            // artifactsMigrated:true → the one-time artifact promotion is a no-op,
            // proving the backlog works with directly-owned (human) items.
            state: {
              epics: epicsSeed,
              stories: storiesSeed,
              artifactsMigrated: true,
            },
            version: 1,
          }),
        );
      }
      if (!window.localStorage.getItem(releasesKey)) {
        window.localStorage.setItem(
          releasesKey,
          JSON.stringify({ state: { releases: releasesSeed }, version: 2 }),
        );
      }
    },
    [
      PROJECTS_KEY,
      ideas,
      BACKLOG_KEY,
      epics,
      stories,
      RELEASES_KEY,
      releases,
    ] as const,
  );
});

test("shows the seeded backlog and adds a story that survives a reload", async ({
  page,
}) => {
  await page.goto("/backlog");

  await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
  await expect(page.getByTestId("backlog-story-US-1")).toBeVisible();
  await expect(page.getByTestId("backlog-story-US-2")).toBeVisible();

  // Footer aggregate: 2 stories, 5 PT planned, 0 done.
  await expect(page.getByTestId("backlog-footer")).toContainText("2 Stories");
  await expect(page.getByTestId("backlog-footer")).toContainText("5 PT");

  await page.getByTestId("backlog-add-story-E-1-trigger").click();
  await page
    .getByTestId("backlog-add-story-E-1-input")
    .fill("Story aus dem Test");
  await page.getByTestId("backlog-add-story-E-1-input").press("Enter");

  await expect(page.getByText("Story aus dem Test")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Story aus dem Test")).toBeVisible();
});

test("opens the story dialog from a row click, edits it and it survives a reload (TASK-058)", async ({
  page,
}) => {
  await page.goto("/backlog");

  // The roll-up badge is a plain span, so a click on it bubbles to the row and
  // opens the dialog (the inline cells stop propagation and would edit instead).
  await page.getByTestId("backlog-rollup-US-1").click();
  await expect(page.getByText("Story bearbeiten")).toBeVisible();

  await page.getByLabel("Titel", { exact: true }).fill("Story Eins – editiert");
  await page.getByTestId("ac-new-input").fill("Muss geprüft sein");
  await page.getByTestId("ac-new-input").press("Enter");
  await page.getByRole("button", { name: "Speichern" }).click();

  await expect(page.getByText("Story Eins – editiert")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Story Eins – editiert")).toBeVisible();

  // Reopen: the added acceptance criterion persisted (progress shows 0/1).
  await page.getByTestId("backlog-rollup-US-1").click();
  await expect(page.getByTestId("ac-dialog-progress")).toHaveText("0/1");
});

test("reorders a story within its epic and the order survives a reload", async ({
  page,
}) => {
  await page.goto("/backlog");

  const handle = page.getByTestId("backlog-drag-US-2");
  const target = page.getByTestId("backlog-story-US-1");

  const handleBox = await handle.boundingBox();
  const targetBox = await target.boundingBox();
  if (!handleBox || !targetBox) throw new Error("Bounding boxes not available");

  // Drag US-2's handle above US-1 so it becomes the first row.
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y - 4, {
    steps: 12,
  });
  await page.mouse.up();

  // After the drop US-2 sits above US-1.
  const afterDrop = await page.getByTestId("backlog-story-US-2").boundingBox();
  const us1AfterDrop = await page.getByTestId("backlog-story-US-1").boundingBox();
  expect(afterDrop!.y).toBeLessThan(us1AfterDrop!.y);

  await page.reload();

  const us2Reload = await page.getByTestId("backlog-story-US-2").boundingBox();
  const us1Reload = await page.getByTestId("backlog-story-US-1").boundingBox();
  expect(us2Reload!.y).toBeLessThan(us1Reload!.y);
});

test("empty project (deep-link) offers manual story creation", async ({
  page,
}) => {
  // ?project deep-link selects the empty project directly (TASK-057/061).
  await page.goto("/backlog?project=e2e-p2");

  await expect(page.getByText("Noch kein Backlog")).toBeVisible();
  await page.getByTestId("backlog-create-first-story").click();

  // A default epic is created and its add field opens for immediate input.
  await expect(page.getByText("Neues Epic")).toBeVisible();
  const input = page.locator('[data-testid$="-input"]').first();
  await input.fill("Erste manuelle Story");
  await input.press("Enter");

  await expect(page.getByText("Erste manuelle Story")).toBeVisible();
});

test("agent panel: auto run fills the inbox, nothing lands until 'Alle übernehmen' (TASK-060)", async ({
  page,
}) => {
  // Empty project: proves the agent never writes to the backlog unasked.
  await page.goto("/backlog?project=e2e-p2");
  await expect(page.getByText("Noch kein Backlog")).toBeVisible();

  await page.getByTestId("backlog-empty-open-agent").click();
  await expect(page.getByTestId("agent-panel")).toBeVisible();

  // Auto mode generates proposals into the inbox – but nothing is in the backlog.
  await page.getByTestId("agent-panel-auto").click();
  await expect(page.getByTestId("agent-panel-accept-all")).toBeVisible();
  await expect(page.getByText("Noch kein Backlog")).toBeVisible();

  // Adopt all → proposals become real stories carrying an agent provenance mark.
  await page.getByTestId("agent-panel-accept-all").click();
  await expect(page.getByText("Alle Vorschläge bearbeitet")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByText("Noch kein Backlog")).toHaveCount(0);
  await expect(page.getByText("Agent").first()).toBeVisible();

  // Provenance persists across a reload.
  await page.reload();
  await expect(page.getByText("Agent").first()).toBeVisible();
});

test("assigns a story to a release inline and filters the backlog by scope (TASK-062)", async ({
  page,
}) => {
  await page.goto("/backlog");

  // US-1 is seeded into the release; assign US-2 inline to it as well.
  await page.getByLabel("Release: Story Zwei").click();
  await page.getByRole("option", { name: "Release Q3" }).click();
  await expect(page.getByLabel("Release: Story Zwei")).toContainText(
    "Release Q3",
  );

  // Scope filter → the release: both stories are in scope, the footer follows.
  await page.getByLabel("Release", { exact: true }).click();
  await page.getByRole("option", { name: "Release Q3" }).click();
  await expect(page.getByTestId("backlog-story-US-1")).toBeVisible();
  await expect(page.getByTestId("backlog-story-US-2")).toBeVisible();
  await expect(page.getByTestId("backlog-footer")).toContainText("2 Stories");
  await expect(page.getByTestId("backlog-footer")).toContainText("5 PT");

  // Scope filter → "Ohne Release": nothing left, the empty-filter card shows.
  await page.getByLabel("Release", { exact: true }).click();
  await page.getByRole("option", { name: "Ohne Release" }).click();
  await expect(
    page.getByText("Keine Stories für die aktuellen Filter."),
  ).toBeVisible();

  // The inline assignment persisted across a reload (filters reset to default).
  await page.reload();
  await expect(page.getByLabel("Release: Story Zwei")).toContainText(
    "Release Q3",
  );
});

test("CommandBar 'Neue Story' jumps to the backlog and opens the add field", async ({
  page,
}) => {
  await page.goto("/board");

  await page.getByTestId("command-trigger").click();
  await page.getByPlaceholder(/Suchen:/).fill("Neue Story");
  await page.getByText("Neue Story anlegen").click();

  await expect(page).toHaveURL(/\/backlog$/);
  await expect(page.getByTestId("backlog-add-story-E-1-input")).toBeVisible();
});

test("assigns readable item keys to the backlog and finds a story by key", async ({
  page,
}) => {
  await page.goto("/backlog");

  // The one-time backfill (item-key store) keys the seeded stories from the
  // project name "E2E Backlog-Projekt" → prefix "EBP", shared running sequence.
  const key = page.getByTestId("backlog-key-US-1");
  await expect(key).toHaveText("EBP-1");
  await expect(page.getByTestId("backlog-key-US-2")).toHaveText("EBP-2");

  // The key survives a reload (persisted in pm-studio-item-keys).
  await page.reload();
  await expect(page.getByTestId("backlog-key-US-1")).toHaveText("EBP-1");

  // Global search finds the item by its key and jumps to the project.
  await page.getByTestId("command-trigger").click();
  await page.getByPlaceholder(/Suchen:/).fill("EBP-2");
  // Scope to the palette result (the backlog row also contains the title).
  await page.getByRole("dialog").getByText("Story Zwei").click();
  await expect(page).toHaveURL(/\/projects\/e2e-p1$/);
});

test("story dialog does not overflow horizontally when the story has tasks (TASK-058 bugfix)", async ({
  page,
}) => {
  // A story with a board task (long title) used to blow up the dialog's grid
  // track (grid item min-width:auto), producing a horizontal scrollbar and
  // clipped controls. Seed such a task for US-1 before navigating.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "pm-studio-board",
      JSON.stringify({
        state: {
          tasks: [
            {
              id: "bt1",
              title: "Slack-Erinnerung am Freitagvormittag zuverlässig zustellen",
              column: "backlog",
              order: 0,
              projectId: "e2e-p1",
              projectName: "E2E Backlog-Projekt",
              storyId: "US-1",
              estimate_pt: 6,
              priority: "mittel",
            },
          ],
        },
        version: 8,
      }),
    );
  });

  await page.goto("/backlog");
  // Open the story dialog via the roll-up cell (row click; not an inline cell).
  await page.getByTestId("backlog-rollup-US-1").click();
  const content = page.locator('[data-slot="dialog-content"]');
  await expect(content).toBeVisible();

  // No horizontal overflow: scrollWidth must not exceed the visible width.
  const overflow = await content.evaluate(
    (el) => el.scrollWidth - el.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  // The primary actions stay within the dialog and clickable.
  await expect(content.getByRole("button", { name: "Speichern" })).toBeVisible();
});
