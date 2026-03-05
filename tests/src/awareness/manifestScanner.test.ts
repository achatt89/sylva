import { describe, it, expect } from "vitest";
import * as path from "path";
import { scanManifests } from "../../../src/awareness/manifestScanner";

const FIXTURE_DIR = path.join(__dirname, "..", "..", "fixtures", "nested-monorepo");

describe("manifestScanner", () => {
  describe("scanManifests", () => {
    it("finds all nested manifest files in the monorepo fixture", () => {
      const manifests = scanManifests(FIXTURE_DIR);
      const relativePaths = manifests.map((m) => m.relativePath);

      // Root package.json
      expect(relativePaths).toContain("package.json");

      // Nested OpenClaw config
      expect(relativePaths).toContain(path.join("config", "openclaw.json"));

      // Nested Angular frontend
      expect(relativePaths).toContain(path.join("frontend", "angular.json"));
      expect(relativePaths).toContain(path.join("frontend", "package.json"));

      // Nested Python service
      expect(relativePaths).toContain(path.join("services", "api", "pyproject.toml"));

      // Nested Java service
      expect(relativePaths).toContain(path.join("services", "core", "pom.xml"));
    });

    it("sorts results by depth (shallowest first)", () => {
      const manifests = scanManifests(FIXTURE_DIR);

      // Root-level manifests should come before nested ones
      const rootIdx = manifests.findIndex((m) => m.relativePath === "package.json");
      const nestedIdx = manifests.findIndex(
        (m) => m.relativePath === path.join("config", "openclaw.json")
      );
      expect(rootIdx).toBeLessThan(nestedIdx);
    });

    it("includes correct metadata for each manifest", () => {
      const manifests = scanManifests(FIXTURE_DIR);
      const rootPkg = manifests.find((m) => m.relativePath === "package.json");

      expect(rootPkg).toBeDefined();
      expect(rootPkg!.filename).toBe("package.json");
      expect(rootPkg!.depth).toBe(0);
      expect(rootPkg!.size).toBeGreaterThan(0);
      expect(rootPkg!.absolutePath).toContain("package.json");
    });

    it("correctly identifies pom.xml at depth 2", () => {
      const manifests = scanManifests(FIXTURE_DIR);
      const pom = manifests.find(
        (m) => m.relativePath === path.join("services", "core", "pom.xml")
      );

      expect(pom).toBeDefined();
      expect(pom!.depth).toBe(2);
      expect(pom!.filename).toBe("pom.xml");
    });

    it("returns empty array for nonexistent directory", () => {
      const manifests = scanManifests("/nonexistent/path/to/repo");
      expect(manifests).toEqual([]);
    });
  });
});
