import { describe, it, expect } from "vitest";
import { resolveModelConfig, listSupportedModels } from "../../src/modelConfig";
import { PROVIDER_GEMINI, PROVIDER_OPENAI } from "../../src/constants";

describe("modelConfig", () => {
  describe("resolveModelConfig", () => {
    it("resolves the default gemini model when no arg is provided", () => {
      // Unset AUTOSKILL_MODEL if it exists during test
      const originalEnv = process.env.AUTOSKILL_MODEL;
      delete process.env.AUTOSKILL_MODEL;
      process.env.GEMINI_API_KEY = "test_key";

      const config = resolveModelConfig();

      expect(config.provider).toBe(PROVIDER_GEMINI);
      expect(config.model).toBe("gemini/gemini-3.1-pro");
      expect(config.model_mini).toBe("gemini/gemini-3.1-flash");
      expect(config.api_key).toBe("test_key");

      if (originalEnv) process.env.AUTOSKILL_MODEL = originalEnv;
    });

    it("resolves a specific exact provider when provided", () => {
      process.env.OPENAI_API_KEY = "openai_test";
      const config = resolveModelConfig("openai");

      expect(config.provider).toBe(PROVIDER_OPENAI);
      expect(config.model).toBe("openai/gpt-5.3");
    });

    it("resolves a specific model string when provided", () => {
      process.env.OPENAI_API_KEY = "openai_test";
      const config = resolveModelConfig("openai/gpt-5.3-codex");

      expect(config.provider).toBe(PROVIDER_OPENAI);
      expect(config.model).toBe("openai/gpt-5.3-codex");
    });

    it("throws an error for unknown models", () => {
      expect(() => resolveModelConfig("fake/model-name")).toThrowError(/Unknown model/);
    });
  });

  describe("listSupportedModels", () => {
    it("returns a formatted string of supported catalogs", () => {
      const output = listSupportedModels();
      expect(output).toContain("gemini/gemini-3.1-pro");
      expect(output).toContain("(default mini)");
      expect(output).toContain("ANTHROPIC");
    });
  });
});
