/**
 * Go manifest parser.
 * Handles go.mod files.
 */

import * as fs from "fs";
import * as path from "path";
import { Signal, ManifestFile } from "../types";
import { GO_FRAMEWORKS } from "../../constants";

/**
 * Parse go.mod
 */
export function parseGoMod(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";

  // Extract Go version
  const goVersionMatch = content.match(/^go\s+(\S+)/m);
  if (goVersionMatch) {
    signals.push({
      kind: "framework",
      frameworkId: "go",
      frameworkName: "Go",
      version: { value: goVersionMatch[1], certainty: "exact", sourceFile: manifest.relativePath },
      evidence: {
        file: manifest.relativePath,
        reason: "Go version specified in go.mod",
        excerpt: `go ${goVersionMatch[1]}`,
      },
      scope: { pathRoot: rootPath },
    });
  } else {
    signals.push({
      kind: "framework",
      frameworkId: "go",
      frameworkName: "Go",
      evidence: {
        file: manifest.relativePath,
        reason: "go.mod found",
      },
      scope: { pathRoot: rootPath },
    });
  }

  // Extract module name
  const moduleMatch = content.match(/^module\s+(\S+)/m);
  if (moduleMatch) {
    signals.push({
      kind: "entrypoint",
      frameworkId: "go-module",
      frameworkName: "Go Module",
      evidence: {
        file: manifest.relativePath,
        reason: `Go module: ${moduleMatch[1]}`,
        excerpt: `module ${moduleMatch[1]}`,
      },
      scope: { pathRoot: rootPath },
    });
  }

  // Extract require blocks
  const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
  const requireLines: string[] = [];

  if (requireBlock) {
    requireLines.push(...requireBlock[1].split("\n"));
  }

  // Also handle single-line requires
  const singleRequires = content.match(/^require\s+(\S+)\s+(\S+)/gm);
  if (singleRequires) {
    requireLines.push(...singleRequires);
  }

  for (const line of requireLines) {
    const match = line.trim().match(/^(\S+)\s+(v\S+)/);
    if (!match) continue;

    const modulePath = match[1];
    const version = match[2];

    const framework = GO_FRAMEWORKS.find((f) => modulePath.startsWith(f.module));
    if (framework) {
      signals.push({
        kind: "framework",
        frameworkId: framework.frameworkId,
        frameworkName: framework.frameworkName,
        version: { value: version, certainty: "exact", sourceFile: manifest.relativePath },
        evidence: {
          file: manifest.relativePath,
          reason: `Go dependency '${modulePath}' found in go.mod`,
          excerpt: `${modulePath} ${version}`,
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  return signals;
}
