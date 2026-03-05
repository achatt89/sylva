/**
 * Version resolver.
 * Consolidates version signals per framework and determines version certainty.
 * Core rule: NEVER ASSUME versions.
 */

import { Signal, VersionInfo } from "./types";

/**
 * Resolve the best version info for a given framework from its signals.
 * Prioritizes exact > ambiguous > unknown.
 * If multiple exact versions exist for different source files, picks the shallowest one.
 */
export function resolveVersion(signals: Signal[]): VersionInfo {
  const versionSignals = signals.filter((s) => s.version);

  if (versionSignals.length === 0) {
    return { certainty: "unknown", notes: "No version information found" };
  }

  // Separate by certainty
  const exact = versionSignals.filter((s) => s.version!.certainty === "exact");
  const ambiguous = versionSignals.filter((s) => s.version!.certainty === "ambiguous");

  if (exact.length === 1) {
    return exact[0].version!;
  }

  if (exact.length > 1) {
    // Multiple exact versions — check if they agree
    const uniqueValues = [...new Set(exact.map((s) => s.version!.value))];
    if (uniqueValues.length === 1) {
      return exact[0].version!;
    }
    // Conflicting exact versions — mark ambiguous
    return {
      value: uniqueValues[0],
      certainty: "ambiguous",
      sourceFile: exact[0].version!.sourceFile,
      notes: `Multiple exact versions found: ${uniqueValues.join(", ")}`,
    };
  }

  if (ambiguous.length > 0) {
    return ambiguous[0].version!;
  }

  return { certainty: "unknown", notes: "No resolvable version" };
}

/**
 * Resolve versions for all detected frameworks.
 * Groups signals by frameworkId and resolves each.
 */
export function resolveAllVersions(signals: Signal[]): Map<string, VersionInfo> {
  const grouped = new Map<string, Signal[]>();

  for (const signal of signals) {
    if (!grouped.has(signal.frameworkId)) {
      grouped.set(signal.frameworkId, []);
    }
    grouped.get(signal.frameworkId)!.push(signal);
  }

  const resolved = new Map<string, VersionInfo>();
  for (const [frameworkId, frameworkSignals] of grouped) {
    resolved.set(frameworkId, resolveVersion(frameworkSignals));
  }

  return resolved;
}
