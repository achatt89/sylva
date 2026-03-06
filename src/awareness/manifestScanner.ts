/**
 * Full-repo manifest scanner.
 * Recursively walks the entire repository to discover framework manifest files,
 * regardless of nesting depth. Handles monorepos and nested subprojects.
 */

import * as fs from "fs";
import * as path from "path";
import { ManifestFile } from "./types";
import {
  SCAN_IGNORE_DIRS,
  MANIFEST_EXACT_NAMES as EXACT_NAMES,
  MANIFEST_EXTENSION_PATTERNS,
  MAX_MANIFEST_FILE_SIZE,
} from "../constants";

/** Directories to skip during scanning */
const IGNORE_DIRS_SET = new Set(SCAN_IGNORE_DIRS);

/** Exact filenames to match as manifests */
const MANIFEST_EXACT_NAMES = new Set(EXACT_NAMES);

/**
 * Check if a filename matches a known manifest pattern.
 */
function isManifestFile(filename: string): boolean {
  if (MANIFEST_EXACT_NAMES.has(filename)) return true;
  for (const ext of MANIFEST_EXTENSION_PATTERNS) {
    if (filename.endsWith(ext)) return true;
  }
  return false;
}

/**
 * Recursively scan a repository for manifest files.
 * Returns all discovered manifest files with metadata.
 */
export function scanManifests(repoPath: string): ManifestFile[] {
  const results: ManifestFile[] = [];
  const absoluteRoot = path.resolve(repoPath);

  function walk(dir: string, depth: number): void {
    let entries: string[];
    try {
      entries = fs.readdirSync(dir);
    } catch (error) {
      // Permission denied, broken symlink, or other OS-level issue
      console.warn(
        `⚠️  Skipping unreadable directory: ${path.relative(absoluteRoot, dir) || "."}\n` +
          `   Reason: ${(error as Error).message}\n` +
          `   Manifests inside this directory will not be discovered.`
      );
      return;
    }

    for (const entry of entries) {
      // Skip ignored directories and hidden dirs (except specific manifest patterns)
      if (IGNORE_DIRS_SET.has(entry)) continue;

      const fullPath = path.join(dir, entry);
      let stat: fs.Stats;
      try {
        stat = fs.statSync(fullPath);
      } catch {
        // Broken symlink or permission issue — skip silently (individual files are not noteworthy)
        continue;
      }

      if (stat.isDirectory()) {
        // Skip hidden directories (starting with .) except the repo root
        if (entry.startsWith(".") && depth > 0) continue;
        walk(fullPath, depth + 1);
      } else if (stat.isFile()) {
        if (isManifestFile(entry)) {
          if (stat.size > MAX_MANIFEST_FILE_SIZE) {
            // File is too large, skip it
            continue;
          }
          results.push({
            absolutePath: fullPath,
            relativePath: path.relative(absoluteRoot, fullPath),
            filename: entry,
            depth,
            size: stat.size,
          });
        }
      }
    }
  }

  walk(absoluteRoot, 0);

  // Sort by depth (shallow first) then alphabetically for deterministic order
  results.sort((a, b) => {
    if (a.depth !== b.depth) return a.depth - b.depth;
    return a.relativePath.localeCompare(b.relativePath);
  });

  return results;
}
