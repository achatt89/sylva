/**
 * Rust manifest parser.
 * Handles Cargo.toml files.
 */

import * as fs from "fs";
import * as path from "path";
import { Signal, ManifestFile, VersionInfo } from "../types";

/** Known Rust frameworks/libraries */
const RUST_FRAMEWORKS: { crate: string; frameworkId: string; frameworkName: string }[] = [
  { crate: "actix-web", frameworkId: "actix-web", frameworkName: "Actix Web" },
  { crate: "rocket", frameworkId: "rocket", frameworkName: "Rocket" },
  { crate: "axum", frameworkId: "axum", frameworkName: "Axum" },
  { crate: "tokio", frameworkId: "tokio", frameworkName: "Tokio" },
  { crate: "serde", frameworkId: "serde", frameworkName: "Serde" },
  { crate: "diesel", frameworkId: "diesel", frameworkName: "Diesel" },
  { crate: "sqlx", frameworkId: "sqlx", frameworkName: "SQLx" },
  { crate: "warp", frameworkId: "warp", frameworkName: "Warp" },
];

/**
 * Parse Cargo.toml
 */
export function parseCargoToml(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";

  signals.push({
    kind: "framework",
    frameworkId: "rust",
    frameworkName: "Rust",
    evidence: {
      file: manifest.relativePath,
      reason: "Cargo.toml found",
    },
    scope: { pathRoot: rootPath },
  });

  // Extract Rust edition
  const editionMatch = content.match(/edition\s*=\s*"(\d{4})"/);
  if (editionMatch) {
    signals.push({
      kind: "version",
      frameworkId: "rust",
      frameworkName: "Rust",
      version: {
        value: `edition ${editionMatch[1]}`,
        certainty: "exact",
        sourceFile: manifest.relativePath,
      },
      evidence: {
        file: manifest.relativePath,
        reason: "Rust edition specified in Cargo.toml",
        excerpt: `edition = "${editionMatch[1]}"`,
      },
      scope: { pathRoot: rootPath },
    });
  }

  // Extract dependencies
  const depSections = [
    content.match(/\[dependencies\]([\s\S]*?)(?:\n\[|$)/),
    content.match(/\[dev-dependencies\]([\s\S]*?)(?:\n\[|$)/),
  ];

  for (const sectionMatch of depSections) {
    if (!sectionMatch) continue;
    const section = sectionMatch[1];
    const lines = section.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("[")) continue;

      // Match: crate = "version" or crate = { version = "..." }
      let crateName: string | undefined;
      let versionStr: string | undefined;

      const simpleMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*"([^"]*)"/);
      if (simpleMatch) {
        crateName = simpleMatch[1];
        versionStr = simpleMatch[2];
      }

      const tableMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*\{.*version\s*=\s*"([^"]*)"/);
      if (tableMatch) {
        crateName = tableMatch[1];
        versionStr = tableMatch[2];
      }

      if (!crateName) continue;

      const framework = RUST_FRAMEWORKS.find((f) => f.crate === crateName);
      if (framework) {
        let versionInfo: VersionInfo;
        if (versionStr) {
          const isPinned = /^\d+\.\d+\.\d+$/.test(versionStr);
          versionInfo = isPinned
            ? { value: versionStr, certainty: "exact", sourceFile: manifest.relativePath }
            : {
                value: versionStr,
                certainty: "ambiguous",
                sourceFile: manifest.relativePath,
                notes: `Semver range: ${versionStr}`,
              };
        } else {
          versionInfo = { certainty: "unknown", sourceFile: manifest.relativePath };
        }

        signals.push({
          kind: "framework",
          frameworkId: framework.frameworkId,
          frameworkName: framework.frameworkName,
          version: versionInfo,
          evidence: {
            file: manifest.relativePath,
            reason: `Rust crate '${crateName}' found in Cargo.toml`,
            excerpt: trimmed,
          },
          scope: { pathRoot: rootPath },
        });
      }
    }
  }

  return signals;
}
