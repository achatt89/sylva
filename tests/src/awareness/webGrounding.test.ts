/**
 * Tests for the web grounding module.
 * Tests query building logic and reference gathering behavior.
 */

import { describe, it, expect, afterEach } from "vitest";
import { buildQueries, gatherReferences } from "../../../src/awareness/webGrounding";
import { StackInfo, VersionInfo } from "../../../src/awareness/types";

describe("webGrounding", () => {
  describe("buildQueries", () => {
    it("builds major + minor queries for exact version with three segments", () => {
      const versionInfo: VersionInfo = {
        value: "17.2.3",
        certainty: "exact",
        sourceFile: "package.json",
      };

      const queries = buildQueries("Angular", versionInfo);

      // Should include major-level query
      expect(queries.some((q) => q.includes("17") && q.includes("documentation"))).toBe(true);
      // Should include major.minor query
      expect(queries.some((q) => q.includes("17.2") && q.includes("reference"))).toBe(true);
      // Should include best practices
      expect(queries.some((q) => q.includes("best practices"))).toBe(true);
    });

    it("builds major-only queries for version without minor", () => {
      const versionInfo: VersionInfo = {
        value: "3",
        certainty: "exact",
        sourceFile: "pom.xml",
      };

      const queries = buildQueries("Spring Boot", versionInfo);
      expect(queries.some((q) => q.includes("3") && q.includes("documentation"))).toBe(true);
      // Should NOT include minor-level reference query
      expect(queries.some((q) => q.includes("reference documentation"))).toBe(false);
    });

    it("strips 'v' prefix from version for query building", () => {
      const versionInfo: VersionInfo = {
        value: "v1.21.0",
        certainty: "exact",
        sourceFile: "go.mod",
      };

      const queries = buildQueries("Go", versionInfo);
      // Should use "1" not "v1"
      expect(queries.some((q) => q.includes("1") && q.includes("documentation"))).toBe(true);
    });

    it("builds generic queries for ambiguous version", () => {
      const versionInfo: VersionInfo = {
        value: "18",
        certainty: "ambiguous",
        sourceFile: "pkg.json",
      };

      const queries = buildQueries("React", versionInfo);
      expect(queries.some((q) => q.includes("official documentation"))).toBe(true);
      expect(queries.some((q) => q.includes("best practices"))).toBe(true);
    });

    it("builds generic queries for unknown version", () => {
      const versionInfo: VersionInfo = { certainty: "unknown" };
      const queries = buildQueries("Express", versionInfo);

      expect(queries.length).toBeGreaterThanOrEqual(1);
      expect(queries.every((q) => !q.match(/\d+\.\d+/))).toBe(true);
    });
  });

  describe("gatherReferences", () => {
    const originalKey = process.env.BRAVE_API_KEY;

    afterEach(() => {
      if (originalKey !== undefined) {
        process.env.BRAVE_API_KEY = originalKey;
      } else {
        delete process.env.BRAVE_API_KEY;
      }
    });

    it("returns empty refs and error when BRAVE_API_KEY is missing", async () => {
      delete process.env.BRAVE_API_KEY;

      const stacks: StackInfo[] = [
        {
          frameworkId: "angular",
          frameworkName: "Angular",
          confidence: 85,
          versions: [{ value: "17.2.0", certainty: "exact", sourceFile: "package.json" }],
          evidence: [],
          rootPath: "frontend",
        },
      ];

      const { references, errors } = await gatherReferences(stacks);

      expect(references.length).toBe(0);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain("BRAVE_API_KEY");
    });

    it("skips generic framework IDs (nodejs, python) from web grounding", async () => {
      delete process.env.BRAVE_API_KEY;

      const stacks: StackInfo[] = [
        {
          frameworkId: "nodejs",
          frameworkName: "Node.js",
          confidence: 60,
          versions: [],
          evidence: [],
        },
      ];

      const { references } = await gatherReferences(stacks);
      // With no API key, no refs at all
      expect(references.length).toBe(0);
    });
  });
});
