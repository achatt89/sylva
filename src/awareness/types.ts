/**
 * Shared types for the Sylva awareness system.
 * These types are used across manifest scanning, parsing, detection, and web grounding.
 */

/** Version certainty levels — NEVER ASSUME */
export type VersionCertainty = "exact" | "unknown" | "ambiguous";

/** Version information extracted from a manifest file */
export interface VersionInfo {
  value?: string;
  certainty: VersionCertainty;
  sourceFile?: string;
  sourcePath?: string;
  notes?: string;
}

/** Signal kinds emitted by manifest parsers */
export type SignalKind =
  | "framework"
  | "version"
  | "orchestrator"
  | "entrypoint"
  | "tooling"
  | "agent"
  | "subagent"
  | "heartbeat"
  | "cron"
  | "hook"
  | "skill"
  | "plugin";

/** Evidence for a detected signal */
export interface SignalEvidence {
  file: string;
  reason: string;
  excerpt?: string;
}

/** Scope of a signal — which subproject it belongs to */
export interface SignalScope {
  pathRoot?: string;
}

/** A single signal emitted by a manifest parser */
export interface Signal {
  kind: SignalKind;
  frameworkId: string;
  frameworkName: string;
  version?: VersionInfo;
  evidence: SignalEvidence;
  scope: SignalScope;
}

/** A discovered manifest file */
export interface ManifestFile {
  absolutePath: string;
  relativePath: string;
  filename: string;
  depth: number;
  size: number;
}

/** A detected stack with confidence and evidence */
export interface StackInfo {
  frameworkId: string;
  frameworkName: string;
  confidence: number; // 0-100
  versions: VersionInfo[];
  evidence: Signal[];
  rootPath?: string;
}

/** A workload in the architecture model */
export interface Workload {
  id: string;
  name: string;
  rootPath: string;
  frameworks: string[];
  entrypoints: string[];
  buildTools: string[];
  evidence: SignalEvidence[];
}

/** Orchestrator info (e.g., OpenClaw) */
export interface OrchestratorInfo {
  id: string;
  configPath: string;
  details: Record<string, unknown>;
}

/** Architecture model derived from detection */
export interface ArchitectureModel {
  primaryOrchestrator?: OrchestratorInfo;
  workloads: Workload[];
  repoType: "single" | "monorepo" | "unknown";
  navigation: {
    whatToReadFirst: string[];
    whereThingsLive: string[];
  };
}

/** Reference mode for web grounding */
export type ReferenceMode = "versioned" | "latest_fallback";

/** A single web search result */
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
}

/** Grouped web references for a framework */
export interface WebReference {
  frameworkId: string;
  frameworkName: string;
  versionInfo: VersionInfo;
  referenceMode: ReferenceMode;
  results: WebSearchResult[];
}

/** The complete output of the awareness pipeline */
export interface AwarenessResult {
  manifests: ManifestFile[];
  signals: Signal[];
  stacks: StackInfo[];
  architecture: ArchitectureModel;
  webReferences: WebReference[];
  constraintsBlock: string;
  awarenessContext: string;
  errors: string[];
}
