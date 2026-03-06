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

    it("extracts OpenClaw version from meta.lastTouchedVersion", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const orc = signals.find((s) => s.kind === "orchestrator");
      expect(orc).toBeDefined();
      expect(orc!.version).toBeDefined();
      expect(orc!.version!.value).toBe("2026.2.17");
      expect(orc!.version!.certainty).toBe("exact");
    });

    it("emits tool signals from openclaw.json", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const toolSignals = signals.filter(
        (s) => s.kind === "tooling" && s.frameworkId.startsWith("openclaw-tool-")
      );
      expect(toolSignals.length).toBeGreaterThanOrEqual(1);
    });

    it("emits channel signals with policy details", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const channelSignals = signals.filter(
        (s) => s.kind === "tooling" && s.frameworkId.startsWith("openclaw-channel-")
      );
      expect(channelSignals.length).toBeGreaterThanOrEqual(2);

      const telegram = channelSignals.find((s) => s.frameworkId === "openclaw-channel-telegram");
      expect(telegram).toBeDefined();
      expect(telegram!.evidence.excerpt).toContain("dmPolicy");
      expect(telegram!.evidence.excerpt).toContain("streamMode");
    });

    it("extracts agent config (model, concurrency)", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const agentConfig = signals.find((s) => s.frameworkId === "openclaw-agent-config");
      expect(agentConfig).toBeDefined();
      expect(agentConfig!.kind).toBe("agent");
      expect(agentConfig!.evidence.excerpt).toContain("google/gemini-3-flash-preview");
      expect(agentConfig!.evidence.excerpt).toContain("maxConcurrent: 4");
    });

    it("extracts model catalog", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const catalog = signals.find((s) => s.frameworkId === "openclaw-model-catalog");
      expect(catalog).toBeDefined();
      expect(catalog!.evidence.excerpt).toContain("google/gemini-3-flash-preview");
      expect(catalog!.evidence.excerpt).toContain("openai/gpt-5.2");
    });

    it("extracts hook signals with descriptions", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const hookSignals = signals.filter((s) => s.kind === "hook");
      expect(hookSignals.length).toBe(3); // boot-md, silvio, silvio-start

      const silvio = hookSignals.find((s) => s.frameworkId === "openclaw-hook-silvio");
      expect(silvio).toBeDefined();
      expect(silvio!.evidence.reason).toContain("Silvio Algorithmic Trading");
    });

    it("extracts plugin signals with enabled status", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const pluginSignals = signals.filter((s) => s.kind === "plugin");
      expect(pluginSignals.length).toBe(3); // whatsapp, telegram, discord

      const discord = pluginSignals.find((s) => s.frameworkId === "openclaw-plugin-discord");
      expect(discord).toBeDefined();
      expect(discord!.evidence.excerpt).toContain("enabled: true");
    });

    it("extracts gateway config with auth and denied commands", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const gateway = signals.find((s) => s.frameworkId === "openclaw-gateway");
      expect(gateway).toBeDefined();
      expect(gateway!.evidence.excerpt).toContain("port: 18789");
      expect(gateway!.evidence.excerpt).toContain("auth: token");
      expect(gateway!.evidence.excerpt).toContain("camera.snap");
    });

    it("extracts commands and messages config", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const commands = signals.find((s) => s.frameworkId === "openclaw-commands");
      expect(commands).toBeDefined();
      expect(commands!.evidence.excerpt).toContain("native: auto");

      const messages = signals.find((s) => s.frameworkId === "openclaw-messages");
      expect(messages).toBeDefined();
      expect(messages!.evidence.excerpt).toContain("ackReactionScope");
    });

    it("scans workspace and discovers skills", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const skillSignals = signals.filter((s) => s.kind === "skill");
      expect(skillSignals.length).toBe(2); // trading-skill, instagram-knowledge-ingestion-skill

      const tradingSkill = skillSignals.find((s) => s.frameworkId.includes("trading-skill"));
      expect(tradingSkill).toBeDefined();
      expect(tradingSkill!.evidence.reason).toContain("Trading Skill");
    });

    it("scans workspace and discovers subagents", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const subagentSignals = signals.filter((s) => s.kind === "subagent");
      expect(subagentSignals.length).toBe(2); // instagram-knowledge-ingestor, trading

      const igSubagent = subagentSignals.find((s) =>
        s.frameworkId.includes("instagram-knowledge-ingestor")
      );
      expect(igSubagent).toBeDefined();
      expect(igSubagent!.evidence.reason).toContain("Instagram Knowledge Ingestor Protocol");
      expect(igSubagent!.evidence.excerpt).toContain("apify_scrape.py");
    });

    it("detects heartbeat status from HEARTBEAT.md", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const heartbeat = signals.find((s) => s.kind === "heartbeat");
      expect(heartbeat).toBeDefined();
      expect(heartbeat!.evidence.excerpt).toContain("INACTIVE");
    });

    it("extracts agent identity from IDENTITY.md", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const identity = signals.find((s) => s.frameworkId === "openclaw-workspace-identity");
      expect(identity).toBeDefined();
      expect(identity!.evidence.excerpt).toContain("TestBot");
    });

    it("discovers workspace .md files", () => {
      const manifest = makeManifest(path.join("config", "openclaw.json"));
      const signals = parseManifest(manifest);

      const workspaceAgents = signals.find((s) => s.frameworkId === "openclaw-workspace-agents");
      expect(workspaceAgents).toBeDefined();
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
