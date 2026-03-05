/**
 * Web grounding — version-aware query builder and reference gatherer.
 * Uses Brave Search to fetch official docs for detected frameworks.
 * NEVER ASSUMES — queries are version-specific only when exact version is known.
 */

import { StackInfo, VersionInfo, WebReference } from "./types";
import { braveSearch, isBraveSearchAvailable } from "./braveSearch";
import { resolveVersion } from "./versionResolver";

/**
 * Build search queries for a framework based on version info.
 */
export function buildQueries(frameworkName: string, versionInfo: VersionInfo): string[] {
  const queries: string[] = [];

  if (versionInfo.certainty === "exact" && versionInfo.value) {
    // Extract major.minor from version
    const parts = versionInfo.value.replace(/^v/, "").split(".");
    const major = parts[0];
    const minor = parts.length > 1 ? parts[1] : undefined;
    const majorMinor = minor ? `${major}.${minor}` : major;

    queries.push(`${frameworkName} ${major} documentation official`);
    if (minor) {
      queries.push(`${frameworkName} ${majorMinor} reference documentation`);
    }
    queries.push(`${frameworkName} ${major} best practices`);
  } else {
    // Unknown or ambiguous — use latest docs
    queries.push(`${frameworkName} official documentation`);
    queries.push(`${frameworkName} best practices`);
  }

  return queries;
}

/**
 * Gather web references for detected frameworks.
 * @param stacks Detected stacks sorted by confidence
 * @param limitPerFramework Max queries per framework
 * @param cacheDir Optional cache directory
 */
export async function gatherReferences(
  stacks: StackInfo[],
  limitPerFramework: number = 3,
  cacheDir?: string
): Promise<{ references: WebReference[]; errors: string[] }> {
  const references: WebReference[] = [];
  const errors: string[] = [];

  if (!isBraveSearchAvailable()) {
    errors.push(
      "BRAVE_API_KEY not set — web grounding is disabled.\n" +
        "   → Framework detection and version resolution still work perfectly.\n" +
        "   → To enable web-grounded documentation references, set BRAVE_API_KEY in your .env file.\n" +
        "   → Get a free API key at: https://brave.com/search/api/"
    );
    return { references, errors };
  }

  // Pick top frameworks by confidence (skip generic ones like "nodejs", "python")
  const GENERIC_IDS = new Set([
    "nodejs",
    "python",
    "java-maven",
    "java-gradle",
    "dotnet",
    "docker",
  ]);
  const targetStacks = stacks
    .filter((s) => !GENERIC_IDS.has(s.frameworkId) && s.confidence >= 60)
    .slice(0, 6);

  // Always include orchestrators
  const orchestratorStacks = stacks.filter((s) =>
    s.evidence.some((e) => e.kind === "orchestrator")
  );
  for (const orc of orchestratorStacks) {
    if (!targetStacks.some((t) => t.frameworkId === orc.frameworkId)) {
      targetStacks.push(orc);
    }
  }

  for (const stack of targetStacks) {
    const versionInfo = resolveVersion(stack.evidence);
    const queries = buildQueries(stack.frameworkName, versionInfo);
    const referenceMode = versionInfo.certainty === "exact" ? "versioned" : "latest_fallback";

    const allResults: WebReference["results"] = [];

    for (const query of queries.slice(0, limitPerFramework)) {
      try {
        const results = await braveSearch(query, { cacheDir });
        allResults.push(...results);
      } catch (error) {
        errors.push(`Web search failed for "${query}": ${(error as Error).message}`);
      }
    }

    // Dedupe by URL
    const seen = new Set<string>();
    const deduped = allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    references.push({
      frameworkId: stack.frameworkId,
      frameworkName: stack.frameworkName,
      versionInfo,
      referenceMode: referenceMode as "versioned" | "latest_fallback",
      results: deduped.slice(0, 5),
    });
  }

  return { references, errors };
}
