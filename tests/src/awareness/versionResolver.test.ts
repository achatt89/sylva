import { describe, it, expect } from "vitest";
import { resolveVersion, resolveAllVersions } from "../../../src/awareness/versionResolver";
import { Signal, VersionInfo } from "../../../src/awareness/types";

function makeSignal(frameworkId: string, version?: VersionInfo): Signal {
  return {
    kind: "framework",
    frameworkId,
    frameworkName: frameworkId,
    version,
    evidence: { file: "test.json", reason: "test" },
    scope: {},
  };
}

describe("versionResolver", () => {
  describe("resolveVersion", () => {
    it("returns exact when a single exact version is present", () => {
      const signals = [
        makeSignal("angular", {
          value: "17.2.0",
          certainty: "exact",
          sourceFile: "package.json",
        }),
      ];
      const result = resolveVersion(signals);
      expect(result.certainty).toBe("exact");
      expect(result.value).toBe("17.2.0");
    });

    it("returns unknown when no version signals exist", () => {
      const signals = [makeSignal("nodejs")];
      const result = resolveVersion(signals);
      expect(result.certainty).toBe("unknown");
    });

    it("returns ambiguous when multiple conflicting exact versions exist", () => {
      const signals = [
        makeSignal("angular", {
          value: "17.2.0",
          certainty: "exact",
          sourceFile: "a.json",
        }),
        makeSignal("angular", {
          value: "16.0.0",
          certainty: "exact",
          sourceFile: "b.json",
        }),
      ];
      const result = resolveVersion(signals);
      expect(result.certainty).toBe("ambiguous");
    });

    it("returns exact when multiple exact versions agree", () => {
      const signals = [
        makeSignal("react", {
          value: "18.2.0",
          certainty: "exact",
          sourceFile: "a.json",
        }),
        makeSignal("react", {
          value: "18.2.0",
          certainty: "exact",
          sourceFile: "lock.json",
        }),
      ];
      const result = resolveVersion(signals);
      expect(result.certainty).toBe("exact");
      expect(result.value).toBe("18.2.0");
    });

    it("prefers exact over ambiguous", () => {
      const signals = [
        makeSignal("react", {
          value: "18.2.0",
          certainty: "exact",
          sourceFile: "lock.json",
        }),
        makeSignal("react", {
          value: "18",
          certainty: "ambiguous",
          sourceFile: "pkg.json",
        }),
      ];
      const result = resolveVersion(signals);
      expect(result.certainty).toBe("exact");
    });
  });

  describe("resolveAllVersions", () => {
    it("resolves versions for multiple frameworks", () => {
      const signals = [
        makeSignal("angular", {
          value: "17.2.0",
          certainty: "exact",
          sourceFile: "package.json",
        }),
        makeSignal("react", {
          value: "18",
          certainty: "ambiguous",
          sourceFile: "pkg.json",
        }),
        makeSignal("nodejs"),
      ];

      const resolved = resolveAllVersions(signals);

      expect(resolved.get("angular")?.certainty).toBe("exact");
      expect(resolved.get("react")?.certainty).toBe("ambiguous");
      expect(resolved.get("nodejs")?.certainty).toBe("unknown");
    });
  });
});
