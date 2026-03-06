/**
 * Stack detector and architecture model builder.
 * Deterministic — no LLM involvement.
 */

import {
  Signal,
  StackInfo,
  ArchitectureModel,
  OrchestratorInfo,
  Workload,
  VersionInfo,
} from "./types";
import { resolveVersion } from "./versionResolver";

/** Confidence scoring rules */
const CONFIDENCE_SCORES: Record<string, number> = {
  orchestrator: 95,
  angular: 85,
  react: 80,
  nextjs: 85,
  vue: 80,
  nuxt: 85,
  svelte: 80,
  sveltekit: 85,
  express: 75,
  nestjs: 85,
  fastify: 75,
  django: 85,
  flask: 75,
  fastapi: 80,
  "spring-boot": 90,
  spring: 80,
  "java-maven": 70,
  "java-gradle": 70,
  dotnet: 80,
  "aspnet-core": 85,
  go: 80,
  rust: 80,
  "actix-web": 85,
  axum: 85,
  nodejs: 60,
  python: 60,
  typescript: 65,
  docker: 50,
};

/**
 * Detect stacks from signals.
 * Groups signals by frameworkId and scores confidence.
 */
export function detectStacks(signals: Signal[]): StackInfo[] {
  const grouped = new Map<string, Signal[]>();

  for (const signal of signals) {
    // Skip non-framework signals from stack detection
    if (
      signal.kind === "tooling" ||
      signal.kind === "entrypoint" ||
      signal.kind === "agent" ||
      signal.kind === "subagent" ||
      signal.kind === "heartbeat" ||
      signal.kind === "cron" ||
      signal.kind === "hook" ||
      signal.kind === "skill" ||
      signal.kind === "plugin"
    )
      continue;

    if (!grouped.has(signal.frameworkId)) {
      grouped.set(signal.frameworkId, []);
    }
    grouped.get(signal.frameworkId)!.push(signal);
  }

  const stacks: StackInfo[] = [];

  for (const [frameworkId, frameworkSignals] of grouped) {
    const frameworkName = frameworkSignals[0].frameworkName;
    const confidence = CONFIDENCE_SCORES[frameworkId] || 50;
    const version = resolveVersion(frameworkSignals);

    // Determine rootPath — use the shallowest signal's scope
    const rootPaths = frameworkSignals.map((s) => s.scope.pathRoot).filter(Boolean) as string[];
    const rootPath =
      rootPaths.length > 0 ? rootPaths.sort((a, b) => a.length - b.length)[0] : undefined;

    stacks.push({
      frameworkId,
      frameworkName,
      confidence,
      versions: version.certainty !== "unknown" || version.value ? [version] : [],
      evidence: frameworkSignals,
      rootPath,
    });
  }

  // Sort by confidence descending
  stacks.sort((a, b) => b.confidence - a.confidence);
  return stacks;
}

/**
 * Detect architecture model from stacks and signals.
 */
export function detectArchitecture(stacks: StackInfo[], signals: Signal[]): ArchitectureModel {
  // Find orchestrator
  const orchestratorSignals = signals.filter((s) => s.kind === "orchestrator");
  let primaryOrchestrator: OrchestratorInfo | undefined;

  if (orchestratorSignals.length > 0) {
    const orcSignal = orchestratorSignals[0];
    primaryOrchestrator = {
      id: orcSignal.frameworkId,
      configPath: orcSignal.evidence.file,
      details: {
        excerpt: orcSignal.evidence.excerpt,
      },
    };
  }

  // Build workloads — group stacks by rootPath
  const rootPathGroups = new Map<string, StackInfo[]>();
  for (const stack of stacks) {
    const root = stack.rootPath || ".";
    if (!rootPathGroups.has(root)) {
      rootPathGroups.set(root, []);
    }
    rootPathGroups.get(root)!.push(stack);
  }

  const workloads: Workload[] = [];
  for (const [rootPath, groupStacks] of rootPathGroups) {
    // Collect entrypoints from signals
    const entrypoints = signals
      .filter(
        (s) =>
          s.kind === "entrypoint" &&
          (s.scope.pathRoot === rootPath || (!s.scope.pathRoot && rootPath === "."))
      )
      .map((s) => s.evidence.excerpt || s.evidence.reason);

    // Collect build tools
    const buildTools = signals
      .filter(
        (s) =>
          s.kind === "tooling" &&
          (s.scope.pathRoot === rootPath || (!s.scope.pathRoot && rootPath === "."))
      )
      .map((s) => s.frameworkName);

    workloads.push({
      id: rootPath.replace(/[^a-zA-Z0-9]/g, "-"),
      name: rootPath === "." ? "Root Project" : rootPath,
      rootPath,
      frameworks: groupStacks.map((s) => s.frameworkName),
      entrypoints,
      buildTools,
      evidence: groupStacks.flatMap((s) => s.evidence.map((e) => e.evidence)),
    });
  }

  // Determine repo type
  const uniqueRoots = [...rootPathGroups.keys()].filter((r) => r !== ".");
  let repoType: "single" | "monorepo" | "unknown";
  if (uniqueRoots.length >= 2) {
    repoType = "monorepo";
  } else if (uniqueRoots.length === 1 && rootPathGroups.has(".")) {
    repoType = "monorepo";
  } else if (uniqueRoots.length === 0) {
    repoType = "single";
  } else {
    repoType = "single";
  }

  // Build navigation guidance
  const whatToReadFirst: string[] = [];
  const whereThingsLive: string[] = [];

  if (primaryOrchestrator) {
    whatToReadFirst.push(`OpenClaw config: ${primaryOrchestrator.configPath}`);
  }

  for (const workload of workloads) {
    if (workload.frameworks.length > 0) {
      whereThingsLive.push(
        `${workload.name}: ${workload.frameworks.join(", ")} (at ${workload.rootPath})`
      );
    }
    if (workload.entrypoints.length > 0) {
      whatToReadFirst.push(
        `${workload.name} entrypoints: ${workload.entrypoints.slice(0, 3).join("; ")}`
      );
    }
  }

  return {
    primaryOrchestrator,
    workloads,
    repoType,
    navigation: {
      whatToReadFirst,
      whereThingsLive,
    },
  };
}

/**
 * Format a VersionInfo for display in AGENTS.md
 */
export function formatVersionForDisplay(frameworkName: string, version: VersionInfo): string {
  if (version.certainty === "exact" && version.value) {
    return `${frameworkName}: ${version.value} (exact; ${version.sourceFile || "manifest"})`;
  }
  if (version.certainty === "ambiguous" && version.value) {
    return `${frameworkName}: ~${version.value} (ambiguous; ${version.notes || "range without lockfile resolution"})`;
  }
  return `${frameworkName}: unknown (no explicit version found)`;
}
