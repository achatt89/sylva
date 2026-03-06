/**
 * Awareness orchestrator.
 * Top-level function that runs the entire awareness pipeline:
 * scan → parse → resolve versions → detect stacks → web ground → build constraints.
 */

import * as fs from "fs";
import * as path from "path";
import { AwarenessResult, Signal, StackInfo, VersionInfo } from "./types";
import { scanManifests } from "./manifestScanner";
import { parseAllManifests } from "./manifestParsers";
import { resolveAllVersions } from "./versionResolver";
import { detectStacks, detectArchitecture, formatVersionForDisplay } from "./detector";
import { gatherReferences } from "./webGrounding";
import { scanSourceFiles } from "./sourceScanner";

/**
 * The ARCHITECTURE CONSTRAINTS block injected into LLM context.
 * This is authoritative and must not be overridden by the model.
 */
function buildConstraintsBlock(
  stacks: StackInfo[],
  resolvedVersions: Map<string, VersionInfo>,
  hasOrchestrator: boolean,
  signals: Signal[]
): string {
  const lines: string[] = [
    "=== ARCHITECTURE CONSTRAINTS (AUTHORITATIVE) ===",
    "1) The detected frameworks/stacks listed below are authoritative because they were derived from repository manifest/config files.",
    "2) You MUST NOT invent additional frameworks, build systems, languages, entrypoints, or tooling not present in the evidence.",
    '3) If evidence is missing or ambiguous, say "unknown" or "ambiguous" and provide safe navigation guidance rather than guessing.',
    "4) Versions:",
    "   - Only state a version if it is explicitly detected from manifests/locks.",
    "   - If version is unknown/ambiguous, state that clearly.",
    "   - If you cite docs, choose versioned docs when exact version is known; otherwise use latest docs and label as fallback.",
  ];

  if (hasOrchestrator) {
    lines.push(
      "5) OpenClaw:",
      "   - If openclaw.json exists anywhere in the repo, treat OpenClaw as the orchestrator and structure AGENTS.md accordingly (OpenClaw Runtime + workloads)."
    );
  }

  lines.push("", "DETECTED STACKS:");
  for (const stack of stacks) {
    const version = resolvedVersions.get(stack.frameworkId);
    if (version) {
      lines.push(`  - ${formatVersionForDisplay(stack.frameworkName, version)}`);
    } else {
      lines.push(`  - ${stack.frameworkName}: detected (confidence: ${stack.confidence}%)`);
    }
    // Add evidence summary
    for (const ev of stack.evidence.slice(0, 2)) {
      lines.push(`    Evidence: ${ev.evidence.reason} [${ev.evidence.file}]`);
    }
  }

  // OpenClaw-specific constraint sections (only when detected)
  if (hasOrchestrator) {
    appendOpenClawConstraints(lines, signals);
  }

  // External Integrations (source code scanner)
  const integrations = signals.filter((s) => s.kind === "integration");
  if (integrations.length > 0) {
    lines.push("", "EXTERNAL INTEGRATIONS (Discovered in Source Code):");
    for (const sig of integrations) {
      lines.push(`  - ${sig.frameworkName}`);
      lines.push(`    Evidence: ${sig.evidence.reason} [${sig.evidence.file}]`);
    }
  }

  lines.push("=== END ARCHITECTURE CONSTRAINTS ===");
  return lines.join("\n");
}

/**
 * Append OpenClaw-specific sections to the constraints block.
 * Groups signals by kind (agent, hook, skill, subagent, plugin, heartbeat).
 */
function appendOpenClawConstraints(lines: string[], signals: Signal[]): void {
  // Agent config
  const agentSignals = signals.filter((s) => s.kind === "agent");
  if (agentSignals.length > 0) {
    lines.push("", "OPENCLAW AGENT CONFIG:");
    for (const sig of agentSignals) {
      lines.push(`  - ${sig.frameworkName}: ${sig.evidence.excerpt}`);
    }
  }

  // Hooks
  const hookSignals = signals.filter((s) => s.kind === "hook");
  if (hookSignals.length > 0) {
    lines.push("", "OPENCLAW HOOKS:");
    for (const sig of hookSignals) {
      const name = sig.frameworkName.replace("OpenClaw Hook: ", "");
      lines.push(`  - /${name}: ${sig.evidence.reason}`);
    }
  }

  // Skills
  const skillSignals = signals.filter((s) => s.kind === "skill");
  if (skillSignals.length > 0) {
    lines.push("", "OPENCLAW SKILLS:");
    for (const sig of skillSignals) {
      lines.push(
        `  - ${sig.frameworkName.replace("OpenClaw Skill: ", "")}: ${sig.evidence.reason}`
      );
    }
  }

  // Subagents
  const subagentSignals = signals.filter((s) => s.kind === "subagent");
  if (subagentSignals.length > 0) {
    lines.push("", "OPENCLAW SUBAGENTS:");
    for (const sig of subagentSignals) {
      lines.push(
        `  - ${sig.frameworkName.replace("OpenClaw Subagent: ", "")}: ${sig.evidence.reason}`
      );
      if (sig.evidence.excerpt) {
        lines.push(`    ${sig.evidence.excerpt}`);
      }
    }
  }

  // Plugins
  const pluginSignals = signals.filter((s) => s.kind === "plugin");
  if (pluginSignals.length > 0) {
    lines.push("", "OPENCLAW PLUGINS:");
    for (const sig of pluginSignals) {
      lines.push(
        `  - ${sig.frameworkName.replace("OpenClaw Plugin: ", "")}: ${sig.evidence.excerpt}`
      );
    }
  }

  // Heartbeat
  const heartbeatSignals = signals.filter((s) => s.kind === "heartbeat");
  if (heartbeatSignals.length > 0) {
    lines.push("", "OPENCLAW HEARTBEAT:");
    for (const sig of heartbeatSignals) {
      lines.push(`  - ${sig.evidence.excerpt}`);
    }
  }
}

/**
 * Build the full awareness context string for LLM prompts.
 */
function buildAwarenessContext(result: Omit<AwarenessResult, "awarenessContext">): string {
  const parts: string[] = [];

  // Constraints block
  parts.push(result.constraintsBlock);
  parts.push("");

  // Architecture summary
  const arch = result.architecture;
  parts.push("ARCHITECTURE SUMMARY:");
  parts.push(`  Repo type: ${arch.repoType}`);

  if (arch.primaryOrchestrator) {
    parts.push(
      `  Primary orchestrator: ${arch.primaryOrchestrator.id} (config: ${arch.primaryOrchestrator.configPath})`
    );
  }

  if (arch.workloads.length > 0) {
    parts.push("  Workloads:");
    for (const w of arch.workloads) {
      parts.push(`    - ${w.name} (${w.rootPath}): ${w.frameworks.join(", ")}`);
    }
  }

  if (arch.navigation.whatToReadFirst.length > 0) {
    parts.push("  What to read first:");
    for (const item of arch.navigation.whatToReadFirst) {
      parts.push(`    - ${item}`);
    }
  }

  // Web references summary
  if (result.webReferences.length > 0) {
    parts.push("");
    parts.push("FRAMEWORK REFERENCES:");
    for (const ref of result.webReferences) {
      const mode =
        ref.referenceMode === "versioned"
          ? `Docs selected for version ${ref.versionInfo.value} (exact)`
          : "Version unknown/ambiguous; using latest docs fallback";
      parts.push(`  ${ref.frameworkName}: ${mode}`);
      for (const r of ref.results.slice(0, 3)) {
        parts.push(`    - ${r.title}: ${r.url}`);
      }
    }
  } else if (result.errors.length > 0) {
    parts.push("");
    parts.push("FRAMEWORK REFERENCES: Unavailable");
    for (const err of result.errors) {
      parts.push(`  - ${err}`);
    }
  }

  return parts.join("\n");
}

/**
 * Save awareness.json for debugging/transparency.
 */
function saveAwarenessJson(
  repoName: string,
  result: AwarenessResult,
  baseDir: string = "projects"
): void {
  const folderName = repoName.toLowerCase().replace(/\s+/g, "-");
  const targetDir = path.join(baseDir, folderName);
  fs.mkdirSync(targetDir, { recursive: true });

  const filePath = path.join(targetDir, "awareness.json");
  try {
    // Serialize without circular references — remove evidence signals' circular refs
    const serializable = {
      manifests: result.manifests,
      stacks: result.stacks.map((s) => ({
        frameworkId: s.frameworkId,
        frameworkName: s.frameworkName,
        confidence: s.confidence,
        versions: s.versions,
        rootPath: s.rootPath,
        evidenceCount: s.evidence.length,
        evidenceSummary: s.evidence.slice(0, 3).map((e) => ({
          kind: e.kind,
          file: e.evidence.file,
          reason: e.evidence.reason,
        })),
      })),
      architecture: result.architecture,
      webReferences: result.webReferences,
      errors: result.errors,
      constraintsBlock: result.constraintsBlock,
    };

    fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2), "utf-8");
    console.log(`✅ Saved awareness.json to: ${filePath}`);
  } catch (error) {
    console.warn(
      `⚠️  Could not save awareness.json to ${filePath}: ${(error as Error).message}\n` +
        `   This is a debug file and does not affect AGENTS.md generation.\n` +
        `   Check disk space and directory write permissions if you need this output.`
    );
  }
}

/**
 * Save grounding.json for web grounding transparency.
 * Always saved — contains references + structured errors.
 */
function saveGroundingJson(
  repoName: string,
  webReferences: AwarenessResult["webReferences"],
  errors: string[],
  baseDir: string = "projects"
): void {
  const folderName = repoName.toLowerCase().replace(/\s+/g, "-");
  const targetDir = path.join(baseDir, folderName);
  fs.mkdirSync(targetDir, { recursive: true });

  const filePath = path.join(targetDir, "grounding.json");
  try {
    // Build structured error entries
    const structuredErrors = errors.map((err) => {
      // Parse known error patterns
      if (err.includes("BRAVE_API_KEY not set")) {
        return {
          reason: "BRAVE_API_KEY not set",
          impact: "Web grounding disabled — no documentation references gathered",
          resolution:
            "Set BRAVE_API_KEY in your .env file. Get a free key at https://brave.com/search/api/",
        };
      }
      if (err.includes("rate limit") || err.includes("HTTP 429")) {
        const queryMatch = err.match(/Query: "([^"]+)"/);
        return {
          query: queryMatch ? queryMatch[1] : undefined,
          reason: "Brave Search API rate limit exceeded (HTTP 429)",
          impact: "Results missing for this query",
          resolution: "Wait a moment and retry, or check your Brave API plan limits",
        };
      }
      if (err.includes("Web search failed")) {
        const queryMatch = err.match(/for "([^"]+)"/);
        const reasonMatch = err.match(/: (.+)$/);
        return {
          query: queryMatch ? queryMatch[1] : undefined,
          reason: reasonMatch ? reasonMatch[1] : err,
          impact: "Results missing for this query",
        };
      }
      return {
        reason: err,
        impact: "Unknown web grounding error",
      };
    });

    const grounding = {
      generatedAt: new Date().toISOString(),
      totalReferences: webReferences.reduce((sum, ref) => sum + ref.results.length, 0),
      frameworksCovered: webReferences.length,
      references: webReferences,
      errors: structuredErrors,
    };

    fs.writeFileSync(filePath, JSON.stringify(grounding, null, 2), "utf-8");
    console.log(`✅ Saved grounding.json to: ${filePath}`);
  } catch (error) {
    console.warn(
      `⚠️  Could not save grounding.json to ${filePath}: ${(error as Error).message}\n` +
        `   This is a debug file and does not affect AGENTS.md generation.\n` +
        `   Check disk space and directory write permissions if you need this output.`
    );
  }
}

/**
 * Run the full awareness pipeline.
 * This is the main entry point called from the CLI.
 */
export async function runAwareness(repoPath: string, repoName: string): Promise<AwarenessResult> {
  console.log("\n🔍 Running Framework Awareness scan...");

  // Step 1: Scan for manifests (full-repo)
  console.log("  → Scanning repository for manifest files...");
  const manifests = scanManifests(repoPath);
  console.log(`  → Found ${manifests.length} manifest file(s)`);

  if (manifests.length > 0) {
    for (const m of manifests.slice(0, 10)) {
      console.log(`    📄 ${m.relativePath} (depth: ${m.depth})`);
    }
    if (manifests.length > 10) {
      console.log(`    ... and ${manifests.length - 10} more`);
    }
  }

  // Step 2: Parse all manifests into signals
  console.log("  → Parsing manifests...");
  const manifestSignals = parseAllManifests(manifests);
  console.log(`  → Generated ${manifestSignals.length} signal(s) from manifests`);

  // Step 2.5: Scan source code for external integrations
  console.log("  → Scanning source code for external integrations...");
  const integrationSignals = scanSourceFiles(repoPath);
  if (integrationSignals.length > 0) {
    console.log(`  → Discovered ${integrationSignals.length} integration(s) in source code`);
  }

  // Merge all signals
  const signals = [...manifestSignals, ...integrationSignals];

  // Step 3: Resolve versions
  console.log("  → Resolving versions...");
  const resolvedVersions = resolveAllVersions(signals);

  // Step 4: Detect stacks and architecture
  console.log("  → Detecting stacks and architecture...");
  const stacks = detectStacks(signals);
  const architecture = detectArchitecture(stacks, signals);

  const hasOrchestrator = signals.some((s) => s.kind === "orchestrator");

  console.log(`  → Detected ${stacks.length} stack(s), repo type: ${architecture.repoType}`);
  for (const stack of stacks.slice(0, 8)) {
    const version = resolvedVersions.get(stack.frameworkId);
    const versionStr = version?.value
      ? ` v${version.value} (${version.certainty})`
      : ` (version ${version?.certainty || "unknown"})`;
    console.log(`    🏗️  ${stack.frameworkName}${versionStr} [confidence: ${stack.confidence}%]`);
  }

  if (hasOrchestrator) {
    console.log("    🎯 OpenClaw orchestrator detected");

    // Log OpenClaw-specific discoveries
    const hookCount = signals.filter((s) => s.kind === "hook").length;
    const skillCount = signals.filter((s) => s.kind === "skill").length;
    const subagentCount = signals.filter((s) => s.kind === "subagent").length;
    const pluginCount = signals.filter((s) => s.kind === "plugin").length;

    if (hookCount > 0) console.log(`    🪝 ${hookCount} hook(s) detected`);
    if (skillCount > 0) console.log(`    🎯 ${skillCount} skill(s) detected`);
    if (subagentCount > 0) console.log(`    🤖 ${subagentCount} subagent(s) detected`);
    if (pluginCount > 0) console.log(`    🔌 ${pluginCount} plugin(s) detected`);

    const heartbeat = signals.find((s) => s.kind === "heartbeat");
    if (heartbeat) {
      const active =
        heartbeat.evidence.excerpt?.includes("ACTIVE") &&
        !heartbeat.evidence.excerpt?.includes("INACTIVE");
      console.log(`    💓 Heartbeat: ${active ? "ACTIVE" : "INACTIVE"}`);
    }
  }

  // Step 5: Build constraints block (now includes OpenClaw-specific sections)
  const constraintsBlock = buildConstraintsBlock(
    stacks,
    resolvedVersions,
    hasOrchestrator,
    signals
  );

  // Step 6: Web grounding
  console.log("  → Gathering web references...");
  const cacheDir = path.join(
    "projects",
    repoName.toLowerCase().replace(/\s+/g, "-"),
    "cache",
    "brave"
  );
  const { references: webReferences, errors } = await gatherReferences(stacks, 3, cacheDir);

  if (webReferences.length > 0) {
    console.log(`  → Retrieved references for ${webReferences.length} framework(s)`);
    for (const ref of webReferences) {
      const mode =
        ref.referenceMode === "versioned"
          ? `v${ref.versionInfo.value} docs`
          : "latest docs (fallback)";
      console.log(`    📚 ${ref.frameworkName}: ${ref.results.length} reference(s) [${mode}]`);
    }
  }
  if (errors.length > 0) {
    for (const err of errors) {
      // Multi-line errors — indent subsequent lines
      const lines = err.split("\n");
      console.log(`  ⚠️  ${lines[0]}`);
      for (const line of lines.slice(1)) {
        console.log(`     ${line}`);
      }
    }
  }

  // Build partial result (without awarenessContext yet)
  const partialResult = {
    manifests,
    signals,
    stacks,
    architecture,
    webReferences,
    constraintsBlock,
    errors,
  };

  // Step 7: Build awareness context
  const awarenessContext = buildAwarenessContext(partialResult);

  const result: AwarenessResult = {
    ...partialResult,
    awarenessContext,
  };

  // Step 8: Save awareness.json
  saveAwarenessJson(repoName, result);

  // Step 9: Save grounding.json (always, even on errors)
  saveGroundingJson(repoName, webReferences, errors);

  console.log("✅ Framework Awareness scan complete\n");

  return result;
}
