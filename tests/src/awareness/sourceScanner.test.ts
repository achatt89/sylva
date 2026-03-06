import { describe, it, expect } from "vitest";
import * as path from "path";
import { scanSourceFiles } from "../../../src/awareness/sourceScanner";

const FIXTURE_DIR = path.join(__dirname, "..", "..", "fixtures", "nested-monorepo");

describe("sourceScanner", () => {
  it("detects Stripe integration from TypeScript file", () => {
    const signals = scanSourceFiles(FIXTURE_DIR);

    const stripeSignal = signals.find((s) => s.frameworkId === "stripe");
    expect(stripeSignal).toBeDefined();
    expect(stripeSignal?.kind).toBe("integration");
    expect(stripeSignal?.frameworkName).toBe("Stripe");
    expect(stripeSignal?.evidence.reason).toContain("Found SDK import pattern");
  });

  it("detects Wix integration from Python file", () => {
    const signals = scanSourceFiles(FIXTURE_DIR);

    const wixSignal = signals.find((s) => s.frameworkId === "wix");
    expect(wixSignal).toBeDefined();
    expect(wixSignal?.kind).toBe("integration");
    expect(wixSignal?.frameworkName).toBe("Wix Headless");
    // Should detect from URL pattern or env var
    expect(wixSignal?.evidence.reason).toBeDefined();
  });
});
