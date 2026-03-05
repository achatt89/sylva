/**
 * Python manifest parsers.
 * Handles requirements.txt, pyproject.toml, poetry.lock, Pipfile, Pipfile.lock, setup.cfg.
 */

import * as fs from "fs";
import * as path from "path";
import { Signal, ManifestFile, VersionInfo } from "../types";

/** Known Python frameworks and their detection patterns */
const PYTHON_FRAMEWORKS: { pkg: string; frameworkId: string; frameworkName: string }[] = [
  { pkg: "django", frameworkId: "django", frameworkName: "Django" },
  { pkg: "flask", frameworkId: "flask", frameworkName: "Flask" },
  { pkg: "fastapi", frameworkId: "fastapi", frameworkName: "FastAPI" },
  { pkg: "uvicorn", frameworkId: "uvicorn", frameworkName: "Uvicorn" },
  { pkg: "starlette", frameworkId: "starlette", frameworkName: "Starlette" },
  { pkg: "celery", frameworkId: "celery", frameworkName: "Celery" },
  { pkg: "sqlalchemy", frameworkId: "sqlalchemy", frameworkName: "SQLAlchemy" },
  { pkg: "pandas", frameworkId: "pandas", frameworkName: "Pandas" },
  { pkg: "numpy", frameworkId: "numpy", frameworkName: "NumPy" },
  { pkg: "tensorflow", frameworkId: "tensorflow", frameworkName: "TensorFlow" },
  { pkg: "torch", frameworkId: "pytorch", frameworkName: "PyTorch" },
  { pkg: "scikit-learn", frameworkId: "scikit-learn", frameworkName: "scikit-learn" },
  { pkg: "pytest", frameworkId: "pytest", frameworkName: "pytest" },
  { pkg: "gunicorn", frameworkId: "gunicorn", frameworkName: "Gunicorn" },
];

function parsePythonVersion(versionSpec: string, sourceFile: string, pkgName: string): VersionInfo {
  if (!versionSpec || versionSpec.trim() === "") {
    return { certainty: "unknown", sourceFile, notes: `No version for ${pkgName}` };
  }

  // Exact pin: ==X.Y.Z
  const exactMatch = versionSpec.match(/^==\s*(\S+)/);
  if (exactMatch) {
    return { value: exactMatch[1], certainty: "exact", sourceFile };
  }

  // Range-based (>=, <=, ~=, !=, etc.)
  const rangeMatch = versionSpec.match(/[><=~!]+\s*(\S+)/);
  if (rangeMatch) {
    return {
      value: rangeMatch[1],
      certainty: "ambiguous",
      sourceFile,
      notes: `Version constraint '${versionSpec.trim()}' is a range`,
    };
  }

  return { certainty: "unknown", sourceFile, notes: `Unparseable version: ${versionSpec}` };
}

/**
 * Parse requirements.txt
 */
export function parseRequirementsTxt(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";

  // Python signal
  signals.push({
    kind: "framework",
    frameworkId: "python",
    frameworkName: "Python",
    evidence: {
      file: manifest.relativePath,
      reason: "requirements.txt found",
    },
    scope: { pathRoot: rootPath },
  });

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("-")) continue;

    // Parse package==version or package>=version etc.
    const match = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*([><=~!]+.*)?$/);
    if (!match) continue;

    const pkgName = match[1].toLowerCase();
    const versionSpec = match[2] || "";

    const framework = PYTHON_FRAMEWORKS.find((f) => f.pkg === pkgName);
    if (framework) {
      const versionInfo = parsePythonVersion(versionSpec, manifest.relativePath, pkgName);
      signals.push({
        kind: "framework",
        frameworkId: framework.frameworkId,
        frameworkName: framework.frameworkName,
        version: versionInfo,
        evidence: {
          file: manifest.relativePath,
          reason: `Python package '${pkgName}' found in requirements.txt`,
          excerpt: trimmed,
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  return signals;
}

/**
 * Parse pyproject.toml (basic TOML parsing with regex — no external dependency)
 */
export function parsePyprojectToml(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";

  signals.push({
    kind: "framework",
    frameworkId: "python",
    frameworkName: "Python",
    evidence: {
      file: manifest.relativePath,
      reason: "pyproject.toml found",
    },
    scope: { pathRoot: rootPath },
  });

  // Detect build system
  if (content.includes("[tool.poetry]")) {
    signals.push({
      kind: "tooling",
      frameworkId: "poetry",
      frameworkName: "Poetry",
      evidence: {
        file: manifest.relativePath,
        reason: "[tool.poetry] section found in pyproject.toml",
      },
      scope: { pathRoot: rootPath },
    });
  }

  // Extract dependencies from [project.dependencies] or [tool.poetry.dependencies]
  // Simple regex-based extraction
  const depPatterns = [
    /\[(?:project\.dependencies|tool\.poetry\.dependencies)\]([\s\S]*?)(?:\n\[|$)/,
  ];

  for (const pattern of depPatterns) {
    const match = content.match(pattern);
    if (!match) continue;

    const depsSection = match[1];
    const depLines = depsSection.split("\n");

    for (const depLine of depLines) {
      const trimmed = depLine.trim();
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("[")) continue;

      // Match: package = "version" or package = {version = "..."}
      const simpleMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*=\s*"([^"]*)"/);
      if (simpleMatch) {
        const pkgName = simpleMatch[1].toLowerCase();
        const versionSpec = simpleMatch[2];

        const framework = PYTHON_FRAMEWORKS.find((f) => f.pkg === pkgName);
        if (framework) {
          const isPinned = /^\d+\.\d+/.test(versionSpec) && !/[><=~^]/.test(versionSpec);
          const versionInfo: VersionInfo = isPinned
            ? { value: versionSpec, certainty: "exact", sourceFile: manifest.relativePath }
            : {
                value: versionSpec.replace(/^[><=~^]+/, ""),
                certainty: "ambiguous",
                sourceFile: manifest.relativePath,
                notes: `Constraint '${versionSpec}' in pyproject.toml`,
              };

          signals.push({
            kind: "framework",
            frameworkId: framework.frameworkId,
            frameworkName: framework.frameworkName,
            version: versionInfo,
            evidence: {
              file: manifest.relativePath,
              reason: `Python package '${pkgName}' found in pyproject.toml`,
              excerpt: trimmed,
            },
            scope: { pathRoot: rootPath },
          });
        }
      }
    }
  }

  // Check for python version requirement
  const pythonVersionMatch = content.match(/requires-python\s*=\s*"([^"]+)"/);
  if (pythonVersionMatch) {
    const spec = pythonVersionMatch[1];
    const isExact = /^\d+\.\d+/.test(spec) && !/[><=~^]/.test(spec);
    signals.push({
      kind: "version",
      frameworkId: "python",
      frameworkName: "Python",
      version: {
        value: spec.replace(/^[><=~^]+/, ""),
        certainty: isExact ? "exact" : "ambiguous",
        sourceFile: manifest.relativePath,
        notes: isExact ? undefined : `Constraint '${spec}'`,
      },
      evidence: {
        file: manifest.relativePath,
        reason: "Python version requirement in pyproject.toml",
        excerpt: `requires-python = "${spec}"`,
      },
      scope: { pathRoot: rootPath },
    });
  }

  return signals;
}

/**
 * Parse Pipfile (basic TOML-like parsing)
 */
export function parsePipfile(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";

  signals.push({
    kind: "framework",
    frameworkId: "python",
    frameworkName: "Python",
    evidence: {
      file: manifest.relativePath,
      reason: "Pipfile found (Pipenv project)",
    },
    scope: { pathRoot: rootPath },
  });

  signals.push({
    kind: "tooling",
    frameworkId: "pipenv",
    frameworkName: "Pipenv",
    evidence: {
      file: manifest.relativePath,
      reason: "Pipfile found",
    },
    scope: { pathRoot: rootPath },
  });

  // Extract packages section
  const packagesMatch = content.match(/\[packages\]([\s\S]*?)(?:\n\[|$)/);
  if (packagesMatch) {
    const lines = packagesMatch[1].split("\n");
    for (const line of lines) {
      const match = line.trim().match(/^([a-zA-Z0-9_.-]+)\s*=\s*"([^"]*)"/);
      if (match) {
        const pkgName = match[1].toLowerCase();
        const framework = PYTHON_FRAMEWORKS.find((f) => f.pkg === pkgName);
        if (framework) {
          const versionSpec = match[2];
          const isExact = versionSpec === "*" ? false : /^\d+\.\d+/.test(versionSpec);
          signals.push({
            kind: "framework",
            frameworkId: framework.frameworkId,
            frameworkName: framework.frameworkName,
            version: isExact
              ? { value: versionSpec, certainty: "exact", sourceFile: manifest.relativePath }
              : {
                  certainty: versionSpec === "*" ? "unknown" : "ambiguous",
                  sourceFile: manifest.relativePath,
                },
            evidence: {
              file: manifest.relativePath,
              reason: `Python package '${pkgName}' found in Pipfile`,
              excerpt: line.trim(),
            },
            scope: { pathRoot: rootPath },
          });
        }
      }
    }
  }

  return signals;
}

/**
 * Parse setup.cfg (ini-like)
 */
export function parseSetupCfg(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  const rootPath = path.dirname(manifest.relativePath) || ".";

  signals.push({
    kind: "framework",
    frameworkId: "python",
    frameworkName: "Python",
    evidence: {
      file: manifest.relativePath,
      reason: "setup.cfg found (Python setuptools project)",
    },
    scope: { pathRoot: rootPath },
  });

  // Extract install_requires
  const installRequiresMatch = content.match(/install_requires\s*=\s*([\s\S]*?)(?:\n\S|\n\[|$)/);
  if (installRequiresMatch) {
    const lines = installRequiresMatch[1].split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const match = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*([><=~!]+.*)?$/);
      if (match) {
        const pkgName = match[1].toLowerCase();
        const framework = PYTHON_FRAMEWORKS.find((f) => f.pkg === pkgName);
        if (framework) {
          const versionInfo = parsePythonVersion(match[2] || "", manifest.relativePath, pkgName);
          signals.push({
            kind: "framework",
            frameworkId: framework.frameworkId,
            frameworkName: framework.frameworkName,
            version: versionInfo,
            evidence: {
              file: manifest.relativePath,
              reason: `Python package '${pkgName}' found in setup.cfg`,
              excerpt: trimmed,
            },
            scope: { pathRoot: rootPath },
          });
        }
      }
    }
  }

  return signals;
}
