/**
 * Integration tests for the full awareness pipeline.
 * Tests the end-to-end flow: scan → parse → detect → resolve → architecture.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as path from "path";
import * as fs from "fs";
import { runAwareness } from "../../../src/awareness";
import { scanManifests } from "../../../src/awareness/manifestScanner";
import { parseAllManifests } from "../../../src/awareness/manifestParsers";
import {
  detectStacks,
  detectArchitecture,
  formatVersionForDisplay,
} from "../../../src/awareness/detector";
import { resolveAllVersions } from "../../../src/awareness/versionResolver";

const FIXTURE_DIR = path.join(__dirname, "..", "..", "fixtures", "nested-monorepo");

describe("awareness pipeline integration", () => {
  describe("full pipeline: scan → parse → detect → resolve", () => {
    it("processes the entire nested monorepo fixture end-to-end", () => {
      const manifests = scanManifests(FIXTURE_DIR);
      const signals = parseAllManifests(manifests);
      const stacks = detectStacks(signals);
      const versions = resolveAllVersions(signals);
      const architecture = detectArchitecture(stacks, signals);

      // Manifests found from all depths
      expect(manifests.length).toBeGreaterThanOrEqual(6);

      // Signals emitted from all parsers
      expect(signals.length).toBeGreaterThan(10);

      // Multiple stacks detected
      expect(stacks.length).toBeGreaterThanOrEqual(5);

      // Versions resolved
      expect(versions.size).toBeGreaterThan(0);

      // Architecture model is complete
      expect(architecture.primaryOrchestrator).toBeDefined();
      expect(architecture.workloads.length).toBeGreaterThanOrEqual(3);
      expect(architecture.repoType).toBe("monorepo");
    });

    it("detects all four major frameworks in the fixture", () => {
      const manifests = scanManifests(FIXTURE_DIR);
      const signals = parseAllManifests(manifests);
      const stacks = detectStacks(signals);
      const ids = stacks.map((s) => s.frameworkId);

      // All four major stacks from fixture
      expect(ids).toContain("angular");
      expect(ids).toContain("fastapi");
      expect(ids).toContain("spring-boot");
      expect(ids).toContain("nodejs");
    });

    it("correctly scopes each framework to its subproject", () => {
      const manifests = scanManifests(FIXTURE_DIR);
      const signals = parseAllManifests(manifests);
      const stacks = detectStacks(signals);

      const angularStack = stacks.find((s) => s.frameworkId === "angular");
      const fastapiStack = stacks.find((s) => s.frameworkId === "fastapi");
      const springStack = stacks.find((s) => s.frameworkId === "spring-boot");

      // Each should be scoped at the correct path
      expect(angularStack!.rootPath).toBe("frontend");
      expect(fastapiStack!.rootPath).toBe(path.join("services", "api"));
      expect(springStack!.rootPath).toBe(path.join("services", "core"));
    });
  });

  describe("runAwareness (orchestrator)", () => {
    const tmpDir = path.join(__dirname, "..", "..", "tmp-awareness-test");

    beforeEach(() => {
      fs.mkdirSync(tmpDir, { recursive: true });
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it("produces a complete AwarenessResult", async () => {
      // Point to fixture dir, save output to tmp
      const originalCwd = process.cwd();
      process.chdir(tmpDir);

      try {
        const result = await runAwareness(FIXTURE_DIR, "test-monorepo");

        // Core result fields
        expect(result.manifests.length).toBeGreaterThanOrEqual(6);
        expect(result.signals.length).toBeGreaterThan(10);
        expect(result.stacks.length).toBeGreaterThanOrEqual(5);
        expect(result.architecture).toBeDefined();
        expect(result.constraintsBlock).toBeDefined();
        expect(result.awarenessContext).toBeDefined();

        // Constraints block contains the authoritative header
        expect(result.constraintsBlock).toContain("ARCHITECTURE CONSTRAINTS (AUTHORITATIVE)");
        expect(result.constraintsBlock).toContain("DETECTED STACKS:");

        // Awareness context includes architecture summary
        expect(result.awarenessContext).toContain("ARCHITECTURE SUMMARY:");
        expect(result.awarenessContext).toContain("monorepo");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("writes awareness.json to disk", async () => {
      const originalCwd = process.cwd();
      process.chdir(tmpDir);

      try {
        await runAwareness(FIXTURE_DIR, "test-monorepo");

        const awarenessFile = path.join(tmpDir, "projects", "test-monorepo", "awareness.json");
        expect(fs.existsSync(awarenessFile)).toBe(true);

        const content = JSON.parse(fs.readFileSync(awarenessFile, "utf-8"));
        expect(content.manifests).toBeDefined();
        expect(content.stacks).toBeDefined();
        expect(content.architecture).toBeDefined();
        expect(content.constraintsBlock).toBeDefined();
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("includes OpenClaw orchestrator in constraints when openclaw.json exists", async () => {
      const originalCwd = process.cwd();
      process.chdir(tmpDir);

      try {
        const result = await runAwareness(FIXTURE_DIR, "test-monorepo");

        expect(result.architecture.primaryOrchestrator).toBeDefined();
        expect(result.architecture.primaryOrchestrator!.id).toBe("openclaw");
        expect(result.constraintsBlock).toContain("OpenClaw");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("generates web ref errors when BRAVE_API_KEY is not set", async () => {
      const originalKey = process.env.BRAVE_API_KEY;
      delete process.env.BRAVE_API_KEY;
      const originalCwd = process.cwd();
      process.chdir(tmpDir);

      try {
        const result = await runAwareness(FIXTURE_DIR, "test-monorepo");

        // Should have error about missing key
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain("BRAVE_API_KEY");
        // Web references should be empty
        expect(result.webReferences.length).toBe(0);
      } finally {
        if (originalKey !== undefined) {
          process.env.BRAVE_API_KEY = originalKey;
        }
        process.chdir(originalCwd);
      }
    });
  });

  describe("formatVersionForDisplay", () => {
    it("formats exact version correctly", () => {
      const display = formatVersionForDisplay("Angular", {
        value: "17.2.0",
        certainty: "exact",
        sourceFile: "package.json",
      });
      expect(display).toContain("Angular");
      expect(display).toContain("17.2.0");
      expect(display).toContain("exact");
      expect(display).toContain("package.json");
    });

    it("formats unknown version correctly", () => {
      const display = formatVersionForDisplay("React", {
        certainty: "unknown",
      });
      expect(display).toContain("React");
      expect(display).toContain("unknown");
    });

    it("formats ambiguous version correctly", () => {
      const display = formatVersionForDisplay("Spring Boot", {
        value: "3.0",
        certainty: "ambiguous",
        sourceFile: "pom.xml",
        notes: "range without lockfile resolution",
      });
      expect(display).toContain("Spring Boot");
      expect(display).toContain("ambiguous");
    });
  });
});
