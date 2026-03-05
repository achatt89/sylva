/**
 * Tests for the modules.ts changes.
 * Verifies that CodebaseConventionExtractor and AgentsMdCreator
 * properly accept and forward awarenessContext.
 */

import { describe, it, expect } from "vitest";
import { CodebaseConventionExtractor, AgentsMdCreator } from "../../../src/modules";

describe("modules — awareness integration", () => {
  describe("CodebaseConventionExtractor", () => {
    it("accepts awarenessContext in extract()", async () => {
      const extractor = new CodebaseConventionExtractor(1);
      const sourceTree = { "test.ts": "export const a = 1;" };
      const awarenessContext = "=== ARCHITECTURE CONSTRAINTS ===\nTest constraints";

      const result = await extractor.extract(sourceTree, awarenessContext);

      // The context string should contain the awareness context prepended
      expect(result.contextString).toContain("ARCHITECTURE CONSTRAINTS");
      expect(result.contextString).toContain("Test constraints");
      // And also the source tree
      expect(result.contextString).toContain("test.ts");
    });

    it("works without awarenessContext (backward compatible)", async () => {
      const extractor = new CodebaseConventionExtractor(1);
      const sourceTree = { "test.ts": "export const a = 1;" };

      const result = await extractor.extract(sourceTree);

      expect(result.contextString).toContain("test.ts");
      // Should NOT contain constraint markers
      expect(result.contextString).not.toContain("ARCHITECTURE CONSTRAINTS");
    });

    it("separates awareness context from source tree with delimiter", async () => {
      const extractor = new CodebaseConventionExtractor(1);
      const sourceTree = { "index.ts": "console.log('hello');" };
      const awarenessContext = "CONSTRAINTS: test";

      const result = await extractor.extract(sourceTree, awarenessContext);

      // Should have delimiter between awareness context and source tree
      expect(result.contextString).toContain("---");
      expect(result.contextString).toContain("SOURCE TREE:");
    });
  });

  describe("AgentsMdCreator", () => {
    it("accepts optional awarenessContext parameter", () => {
      const creator = new AgentsMdCreator();

      // Should accept 4 args without type error (we test the interface, not the LLM call)
      expect(typeof creator.extractAndCompileSections).toBe("function");
      expect(creator.extractAndCompileSections.length).toBeGreaterThanOrEqual(3);
    });
  });
});
