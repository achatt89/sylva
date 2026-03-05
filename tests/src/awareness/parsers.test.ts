import { describe, it, expect } from "vitest";
import * as path from "path";
import { ManifestFile } from "../../../src/awareness/types";
import { parseManifest } from "../../../src/awareness/manifestParsers";

const FIXTURE_DIR = path.join(__dirname, "..", "..", "fixtures", "nested-monorepo");

function makeManifest(relativePath: string): ManifestFile {
  const absolutePath = path.join(FIXTURE_DIR, relativePath);
  const filename = path.basename(relativePath);
  const depth = relativePath.split(path.sep).length - 1;
  return { absolutePath, relativePath, filename, depth, size: 0 };
}

describe("manifest parsers", () => {
  describe("openclawParser", () => {
    it("emits orchestrator signal from openclaw.json", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const orchestratorSignals = signals.filter((s) => s.kind === "orchestrator");
      expect(orchestratorSignals.length).toBe(1);
      expect(orchestratorSignals[0].frameworkId).toBe("openclaw");
      expect(orchestratorSignals[0].frameworkName).toBe("OpenClaw");
    });

    it("emits tool signals from openclaw.json", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const toolSignals = signals.filter(
        (s) => s.kind === "tooling" && s.frameworkId.startsWith("openclaw-tool-")
      );
      expect(toolSignals.length).toBeGreaterThanOrEqual(2); // web.search and web.fetch
    });

    it("emits channel signals from openclaw.json", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const channelSignals = signals.filter(
        (s) => s.kind === "tooling" && s.frameworkId.startsWith("openclaw-channel-")
      );
      expect(channelSignals.length).toBeGreaterThanOrEqual(2); // telegram, whatsapp
    });
  });

  describe("packageJsonParser", () => {
    it("detects Angular from @angular/core dependency", () => {
      const manifest = makeManifest(path.join("frontend", "package.json"));
      const signals = parseManifest(manifest);

      const angularSignals = signals.filter((s) => s.frameworkId === "angular");
      expect(angularSignals.length).toBeGreaterThanOrEqual(1);
    });

    it("extracts exact Angular version when pinned", () => {
      const manifest = makeManifest(path.join("frontend", "package.json"));
      const signals = parseManifest(manifest);

      const angularSignal = signals.find((s) => s.frameworkId === "angular");
      expect(angularSignal).toBeDefined();
      expect(angularSignal!.version).toBeDefined();
      expect(angularSignal!.version!.value).toBe("17.2.0");
      expect(angularSignal!.version!.certainty).toBe("exact");
    });

    it("detects TypeScript from devDependencies", () => {
      const manifest = makeManifest(path.join("frontend", "package.json"));
      const signals = parseManifest(manifest);

      const tsSignals = signals.filter((s) => s.frameworkId === "typescript");
      expect(tsSignals.length).toBeGreaterThanOrEqual(1);
    });

    it("detects Node.js from any package.json", () => {
      const manifest = makeManifest("package.json");
      const signals = parseManifest(manifest);

      const nodeSignals = signals.filter((s) => s.frameworkId === "nodejs");
      expect(nodeSignals.length).toBe(1);
    });
  });

  describe("pythonParsers", () => {
    it("detects FastAPI from pyproject.toml", () => {
      const manifest = makeManifest(path.join("services", "api", "pyproject.toml"));
      const signals = parseManifest(manifest);

      const fastapiSignals = signals.filter((s) => s.frameworkId === "fastapi");
      expect(fastapiSignals.length).toBeGreaterThanOrEqual(1);
    });

    it("marks FastAPI version as exact when pinned in pyproject.toml", () => {
      const manifest = makeManifest(path.join("services", "api", "pyproject.toml"));
      const signals = parseManifest(manifest);

      const fastapiSignal = signals.find((s) => s.frameworkId === "fastapi");
      expect(fastapiSignal).toBeDefined();
      expect(fastapiSignal!.version).toBeDefined();
      expect(fastapiSignal!.version!.value).toBe("0.109.0");
      expect(fastapiSignal!.version!.certainty).toBe("exact");
    });

    it("emits Python signal", () => {
      const manifest = makeManifest(path.join("services", "api", "pyproject.toml"));
      const signals = parseManifest(manifest);

      const pythonSignals = signals.filter((s) => s.frameworkId === "python");
      expect(pythonSignals.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("javaParsers", () => {
    it("detects Spring Boot from pom.xml parent", () => {
      const manifest = makeManifest(path.join("services", "core", "pom.xml"));
      const signals = parseManifest(manifest);

      const springBootSignals = signals.filter((s) => s.frameworkId === "spring-boot");
      expect(springBootSignals.length).toBeGreaterThanOrEqual(1);
    });

    it("extracts Spring Boot version as exact", () => {
      const manifest = makeManifest(path.join("services", "core", "pom.xml"));
      const signals = parseManifest(manifest);

      const sbSignal = signals.find((s) => s.frameworkId === "spring-boot");
      expect(sbSignal).toBeDefined();
      expect(sbSignal!.version).toBeDefined();
      expect(sbSignal!.version!.value).toBe("3.2.1");
      expect(sbSignal!.version!.certainty).toBe("exact");
    });

    it("extracts Java version from properties", () => {
      const manifest = makeManifest(path.join("services", "core", "pom.xml"));
      const signals = parseManifest(manifest);

      const javaSignal = signals.find((s) => s.frameworkId === "java" && s.kind === "version");
      expect(javaSignal).toBeDefined();
      expect(javaSignal!.version!.value).toBe("21");
      expect(javaSignal!.version!.certainty).toBe("exact");
    });
  });

  describe("angularJsonParser", () => {
    it("detects Angular from angular.json", () => {
      const manifest = makeManifest(path.join("frontend", "angular.json"));
      const signals = parseManifest(manifest);

      const angularSignals = signals.filter((s) => s.frameworkId === "angular");
      expect(angularSignals.length).toBe(1);
      expect(angularSignals[0].evidence.reason).toContain("frontend-app");
    });
  });
});
