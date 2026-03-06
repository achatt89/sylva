import * as fs from "fs";
import * as path from "path";
import ignore from "ignore";
import { Signal } from "./types";
import {
  INTEGRATIONS,
  SOURCE_EXTENSIONS,
  SCAN_IGNORE_DIRS,
  ALWAYS_IGNORE_FILES,
} from "../constants";

const MAX_SCAN_FILES = 200;
const MAX_LINES_PER_FILE = 500;

// Precompute known config files and docker files for fast lookup
const CONFIG_FILE_NAMES = new Set<string>();
for (const int of INTEGRATIONS) {
  if (int.configPatterns) {
    for (const pat of int.configPatterns) CONFIG_FILE_NAMES.add(pat);
  }
}
const DOCKER_FILE_NAMES = new Set(["docker-compose.yml", "docker-compose.yaml"]);

/**
 * Loads .gitignore rules from the root if available
 */
function loadGitIgnore(rootPath: string): ReturnType<typeof ignore> {
  const ig = ignore();

  // Add hardcoded global ignores
  for (const item of SCAN_IGNORE_DIRS) ig.add(`**/${item}/**`);
  for (const item of ALWAYS_IGNORE_FILES) ig.add(`**/${item}`);
  ig.add("**/*.env*"); // Cover all .env permutations globally

  try {
    const gitignorePath = path.join(rootPath, ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, "utf-8");
      ig.add(content);
    }
  } catch {
    // Ignore errors reading .gitignore
  }
  return ig;
}

/**
 * Collect source files sequentially via BFS
 */
function collectSourceFiles(
  dir: string,
  ig: ReturnType<typeof ignore>,
  rootPath: string,
  files: string[] = []
): string[] {
  if (files.length >= MAX_SCAN_FILES) return files;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (files.length >= MAX_SCAN_FILES) break;

      const fullPath = path.join(dir, entry.name);

      // Ensure posix path for gitignore matching
      const relPath = path.relative(rootPath, fullPath).split(path.sep).join(path.posix.sep);

      // Skip ignored files/directories
      // Note: ignore().ignores() requires directory paths to end with '/' to match properly sometimes,
      // but relPath works fine for most rules.
      if (ig.ignores(relPath)) continue;

      if (entry.isDirectory()) {
        if (!ig.ignores(relPath + "/")) {
          collectSourceFiles(fullPath, ig, rootPath, files);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const baseName = entry.name;
        const lowerBaseName = baseName.toLowerCase();

        if (
          SOURCE_EXTENSIONS.includes(ext) ||
          CONFIG_FILE_NAMES.has(baseName) ||
          DOCKER_FILE_NAMES.has(lowerBaseName) ||
          lowerBaseName.includes("dockerfile")
        ) {
          files.push(fullPath);
        }
      }
    }
  } catch {
    // access errors skipped
  }

  return files;
}

/**
 * Heuristic: check if this phrase occurs in the text
 */
function matchPatterns(content: string, patterns: string[] = []): string | null {
  for (const pat of patterns) {
    if (content.includes(pat)) return pat;
  }
  return null;
}

/**
 * Scan source codebase for integrations.
 */
export function scanSourceFiles(rootPath: string): Signal[] {
  const ig = loadGitIgnore(rootPath);
  const targetFiles = collectSourceFiles(rootPath, ig, rootPath);

  const signals: Signal[] = [];
  const detectedIntegrationIds = new Set<string>();

  for (const file of targetFiles) {
    try {
      const fileName = path.basename(file);
      const lowerFileName = fileName.toLowerCase();
      const isDocker = lowerFileName.includes("dockerfile") || DOCKER_FILE_NAMES.has(lowerFileName);

      // 1. Check exact config file matches (no file reading required)
      for (const integration of INTEGRATIONS) {
        if (detectedIntegrationIds.has(integration.id)) continue;
        if (integration.configPatterns?.includes(fileName)) {
          detectedIntegrationIds.add(integration.id);
          signals.push({
            kind: "integration",
            frameworkId: integration.id,
            frameworkName: integration.name,
            version: { certainty: "unknown", value: undefined },
            evidence: {
              file: path.relative(rootPath, file),
              reason: `Source code scanner detected ${integration.name}: Found config file "${fileName}"`,
            },
            scope: { pathRoot: rootPath },
          });
        }
      }

      // If we found everything, stop scanning
      if (detectedIntegrationIds.size === INTEGRATIONS.length) break;

      // Read file and limit to N lines to keep it fast
      const contentRaw = fs.readFileSync(file, "utf-8");

      let content = contentRaw;
      const lines = contentRaw.split("\n");
      if (lines.length > MAX_LINES_PER_FILE) {
        content = lines.slice(0, MAX_LINES_PER_FILE).join("\n");
      }

      // 2. Content Checks
      for (const integration of INTEGRATIONS) {
        if (detectedIntegrationIds.has(integration.id)) continue; // Found it already somewhere

        let reason = "";
        let matchedPattern = "";

        if (isDocker) {
          // Specialized Dockerfile scanning: scan the exact full content
          matchedPattern = matchPatterns(contentRaw, integration.dockerPatterns) || "";
          if (matchedPattern) {
            reason = `Found deployment marker "${matchedPattern}" in ${fileName}`;
          }
        } else {
          // Standard source code checks
          matchedPattern = matchPatterns(content, integration.urlPatterns) || "";
          if (matchedPattern) {
            reason = `Found API URL pattern "${matchedPattern}"`;
          } else {
            matchedPattern = matchPatterns(content, integration.importPatterns) || "";
            if (matchedPattern) {
              reason = `Found SDK import pattern "${matchedPattern}"`;
            } else {
              matchedPattern = matchPatterns(content, integration.envPatterns) || "";
              if (matchedPattern) {
                reason = `Found env var reference "${matchedPattern}"`;
              }
            }
          }
        }

        if (reason) {
          detectedIntegrationIds.add(integration.id);
          signals.push({
            kind: "integration",
            frameworkId: integration.id,
            frameworkName: integration.name,
            version: { certainty: "unknown", value: undefined },
            evidence: {
              file: path.relative(rootPath, file),
              reason: `Source code scanner detected ${integration.name}: ${reason}`,
            },
            scope: { pathRoot: rootPath },
          });
        }
      }

      // If we found everything, stop scanning
      if (detectedIntegrationIds.size === INTEGRATIONS.length) break;
    } catch {
      // Ignore unreadable files
    }
  }

  return signals;
}
