import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe("architecture seam", () => {
  it("only lib/agent-service.ts imports the mock implementation", () => {
    const seam = join("lib", "agent-service.ts");
    const offenders = walk("src")
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter(
        (file) =>
          !file.endsWith(seam) &&
          /from ["']@\/lib\/mock-agent-service["']/.test(
            readFileSync(file, "utf8"),
          ),
      );

    expect(offenders).toEqual([]);
  });
});
