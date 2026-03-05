/**
 * package.json parser.
 * Detects Node.js/JS/TS frameworks from dependencies, scripts, and metadata.
 * Handles React, Angular, Vue, Next.js, Express, NestJS, and more.
 */

import * as fs from "fs";
import * as path from "path";
import { Signal, ManifestFile, VersionInfo } from "../types";

/** Framework detection rules: dep name patterns → framework info */
const FRAMEWORK_DETECTION_RULES: {
  depPattern: string | RegExp;
  frameworkId: string;
  frameworkName: string;
}[] = [
  { depPattern: "@angular/core", frameworkId: "angular", frameworkName: "Angular" },
  { depPattern: "react", frameworkId: "react", frameworkName: "React" },
  { depPattern: "react-dom", frameworkId: "react-dom", frameworkName: "React DOM" },
  { depPattern: "next", frameworkId: "nextjs", frameworkName: "Next.js" },
  { depPattern: "vue", frameworkId: "vue", frameworkName: "Vue.js" },
  { depPattern: "nuxt", frameworkId: "nuxt", frameworkName: "Nuxt" },
  { depPattern: "@sveltejs/kit", frameworkId: "sveltekit", frameworkName: "SvelteKit" },
  { depPattern: "svelte", frameworkId: "svelte", frameworkName: "Svelte" },
  { depPattern: "express", frameworkId: "express", frameworkName: "Express" },
  { depPattern: "@nestjs/core", frameworkId: "nestjs", frameworkName: "NestJS" },
  { depPattern: "fastify", frameworkId: "fastify", frameworkName: "Fastify" },
  { depPattern: "koa", frameworkId: "koa", frameworkName: "Koa" },
  { depPattern: "typescript", frameworkId: "typescript", frameworkName: "TypeScript" },
  { depPattern: "@ax-llm/ax", frameworkId: "ax-llm", frameworkName: "Ax-LLM" },
  { depPattern: "electron", frameworkId: "electron", frameworkName: "Electron" },
  { depPattern: "react-native", frameworkId: "react-native", frameworkName: "React Native" },
  { depPattern: "tailwindcss", frameworkId: "tailwindcss", frameworkName: "Tailwind CSS" },
  { depPattern: "vite", frameworkId: "vite", frameworkName: "Vite" },
  { depPattern: "webpack", frameworkId: "webpack", frameworkName: "Webpack" },
  { depPattern: "esbuild", frameworkId: "esbuild", frameworkName: "esbuild" },
];

/**
 * Determine version certainty from a semver-like string.
 */
function parseVersionCertainty(
  versionStr: string,
  sourceFile: string,
  depName: string,
  lockfileAvailable: boolean
): VersionInfo {
  if (!versionStr) {
    return { certainty: "unknown", sourceFile, notes: `No version specified for ${depName}` };
  }

  // Exact pinned version (no ^, ~, >=, etc.)
  if (/^\d+\.\d+\.\d+/.test(versionStr) && !/^[~^>=<]/.test(versionStr)) {
    return { value: versionStr, certainty: "exact", sourceFile };
  }

  // Range-based version
  const cleanVersion = versionStr.replace(/^[~^>=<]+/, "");
  if (lockfileAvailable) {
    return {
      value: cleanVersion,
      certainty: "ambiguous",
      sourceFile,
      notes: `Range '${versionStr}' in package.json; lockfile exists but not parsed for exact resolution`,
    };
  }

  return {
    value: cleanVersion,
    certainty: "ambiguous",
    sourceFile,
    notes: `Range '${versionStr}' without lockfile resolution`,
  };
}

export function parsePackageJson(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  let pkg: Record<string, unknown>;

  try {
    pkg = JSON.parse(content);
  } catch (error) {
    console.warn(
      `⚠️  Could not parse ${manifest.relativePath}: ${(error as Error).message}\n` +
        `   This package.json has malformed JSON. Node.js framework detection is skipped for this file.`
    );
    return signals;
  }

  const rootPath = path.dirname(manifest.relativePath) || ".";
  const deps = (pkg.dependencies || {}) as Record<string, string>;
  const devDeps = (pkg.devDependencies || {}) as Record<string, string>;
  const peerDeps = (pkg.peerDependencies || {}) as Record<string, string>;
  const allDeps = { ...peerDeps, ...devDeps, ...deps }; // deps last for precedence

  // Check if a lockfile exists nearby
  const manifestDir = path.dirname(manifest.absolutePath);
  const hasLockfile =
    fs.existsSync(path.join(manifestDir, "package-lock.json")) ||
    fs.existsSync(path.join(manifestDir, "yarn.lock")) ||
    fs.existsSync(path.join(manifestDir, "pnpm-lock.yaml"));

  // Emit a Node.js/npm signal for the package itself
  signals.push({
    kind: "framework",
    frameworkId: "nodejs",
    frameworkName: "Node.js",
    evidence: {
      file: manifest.relativePath,
      reason: "package.json found",
    },
    scope: { pathRoot: rootPath },
  });

  // Detect frameworks from dependencies
  for (const rule of FRAMEWORK_DETECTION_RULES) {
    const depName = typeof rule.depPattern === "string" ? rule.depPattern : undefined;
    let matchedDep: string | undefined;
    let matchedVersion: string | undefined;

    if (depName && allDeps[depName]) {
      matchedDep = depName;
      matchedVersion = allDeps[depName];
    } else if (rule.depPattern instanceof RegExp) {
      for (const [dep, ver] of Object.entries(allDeps)) {
        if (rule.depPattern.test(dep)) {
          matchedDep = dep;
          matchedVersion = ver;
          break;
        }
      }
    }

    if (matchedDep && matchedVersion !== undefined) {
      const versionInfo = parseVersionCertainty(
        matchedVersion,
        manifest.relativePath,
        matchedDep,
        hasLockfile
      );

      signals.push({
        kind: "framework",
        frameworkId: rule.frameworkId,
        frameworkName: rule.frameworkName,
        version: versionInfo,
        evidence: {
          file: manifest.relativePath,
          reason: `Dependency '${matchedDep}' found in package.json`,
          excerpt: `"${matchedDep}": "${matchedVersion}"`,
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  // Detect Angular specifically from multiple @angular/* deps
  const angularDeps = Object.entries(allDeps).filter(([dep]) => dep.startsWith("@angular/"));
  if (angularDeps.length > 1) {
    // Angular workspace confirmed (multiple @angular packages)
    const coreDep = angularDeps.find(([dep]) => dep === "@angular/core");
    if (coreDep) {
      const versionInfo = parseVersionCertainty(
        coreDep[1],
        manifest.relativePath,
        "@angular/core",
        hasLockfile
      );
      // Only add if not already added
      const alreadyAdded = signals.some((s) => s.frameworkId === "angular");
      if (!alreadyAdded) {
        signals.push({
          kind: "framework",
          frameworkId: "angular",
          frameworkName: "Angular",
          version: versionInfo,
          evidence: {
            file: manifest.relativePath,
            reason: `${angularDeps.length} @angular/* dependencies found`,
            excerpt: angularDeps
              .slice(0, 5)
              .map(([d, v]) => `"${d}": "${v}"`)
              .join(", "),
          },
          scope: { pathRoot: rootPath },
        });
      }
    }
  }

  // Detect build tools from scripts
  const scripts = (pkg.scripts || {}) as Record<string, string>;
  if (scripts.build || scripts.start || scripts.dev) {
    signals.push({
      kind: "entrypoint",
      frameworkId: "npm-scripts",
      frameworkName: "npm scripts",
      evidence: {
        file: manifest.relativePath,
        reason: "Build/start/dev scripts found in package.json",
        excerpt: Object.entries(scripts)
          .slice(0, 5)
          .map(([k, v]) => `"${k}": "${v}"`)
          .join(", "),
      },
      scope: { pathRoot: rootPath },
    });
  }

  return signals;
}
