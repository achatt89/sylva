/**
 * Manifest parser dispatcher.
 * Routes discovered manifest files to the appropriate parser based on filename.
 */

import { Signal, ManifestFile } from "../types";
import { parseOpenclawJson } from "./openclawParser";
import { parsePackageJson } from "./packageJsonParser";
import {
  parseRequirementsTxt,
  parsePyprojectToml,
  parsePipfile,
  parseSetupCfg,
} from "./pythonParsers";
import { parsePomXml, parseBuildGradle } from "./javaParsers";
import { parseCsproj, parseGlobalJson } from "./dotnetParsers";
import { parseGoMod } from "./goParsers";
import { parseCargoToml } from "./rustParsers";

import * as fs from "fs";
import * as path from "path";

/**
 * Parse angular.json to detect Angular workspace structure.
 */
function parseAngularJson(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";

  try {
    const config = JSON.parse(content);
    const projects = config.projects ? Object.keys(config.projects) : [];

    signals.push({
      kind: "framework",
      frameworkId: "angular",
      frameworkName: "Angular",
      evidence: {
        file: manifest.relativePath,
        reason: `angular.json workspace found with ${projects.length} project(s): ${projects.join(", ")}`,
        excerpt: projects.length > 0 ? `Projects: ${projects.slice(0, 5).join(", ")}` : undefined,
      },
      scope: { pathRoot: rootPath },
    });
  } catch (error) {
    // Invalid JSON — still record the Angular workspace with a note
    console.warn(
      `⚠️  Could not parse ${manifest.relativePath} as JSON: ${(error as Error).message}\n` +
        `   Angular workspace detected but project details are unavailable. This is non-fatal.`
    );
    signals.push({
      kind: "framework",
      frameworkId: "angular",
      frameworkName: "Angular",
      evidence: {
        file: manifest.relativePath,
        reason:
          "angular.json found but JSON is malformed — workspace detected without project details",
      },
      scope: { pathRoot: rootPath },
    });
  }

  return signals;
}

/**
 * Parse Dockerfile for runtime hints
 */
function parseDockerfile(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";

  // Extract FROM base images
  const fromMatches = content.match(/^FROM\s+(\S+)/gm);
  if (fromMatches) {
    for (const fromLine of fromMatches) {
      const image = fromLine.replace(/^FROM\s+/, "").trim();
      signals.push({
        kind: "tooling",
        frameworkId: "docker",
        frameworkName: "Docker",
        evidence: {
          file: manifest.relativePath,
          reason: `Docker base image: ${image}`,
          excerpt: fromLine,
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  return signals;
}

/**
 * Parse a single manifest file and return signals.
 */
export function parseManifest(manifest: ManifestFile): Signal[] {
  try {
    const filename = manifest.filename;

    // Exact filename matches
    switch (filename) {
      case "openclaw.json":
        return parseOpenclawJson(manifest);
      case "package.json":
        return parsePackageJson(manifest);
      case "angular.json":
      case "workspace.json":
        return parseAngularJson(manifest);
      case "requirements.txt":
        return parseRequirementsTxt(manifest);
      case "pyproject.toml":
        return parsePyprojectToml(manifest);
      case "Pipfile":
        return parsePipfile(manifest);
      case "setup.cfg":
        return parseSetupCfg(manifest);
      case "pom.xml":
        return parsePomXml(manifest);
      case "build.gradle":
      case "build.gradle.kts":
        return parseBuildGradle(manifest);
      case "go.mod":
        return parseGoMod(manifest);
      case "Cargo.toml":
        return parseCargoToml(manifest);
      case "global.json":
        return parseGlobalJson(manifest);
      case "Dockerfile":
        return parseDockerfile(manifest);
      default:
        break;
    }

    // Extension-based matches
    if (
      filename.endsWith(".csproj") ||
      filename.endsWith(".fsproj") ||
      filename.endsWith(".vbproj")
    ) {
      return parseCsproj(manifest);
    }

    // Files we scan but don't parse (lockfiles, CI configs, etc.)
    return [];
  } catch (error) {
    console.warn(
      `⚠️  Skipping manifest ${manifest.relativePath}: ${(error as Error).message}\n` +
        `   This file could not be parsed. It may be malformed or use an unsupported format.\n` +
        `   Other manifests will still be processed normally.`
    );
    return [];
  }
}

/**
 * Parse all discovered manifests and return combined signals.
 */
export function parseAllManifests(manifests: ManifestFile[]): Signal[] {
  const allSignals: Signal[] = [];
  for (const manifest of manifests) {
    const signals = parseManifest(manifest);
    allSignals.push(...signals);
  }
  return allSignals;
}
