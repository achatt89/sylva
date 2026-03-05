/**
 * Tests for prompt signature updates.
 * Verifies that awarenessContext is properly defined in all three LLM signatures.
 */

import { describe, it, expect } from "vitest";
import {
  CODEBASE_ANALYSIS_SIGNATURE,
  CODEBASE_ANALYZER_IDENTITY,
  COMPILE_CONVENTIONS_SIGNATURE,
  EXTRACT_AGENTS_SECTIONS_SIGNATURE,
} from "../../../src/prompts";

describe("prompt signatures — awareness integration", () => {
  describe("CODEBASE_ANALYSIS_SIGNATURE", () => {
    it("includes awarenessContext as an input field", () => {
      // The signature is built by f().input().output().build()
      // We check the built object has the awarenessContext field
      const sig = CODEBASE_ANALYSIS_SIGNATURE;
      expect(sig).toBeDefined();
      // The built signature should contain input definitions including awarenessContext
      // We verify by checking the serialized signature structure
      const sigStr = JSON.stringify(sig);
      expect(sigStr).toContain("awarenessContext");
      expect(sigStr).toContain("AUTHORITATIVE");
    });
  });

  describe("COMPILE_CONVENTIONS_SIGNATURE", () => {
    it("includes awarenessContext as an input field", () => {
      const sig = COMPILE_CONVENTIONS_SIGNATURE;
      expect(sig).toBeDefined();
      const sigStr = JSON.stringify(sig);
      expect(sigStr).toContain("awarenessContext");
      expect(sigStr).toContain("ARCHITECTURE CONSTRAINTS");
    });

    it("output description mandates alignment with constraints", () => {
      const sig = COMPILE_CONVENTIONS_SIGNATURE;
      const sigStr = JSON.stringify(sig);
      expect(sigStr).toContain("MUST align with the ARCHITECTURE CONSTRAINTS");
    });
  });

  describe("EXTRACT_AGENTS_SECTIONS_SIGNATURE", () => {
    it("includes awarenessContext as an input field", () => {
      const sig = EXTRACT_AGENTS_SECTIONS_SIGNATURE;
      expect(sig).toBeDefined();
      const sigStr = JSON.stringify(sig);
      expect(sigStr).toContain("awarenessContext");
      expect(sigStr).toContain("AUTHORITATIVE");
    });

    it("mentions OpenClaw handling in awarenessContext description", () => {
      const sig = EXTRACT_AGENTS_SECTIONS_SIGNATURE;
      const sigStr = JSON.stringify(sig);
      expect(sigStr).toContain("OpenClaw");
    });
  });

  describe("CODEBASE_ANALYZER_IDENTITY", () => {
    it("instructs the model to treat ARCHITECTURE CONSTRAINTS as authoritative", () => {
      const desc = CODEBASE_ANALYZER_IDENTITY.description;
      expect(desc).toContain("ARCHITECTURE CONSTRAINTS");
      expect(desc).toContain("AUTHORITATIVE");
    });

    it("instructs the model not to contradict detected evidence", () => {
      const desc = CODEBASE_ANALYZER_IDENTITY.description;
      expect(desc).toContain("Do not contradict");
    });

    it("instructs OpenClaw orchestrator handling", () => {
      const desc = CODEBASE_ANALYZER_IDENTITY.description;
      expect(desc).toContain("OpenClaw");
      expect(desc).toContain("orchestrator");
    });

    it("instructs model to use detected versions", () => {
      const desc = CODEBASE_ANALYZER_IDENTITY.description;
      expect(desc).toContain("detected stack and versions");
      expect(desc).toContain("unknown/ambiguous");
    });
  });
});
