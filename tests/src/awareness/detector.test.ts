import { describe, it, expect } from "vitest";
import * as path from "path";
import { scanManifests } from "../../../src/awareness/manifestScanner";
import { parseAllManifests } from "../../../src/awareness/manifestParsers";
import { detectStacks, detectArchitecture } from "../../../src/awareness/detector";

const FIXTURE_DIR = path.join(__dirname, "..", "..", "fixtures", "nested-monorepo");

describe("detector", () => {
  const manifests = scanManifests(FIXTURE_DIR);
  const signals = parseAllManifests(manifests);

  describe("detectStacks", () => {
    it("detects multiple stacks from the monorepo", () => {
      const stacks = detectStacks(signals);
      const ids = stacks.map((s) => s.frameworkId);

      expect(ids).toContain("angular");
      expect(ids).toContain("fastapi");
      expect(ids).toContain("spring-boot");
      expect(ids).toContain("nodejs");
      expect(ids).toContain("python");
    });

    it("assigns correct rootPath scopes per stack", () => {
      const stacks = detectStacks(signals);

      const angularStack = stacks.find((s) => s.frameworkId === "angular");
      expect(angularStack!.rootPath).toContain("frontend");

      const fastapiStack = stacks.find((s) => s.frameworkId === "fastapi");
      expect(fastapiStack!.rootPath).toContain(path.join("services", "api"));

      const springStack = stacks.find((s) => s.frameworkId === "spring-boot");
      expect(springStack!.rootPath).toContain(path.join("services", "core"));
    });

    it("sorts stacks by confidence descending", () => {
      const stacks = detectStacks(signals);
      for (let i = 1; i < stacks.length; i++) {
        expect(stacks[i - 1].confidence).toBeGreaterThanOrEqual(stacks[i].confidence);
      }
    });
  });

  describe("detectArchitecture", () => {
    it("detects OpenClaw as primary orchestrator", () => {
      const stacks = detectStacks(signals);
      const architecture = detectArchitecture(stacks, signals);

      expect(architecture.primaryOrchestrator).toBeDefined();
      expect(architecture.primaryOrchestrator!.id).toBe("openclaw");
      expect(architecture.primaryOrchestrator!.configPath).toContain("openclaw.json");
    });

    it("classifies repo as monorepo when multiple roots exist", () => {
      const stacks = detectStacks(signals);
      const architecture = detectArchitecture(stacks, signals);

      expect(architecture.repoType).toBe("monorepo");
    });

    it("generates navigation guidance", () => {
      const stacks = detectStacks(signals);
      const architecture = detectArchitecture(stacks, signals);

      expect(architecture.navigation.whatToReadFirst.length).toBeGreaterThan(0);
      expect(architecture.navigation.whereThingsLive.length).toBeGreaterThan(0);
    });

    it("creates workloads from different root paths", () => {
      const stacks = detectStacks(signals);
      const architecture = detectArchitecture(stacks, signals);

      expect(architecture.workloads.length).toBeGreaterThanOrEqual(3); // root, frontend, services/api, services/core
    });
  });
});
