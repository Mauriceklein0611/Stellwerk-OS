import { beforeEach, describe, expect, it } from "vitest";

import { SETTINGS_STORAGE_KEY } from "@/lib/theme";
import { useSettingsStore } from "@/store/useSettingsStore";

describe("useSettingsStore", () => {
  beforeEach(() =>
    useSettingsStore.setState({
      theme: "dark",
      defaultBoardView: "kanban",
      motion: "system",
    }),
  );

  it("defaults to dark theme, kanban view and system motion", () => {
    const state = useSettingsStore.getState();
    expect(state.theme).toBe("dark");
    expect(state.defaultBoardView).toBe("kanban");
    expect(state.motion).toBe("system");
  });

  it("updates each preference via its setter", () => {
    useSettingsStore.getState().setTheme("light");
    useSettingsStore.getState().setDefaultBoardView("list");
    useSettingsStore.getState().setMotion("reduced");

    const state = useSettingsStore.getState();
    expect(state.theme).toBe("light");
    expect(state.defaultBoardView).toBe("list");
    expect(state.motion).toBe("reduced");
  });

  it("persists under the shared settings storage key", () => {
    expect(useSettingsStore.persist.getOptions().name).toBe(
      SETTINGS_STORAGE_KEY,
    );
  });
});
