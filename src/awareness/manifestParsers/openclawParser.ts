/**
 * OpenClaw manifest parser.
 * Parses openclaw.json to extract orchestrator configuration.
 */

import * as fs from "fs";
import * as path from "path";
import { Signal, ManifestFile } from "../types";

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

  // Primary orchestrator signal
  signals.push({
    kind: "orchestrator",
    frameworkId: "openclaw",
    frameworkName: "OpenClaw",
    evidence: {
      file: manifest.relativePath,
      reason: "openclaw.json configuration file found",
      excerpt: content.length > 500 ? content.substring(0, 500) + "..." : content,
    },
    scope: { pathRoot: rootPath },
  });

  // Extract tool signals
  const tools = config.tools as Record<string, unknown> | undefined;
  if (tools && typeof tools === "object") {
    for (const [toolName, toolConfig] of Object.entries(tools)) {
      signals.push({
        kind: "tooling",
        frameworkId: `openclaw-tool-${toolName}`,
        frameworkName: `OpenClaw Tool: ${toolName}`,
        evidence: {
          file: manifest.relativePath,
          reason: `Tool '${toolName}' configured in openclaw.json`,
          excerpt: JSON.stringify(toolConfig, null, 2).substring(0, 200),
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  // Extract channel signals
  const channels = config.channels as Record<string, unknown> | undefined;
  if (channels && typeof channels === "object") {
    for (const [channelName] of Object.entries(channels)) {
      signals.push({
        kind: "tooling",
        frameworkId: `openclaw-channel-${channelName}`,
        frameworkName: `OpenClaw Channel: ${channelName}`,
        evidence: {
          file: manifest.relativePath,
          reason: `Channel '${channelName}' configured in openclaw.json`,
        },
        scope: { pathRoot: rootPath },
      });
    }
  }

  return signals;
}
