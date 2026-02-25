export interface ModelMetadata {
  provider: string;
  tier: "primary" | "mini";
}

export const PROVIDER_GEMINI = "gemini";
export const PROVIDER_ANTHROPIC = "anthropic";
export const PROVIDER_OPENAI = "openai";

export const MODEL_CATALOG: Record<string, ModelMetadata> = {
  // Google Gemini (2026)
  "gemini/gemini-3.1-pro": { provider: PROVIDER_GEMINI, tier: "primary" },
  "gemini/gemini-3.1-flash": { provider: PROVIDER_GEMINI, tier: "mini" },
  "gemini/gemini-3-deep-think": { provider: PROVIDER_GEMINI, tier: "primary" },

  // Anthropic Claude (2026)
  "anthropic/claude-opus-4.6": { provider: PROVIDER_ANTHROPIC, tier: "primary" },
  "anthropic/claude-sonnet-4.6": { provider: PROVIDER_ANTHROPIC, tier: "primary" },
  "anthropic/claude-sonnet-5": { provider: PROVIDER_ANTHROPIC, tier: "primary" },
  "anthropic/claude-haiku-4.5": { provider: PROVIDER_ANTHROPIC, tier: "mini" },
  "anthropic/claude-haiku-3-20250519": { provider: PROVIDER_ANTHROPIC, tier: "mini" },

  // OpenAI (2026)
  "openai/gpt-5.3": { provider: PROVIDER_OPENAI, tier: "primary" },
  "openai/gpt-5.3-codex": { provider: PROVIDER_OPENAI, tier: "primary" },
  "openai/gpt-5.2": { provider: PROVIDER_OPENAI, tier: "primary" },
  "openai/gpt-4o": { provider: PROVIDER_OPENAI, tier: "primary" },
  "openai/gpt-4o-mini": { provider: PROVIDER_OPENAI, tier: "mini" },
};

export const DEFAULT_MODELS: Record<string, string> = {
  [PROVIDER_GEMINI]: "gemini/gemini-3.1-pro",
  [PROVIDER_ANTHROPIC]: "anthropic/claude-sonnet-4.6",
  [PROVIDER_OPENAI]: "openai/gpt-4o",
};

export const DEFAULT_MINI_MODELS: Record<string, string> = {
  [PROVIDER_GEMINI]: "gemini/gemini-3.1-flash",
  [PROVIDER_ANTHROPIC]: "anthropic/claude-haiku-3-20250519",
  [PROVIDER_OPENAI]: "openai/gpt-4o-mini",
};

export const API_KEY_ENV_VARS: Record<string, string[]> = {
  [PROVIDER_GEMINI]: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
  [PROVIDER_ANTHROPIC]: ["ANTHROPIC_API_KEY"],
  [PROVIDER_OPENAI]: ["OPENAI_API_KEY"],
};

export const ALLOWED_EXTENSIONS = new Set([
  ".py",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".vue",
  ".java",
  ".md",
  ".json",
  ".yml",
  ".yaml",
  ".txt",
  ".html",
  ".css",
  ".scss",
  ".less",
  ".c",
  ".cpp",
  ".h",
  ".hpp",
  ".cs",
  ".go",
  ".rb",
  ".php",
  ".rs",
  ".sh",
  ".swift",
  ".kt",
  ".sql",
  ".xml",
  ".toml",
  ".ini",
  ".dart",
  ".scala",
  ".r",
  ".m",
  ".pl",
]);

export const IGNORED_DIRS = new Set([
  "node_modules",
  "__pycache__",
  "venv",
  "env",
  "dist",
  "build",
  "target",
  "vendor",
  "bin",
  "obj",
  "out",
  "coverage",
  "logs",
  "tmp",
  "temp",
  "packages",
  "pkg",
  ".git",
]);

/**
 * Dependency manifest files that should be hoisted to the top of the serialized
 * source tree so the AI reads them FIRST, preventing framework hallucination.
 */
export const DEPENDENCY_MANIFESTS = new Set([
  "requirements.txt",
  "pyproject.toml",
  "Pipfile",
  "setup.py",
  "setup.cfg",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "Gemfile",
  "composer.json",
  "Package.swift",
  "Makefile",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
  "package.json",
]);
