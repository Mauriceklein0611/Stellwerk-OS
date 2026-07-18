import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useSettingsStore } from "@/store/useSettingsStore";

/**
 * The jsdom matchMedia mock reports `matches: false` (no reduced motion), so
 * `system` resolves to false and the override branches are easy to isolate.
 */
describe("useReducedMotion override (TASK-029)", () => {
  afterEach(() => useSettingsStore.setState({ motion: "system" }));

  it("follows the media query when motion is system", () => {
    useSettingsStore.setState({ motion: "system" });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("forces reduced motion when motion is reduced", () => {
    useSettingsStore.setState({ motion: "reduced" });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("forces full motion when motion is full", () => {
    useSettingsStore.setState({ motion: "full" });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
