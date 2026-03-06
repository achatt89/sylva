/**
 * OpenClaw manifest parser — deep extraction.
 * Parses openclaw.json / .openclaw.json to extract:
 *   - Orchestrator signal with version from meta
 *   - Agent config (models, workspace, concurrency)
 *   - Hooks (internal event scripts with paths + descriptions)
 *   - Plugins (enabled extensions)
 *   - Gateway config (port, auth, denied commands)
 *   - Channels (policies, stream modes)
 *   - Tools (web search, fetch)
 *   - Commands / messages config
 *
 * Also scans the OpenClaw workspace directory for:
 *   - Skills (reusable .md workflows)
 *   - Subagents (background agent directories)
 *   - Workspace .md files (AGENTS.md, IDENTITY.md, HEARTBEAT.md, etc.)
 *   - Hook scripts
 */

import * as fs from "fs";
import * as path from "path";
import { Signal, ManifestFile, VersionInfo } from "../types";

// ---------------------
// Deep JSON extraction
// ---------------------

export function parseOpenclawJson(manifest: ManifestFile): Signal[] {
  const signals: Signal[] = [];
  const content = fs.readFileSync(manifest.absolutePath, "utf-8");
  let config: Record<string, unknown>;

  try {
    config = JSON.parse(content);
  } catch (error) {
    console.warn(
      `⚠️  Could not parse ${manifest.relativePath}: ${(error as Error).message}\n` +
        `   This file appears to be malformed JSON. OpenClaw orchestrator detection is skipped for this file.\n` +
        `   Fix the JSON syntax to enable OpenClaw orchestrator detection.`
    );
    return signals;
  }

  const rootPath = path.dirname(manifest.relativePath) || ".";

  // --- Extract OpenClaw version from meta ---
  const meta = config.meta as Record<string, unknown> | undefined;
  const openclawVersion: VersionInfo | undefined = meta?.lastTouchedVersion
    ? {
        value: String(meta.lastTouchedVersion),
        certainty: "exact",
        sourceFile: manifest.relativePath,
        notes: "From meta.lastTouchedVersion in openclaw.json",
      }
    : undefined;

  // --- Primary orchestrator signal ---
  signals.push({
    kind: "orchestrator",
    frameworkId: "openclaw",
    frameworkName: "OpenClaw",
    ...(openclawVersion ? { version: openclawVersion } : {}),
    evidence: {
      file: manifest.relativePath,
      reason: "openclaw.json configuration file found",
      excerpt: openclawVersion
        ? `OpenClaw version ${openclawVersion.value}`
        : "OpenClaw orchestrator (version not specified in config)",
    },
    scope: { pathRoot: rootPath },
  });

  // --- Agent config ---
  extractAgentConfig(config, manifest, rootPath, signals);

  // --- Hooks ---
  extractHooks(config, manifest, rootPath, signals);

  // --- Plugins ---
  extractPlugins(config, manifest, rootPath, signals);

  // --- Gateway ---
  extractGateway(config, manifest, rootPath, signals);

  // --- Channels (expanded) ---
  extractChannels(config, manifest, rootPath, signals);

  // --- Tools (expanded) ---
  extractTools(config, manifest, rootPath, signals);

  // --- Commands + messages ---
  extractCommandsAndMessages(config, manifest, rootPath, signals);

  // --- Workspace scanning ---
  scanWorkspace(config, manifest, rootPath, signals);

  return signals;
}

// ---------------------
// Section extractors
// ---------------------

function extractAgentConfig(
  config: Record<string, unknown>,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const agents = config.agents as Record<string, unknown> | undefined;
  if (!agents || typeof agents !== "object") return;

  const defaults = agents.defaults as Record<string, unknown> | undefined;
  if (!defaults || typeof defaults !== "object") return;

  // Primary model
  const model = defaults.model as Record<string, unknown> | undefined;
  const primaryModel = model?.primary ? String(model.primary) : undefined;

  // Available models
  const models = defaults.models as Record<string, unknown> | undefined;
  const modelCatalog = models ? Object.keys(models) : [];

  // Workspace path
  const workspace = defaults.workspace ? String(defaults.workspace) : undefined;

  // Concurrency
  const maxConcurrent =
    typeof defaults.maxConcurrent === "number" ? defaults.maxConcurrent : undefined;
  const subagentConfig = defaults.subagents as Record<string, unknown> | undefined;
  const subagentMaxConcurrent =
    subagentConfig && typeof subagentConfig.maxConcurrent === "number"
      ? subagentConfig.maxConcurrent
      : undefined;

  // Compaction
  const compaction = defaults.compaction as Record<string, unknown> | undefined;
  const compactionMode = compaction?.mode ? String(compaction.mode) : undefined;

  const details: string[] = [];
  if (primaryModel) details.push(`primary model: ${primaryModel}`);
  if (modelCatalog.length > 0) details.push(`${modelCatalog.length} model(s) available`);
  if (workspace) details.push(`workspace: ${workspace}`);
  if (maxConcurrent) details.push(`maxConcurrent: ${maxConcurrent}`);
  if (subagentMaxConcurrent) details.push(`subagent maxConcurrent: ${subagentMaxConcurrent}`);
  if (compactionMode) details.push(`compaction: ${compactionMode}`);

  signals.push({
    kind: "agent",
    frameworkId: "openclaw-agent-config",
    frameworkName: "OpenClaw Agent Config",
    evidence: {
      file: manifest.relativePath,
      reason: "Agent configuration in openclaw.json",
      excerpt: details.join("; "),
    },
    scope: { pathRoot: rootPath },
  });

  // Emit individual model entries for the LLM to know available models
  if (modelCatalog.length > 0) {
    signals.push({
      kind: "agent",
      frameworkId: "openclaw-model-catalog",
      frameworkName: "OpenClaw Model Catalog",
      evidence: {
        file: manifest.relativePath,
        reason: "Available LLM models configured in openclaw.json",
        excerpt: modelCatalog.join(", "),
      },
      scope: { pathRoot: rootPath },
    });
  }
}

function extractHooks(
  config: Record<string, unknown>,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const hooks = config.hooks as Record<string, unknown> | undefined;
  if (!hooks || typeof hooks !== "object") return;

  const internal = hooks.internal as Record<string, unknown> | undefined;
  if (!internal || typeof internal !== "object") return;
  if (internal.enabled === false) return;

  const entries = internal.entries as Record<string, Record<string, unknown>> | undefined;
  if (!entries || typeof entries !== "object") return;

  for (const [hookName, hookConfig] of Object.entries(entries)) {
    if (!hookConfig || typeof hookConfig !== "object") continue;

    const enabled = hookConfig.enabled !== false; // default true
    const hookPath = hookConfig.path ? String(hookConfig.path) : undefined;
    const description = hookConfig.description ? String(hookConfig.description) : undefined;

    const details: string[] = [`enabled: ${enabled}`];
    if (hookPath) details.push(`path: ${hookPath}`);
    if (description) details.push(`desc: ${description}`);

    signals.push({
      kind: "hook",
      frameworkId: `openclaw-hook-${hookName}`,
      frameworkName: `OpenClaw Hook: ${hookName}`,
      evidence: {
        file: manifest.relativePath,
        reason: description || `Hook '${hookName}' configured in openclaw.json`,
        excerpt: details.join("; "),
      },
      scope: { pathRoot: rootPath },
    });
  }
}

function extractPlugins(
  config: Record<string, unknown>,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const plugins = config.plugins as Record<string, unknown> | undefined;
  if (!plugins || typeof plugins !== "object") return;

  const entries = plugins.entries as Record<string, Record<string, unknown>> | undefined;
  if (!entries || typeof entries !== "object") return;

  for (const [pluginName, pluginConfig] of Object.entries(entries)) {
    if (!pluginConfig || typeof pluginConfig !== "object") continue;

    const enabled = pluginConfig.enabled !== false;

    signals.push({
      kind: "plugin",
      frameworkId: `openclaw-plugin-${pluginName}`,
      frameworkName: `OpenClaw Plugin: ${pluginName}`,
      evidence: {
        file: manifest.relativePath,
        reason: `Plugin '${pluginName}' ${enabled ? "enabled" : "disabled"} in openclaw.json`,
        excerpt: `enabled: ${enabled}`,
      },
      scope: { pathRoot: rootPath },
    });
  }
}

function extractGateway(
  config: Record<string, unknown>,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const gateway = config.gateway as Record<string, unknown> | undefined;
  if (!gateway || typeof gateway !== "object") return;

  const details: string[] = [];
  if (gateway.port) details.push(`port: ${gateway.port}`);
  if (gateway.mode) details.push(`mode: ${gateway.mode}`);
  if (gateway.bind) details.push(`bind: ${gateway.bind}`);

  const auth = gateway.auth as Record<string, unknown> | undefined;
  if (auth?.mode) details.push(`auth: ${auth.mode}`);

  const tailscale = gateway.tailscale as Record<string, unknown> | undefined;
  if (tailscale?.mode) details.push(`tailscale: ${tailscale.mode}`);

  const nodes = gateway.nodes as Record<string, unknown> | undefined;
  const denyCommands = nodes?.denyCommands as string[] | undefined;
  if (denyCommands && Array.isArray(denyCommands)) {
    details.push(`denied commands: ${denyCommands.join(", ")}`);
  }

  signals.push({
    kind: "tooling",
    frameworkId: "openclaw-gateway",
    frameworkName: "OpenClaw Gateway",
    evidence: {
      file: manifest.relativePath,
      reason: "Gateway configuration in openclaw.json",
      excerpt: details.join("; "),
    },
    scope: { pathRoot: rootPath },
  });
}

function extractChannels(
  config: Record<string, unknown>,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const channels = config.channels as Record<string, unknown> | undefined;
  if (!channels || typeof channels !== "object") return;

  for (const [channelName, channelConfig] of Object.entries(channels)) {
    if (!channelConfig || typeof channelConfig !== "object") continue;
    const ch = channelConfig as Record<string, unknown>;

    const details: string[] = [];
    if (ch.enabled === false) details.push("disabled");
    if (ch.dmPolicy) details.push(`dmPolicy: ${ch.dmPolicy}`);
    if (ch.groupPolicy) details.push(`groupPolicy: ${ch.groupPolicy}`);
    if (ch.streamMode) details.push(`streamMode: ${ch.streamMode}`);
    if (ch.selfChatMode !== undefined) details.push(`selfChat: ${ch.selfChatMode}`);
    if (ch.debounceMs !== undefined) details.push(`debounce: ${ch.debounceMs}ms`);
    if (ch.mediaMaxMb) details.push(`mediaMax: ${ch.mediaMaxMb}MB`);

    signals.push({
      kind: "tooling",
      frameworkId: `openclaw-channel-${channelName}`,
      frameworkName: `OpenClaw Channel: ${channelName}`,
      evidence: {
        file: manifest.relativePath,
        reason: `Channel '${channelName}' configured in openclaw.json`,
        excerpt: details.length > 0 ? details.join("; ") : `channel ${channelName} configured`,
      },
      scope: { pathRoot: rootPath },
    });
  }
}

function extractTools(
  config: Record<string, unknown>,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const tools = config.tools as Record<string, unknown> | undefined;
  if (!tools || typeof tools !== "object") return;

  for (const [toolName, toolConfig] of Object.entries(tools)) {
    if (!toolConfig || typeof toolConfig !== "object") continue;

    // Build a summary of the tool's sub-capabilities
    const subCapabilities: string[] = [];
    for (const [subName, subConfig] of Object.entries(toolConfig as Record<string, unknown>)) {
      if (subConfig && typeof subConfig === "object") {
        const sc = subConfig as Record<string, unknown>;
        const enabled = sc.enabled !== false;
        subCapabilities.push(`${subName}: ${enabled ? "enabled" : "disabled"}`);
      }
    }

    signals.push({
      kind: "tooling",
      frameworkId: `openclaw-tool-${toolName}`,
      frameworkName: `OpenClaw Tool: ${toolName}`,
      evidence: {
        file: manifest.relativePath,
        reason: `Tool '${toolName}' configured in openclaw.json`,
        excerpt:
          subCapabilities.length > 0 ? subCapabilities.join("; ") : `tool ${toolName} configured`,
      },
      scope: { pathRoot: rootPath },
    });
  }
}

function extractCommandsAndMessages(
  config: Record<string, unknown>,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const commands = config.commands as Record<string, unknown> | undefined;
  if (commands && typeof commands === "object") {
    const details: string[] = [];
    if (commands.native) details.push(`native: ${commands.native}`);
    if (commands.nativeSkills) details.push(`nativeSkills: ${commands.nativeSkills}`);

    if (details.length > 0) {
      signals.push({
        kind: "tooling",
        frameworkId: "openclaw-commands",
        frameworkName: "OpenClaw Commands",
        evidence: {
          file: manifest.relativePath,
          reason: "Command configuration in openclaw.json",
          excerpt: details.join("; "),
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  const messages = config.messages as Record<string, unknown> | undefined;
  if (messages && typeof messages === "object") {
    const details: string[] = [];
    if (messages.ackReactionScope) details.push(`ackReactionScope: ${messages.ackReactionScope}`);

    if (details.length > 0) {
      signals.push({
        kind: "tooling",
        frameworkId: "openclaw-messages",
        frameworkName: "OpenClaw Messages",
        evidence: {
          file: manifest.relativePath,
          reason: "Message configuration in openclaw.json",
          excerpt: details.join("; "),
        },
        scope: { pathRoot: rootPath },
      });
    }
  }
}

// ---------------------
// Workspace scanner
// ---------------------

function scanWorkspace(
  config: Record<string, unknown>,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  // Resolve workspace directory:
  // 1. From agents.defaults.workspace in config
  // 2. Fallback to sibling "workspace/" directory relative to the config file
  const agents = config.agents as Record<string, unknown> | undefined;
  const defaults = agents?.defaults as Record<string, unknown> | undefined;
  const configuredWorkspace = defaults?.workspace ? String(defaults.workspace) : undefined;

  const configDir = path.dirname(manifest.absolutePath);
  let workspaceDir: string | undefined;

  if (configuredWorkspace) {
    // Could be absolute or relative — try both
    const candidate = path.isAbsolute(configuredWorkspace)
      ? configuredWorkspace
      : path.resolve(configDir, configuredWorkspace);
    if (existsAndIsDir(candidate)) {
      workspaceDir = candidate;
    }
  }

  if (!workspaceDir) {
    // Fallback: sibling "workspace/" directory
    const fallback = path.join(configDir, "workspace");
    if (existsAndIsDir(fallback)) {
      workspaceDir = fallback;
    }
  }

  if (!workspaceDir) return;

  const workspaceRel = path.relative(path.dirname(manifest.absolutePath), workspaceDir);

  // Scan workspace .md files (identity layer)
  scanWorkspaceMdFiles(workspaceDir, workspaceRel, manifest, rootPath, signals);

  // Scan skills
  scanSkills(workspaceDir, workspaceRel, manifest, rootPath, signals);

  // Scan subagents
  scanSubagents(workspaceDir, workspaceRel, manifest, rootPath, signals);
}

function scanWorkspaceMdFiles(
  workspaceDir: string,
  workspaceRel: string,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const WORKSPACE_FILES: Record<string, string> = {
    "AGENTS.md": "Agent behavioral instructions and skill routing",
    "IDENTITY.md": "Agent identity, personality, and avatar",
    "HEARTBEAT.md": "Periodic awareness checklist (cron-like proactive checks)",
    "MEMORY.md": "Long-term curated memory store",
    "SOUL.md": "Agent personality and core values",
    "USER.md": "User profile and preferences",
    "TOOLS.md": "Tool configuration and capabilities",
    "OPTIMIZATION.md": "Performance and cost optimization rules",
  };

  for (const [filename, description] of Object.entries(WORKSPACE_FILES)) {
    const filePath = path.join(workspaceDir, filename);
    if (!existsAndIsFile(filePath)) continue;

    // For HEARTBEAT.md, check if it has actual tasks (non-empty, non-comment content)
    if (filename === "HEARTBEAT.md") {
      const heartbeatContent = safeReadFile(filePath);
      const hasActiveTasks = heartbeatContent
        ? heartbeatContent.split("\n").some((line) => line.trim() && !line.trim().startsWith("#"))
        : false;

      signals.push({
        kind: "heartbeat",
        frameworkId: "openclaw-heartbeat",
        frameworkName: "OpenClaw Heartbeat",
        evidence: {
          file: path.join(workspaceRel, filename),
          reason: hasActiveTasks
            ? "HEARTBEAT.md found with active periodic tasks"
            : "HEARTBEAT.md found but no active tasks configured",
          excerpt: hasActiveTasks ? "Status: ACTIVE" : "Status: INACTIVE (empty/comments only)",
        },
        scope: { pathRoot: rootPath },
      });
      continue;
    }

    // For IDENTITY.md, extract the agent name if present
    let excerpt = description;
    if (filename === "IDENTITY.md") {
      const identityContent = safeReadFile(filePath);
      if (identityContent) {
        const nameMatch = identityContent.match(/\*\*Name:\*\*\s*(.+)/);
        if (nameMatch) {
          excerpt = `Agent name: ${nameMatch[1].trim()} — ${description}`;
        }
      }
    }

    signals.push({
      kind: "agent",
      frameworkId: `openclaw-workspace-${filename.replace(".md", "").toLowerCase()}`,
      frameworkName: `OpenClaw Workspace: ${filename}`,
      evidence: {
        file: path.join(workspaceRel, filename),
        reason: `Workspace file ${filename} found`,
        excerpt,
      },
      scope: { pathRoot: rootPath },
    });
  }
}

function scanSkills(
  workspaceDir: string,
  workspaceRel: string,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const skillsDir = path.join(workspaceDir, "skills");
  if (!existsAndIsDir(skillsDir)) return;

  let entries: string[];
  try {
    entries = fs.readdirSync(skillsDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.endsWith(".md")) continue;
    if (entry === "SKILL_INDEX.md") continue; // Index file, not a skill itself

    const skillPath = path.join(skillsDir, entry);
    if (!existsAndIsFile(skillPath)) continue;

    // Read first meaningful line for description
    const content = safeReadFile(skillPath);
    let description = `Skill workflow: ${entry.replace(".md", "")}`;
    if (content) {
      const lines = content.split("\n").filter((l) => l.trim());
      const firstLine = lines[0] || "";
      if (firstLine.startsWith("#")) {
        description = firstLine.replace(/^#+\s*/, "").trim();
      }
    }

    const skillName = entry
      .replace(".md", "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    signals.push({
      kind: "skill",
      frameworkId: `openclaw-skill-${entry.replace(".md", "")}`,
      frameworkName: `OpenClaw Skill: ${skillName}`,
      evidence: {
        file: path.join(workspaceRel, "skills", entry),
        reason: description,
        excerpt: `Skill file: ${entry}`,
      },
      scope: { pathRoot: rootPath },
    });
  }
}

function scanSubagents(
  workspaceDir: string,
  workspaceRel: string,
  manifest: ManifestFile,
  rootPath: string,
  signals: Signal[]
): void {
  const subagentsDir = path.join(workspaceDir, "subagents");
  if (!existsAndIsDir(subagentsDir)) return;

  let entries: string[];
  try {
    entries = fs.readdirSync(subagentsDir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const entryPath = path.join(subagentsDir, entry);
    if (!existsAndIsDir(entryPath)) continue;

    // List files in the subagent directory
    let subFiles: string[];
    try {
      subFiles = fs.readdirSync(entryPath).filter((f) => {
        const fp = path.join(entryPath, f);
        try {
          return fs.statSync(fp).isFile() && !f.startsWith(".");
        } catch {
          return false;
        }
      });
    } catch {
      continue;
    }

    // Filter out __pycache__ etc
    const meaningfulFiles = subFiles.filter((f) => !f.endsWith(".pyc") && f !== "__pycache__");

    // Try to read protocol.md for description
    let description = `Subagent: ${entry}`;
    const protocolPath = path.join(entryPath, "protocol.md");
    if (existsAndIsFile(protocolPath)) {
      const content = safeReadFile(protocolPath);
      if (content) {
        const lines = content.split("\n").filter((l) => l.trim());
        const firstLine = lines[0] || "";
        if (firstLine.startsWith("#")) {
          description = firstLine.replace(/^#+\s*/, "").trim();
        }
      }
    }

    const subagentName = entry.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    signals.push({
      kind: "subagent",
      frameworkId: `openclaw-subagent-${entry}`,
      frameworkName: `OpenClaw Subagent: ${subagentName}`,
      evidence: {
        file: path.join(workspaceRel, "subagents", entry),
        reason: description,
        excerpt:
          meaningfulFiles.length > 0
            ? `Files: ${meaningfulFiles.join(", ")}`
            : "Empty subagent directory",
      },
      scope: { pathRoot: rootPath },
    });
  }
}

// ---------------------
// Helpers
// ---------------------

function existsAndIsDir(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function existsAndIsFile(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function safeReadFile(p: string): string | null {
  try {
    return fs.readFileSync(p, "utf-8");
  } catch {
    return null;
  }
}
