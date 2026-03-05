/**
 * Awareness orchestrator.
 * Top-level function that runs the entire awareness pipeline:
 * scan → parse → resolve versions → detect stacks → web ground → build constraints.
 */

import * as fs from "fs";
import * as path from "path";
import { AwarenessResult, StackInfo, VersionInfo } from "./types";
import { scanManifests } from "./manifestScanner";
import { parseAllManifests } from "./manifestParsers";
import { resolveAllVersions } from "./versionResolver";
import { detectStacks, detectArchitecture, formatVersionForDisplay } from "./detector";
import { gatherReferences } from "./webGrounding";

/**
 * The ARCHITECTURE CONSTRAINTS block injected into LLM context.
 * This is authoritative and must not be overridden by the model.
 */
function buildConstraintsBlock(
  stacks: StackInfo[],
  resolvedVersions: Map<string, VersionInfo>,
  hasOrchestrator: boolean
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

  lines.push("=== END ARCHITECTURE CONSTRAINTS ===");
  return lines.join("\n");
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
  const signals = parseAllManifests(manifests);
  console.log(`  → Generated ${signals.length} signal(s)`);

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
  }

  // Step 5: Build constraints block
  const constraintsBlock = buildConstraintsBlock(stacks, resolvedVersions, hasOrchestrator);

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

  console.log("✅ Framework Awareness scan complete\n");

  return result;
}
