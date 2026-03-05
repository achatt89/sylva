import { describe, it, expect, afterEach } from "vitest";
import { isBraveSearchAvailable } from "../../../src/awareness/braveSearch";
import { buildQueries } from "../../../src/awareness/webGrounding";
import { VersionInfo } from "../../../src/awareness/types";

describe("braveSearch", () => {
  describe("isBraveSearchAvailable", () => {
    const originalEnv = process.env.BRAVE_API_KEY;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.BRAVE_API_KEY = originalEnv;
      } else {
        delete process.env.BRAVE_API_KEY;
      }
    });

    it("returns false when BRAVE_API_KEY is not set", () => {
      delete process.env.BRAVE_API_KEY;
      expect(isBraveSearchAvailable()).toBe(false);
    });

    it("returns true when BRAVE_API_KEY is set", () => {
      process.env.BRAVE_API_KEY = "test-key";
      expect(isBraveSearchAvailable()).toBe(true);
    });
  });
});

describe("webGrounding", () => {
  describe("buildQueries", () => {
    it("builds version-specific queries when exact version is known", () => {
      const versionInfo: VersionInfo = {
        value: "17.2.0",
        certainty: "exact",
        sourceFile: "package.json",
      };

      const queries = buildQueries("Angular", versionInfo);

      expect(queries.length).toBeGreaterThanOrEqual(2);
      expect(queries.some((q) => q.includes("17"))).toBe(true);
      expect(queries.some((q) => q.includes("documentation"))).toBe(true);
    });

    it("builds latest fallback queries when version is unknown", () => {
      const versionInfo: VersionInfo = {
        certainty: "unknown",
      };

      const queries = buildQueries("React", versionInfo);

      expect(queries.length).toBeGreaterThanOrEqual(1);
      expect(queries.some((q) => q.includes("official documentation"))).toBe(true);
      // Should NOT include version numbers
      expect(queries.every((q) => !/\d+\.\d+/.test(q))).toBe(true);
    });

    it("builds latest fallback queries when version is ambiguous", () => {
      const versionInfo: VersionInfo = {
        value: "3.0",
        certainty: "ambiguous",
        sourceFile: "pom.xml",
      };

      const queries = buildQueries("Spring Boot", versionInfo);

      expect(queries.some((q) => q.includes("official documentation"))).toBe(true);
    });
  });
});
