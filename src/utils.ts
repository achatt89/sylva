import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { ALLOWED_EXTENSIONS, IGNORED_DIRS, DEPENDENCY_MANIFESTS } from "./constants";

export type TreeType = string | { [key: string]: TreeType };

/**
 * Recursively load the source tree into a nested dictionary,
 * skipping ignored directories and unsupported extensions to save LLM context.
 */
export function loadSourceTree(rootDir: string): { [key: string]: TreeType } {
  const tree: { [key: string]: TreeType } = {};

  if (!fs.existsSync(rootDir)) return tree;

  const entries = fs.readdirSync(rootDir);

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry) || entry === ".git" || entry === ".DS_Store") {
      continue;
    }

    const fullPath = path.join(rootDir, entry);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      console.log(`Failed to parse file: ${fullPath}, skipping.`);
      continue;
    }

    if (stat.isDirectory()) {
      if (!entry.startsWith(".")) {
        const subTree = loadSourceTree(fullPath);
        if (Object.keys(subTree).length > 0) {
          tree[entry] = subTree;
        }
      }
    } else {
      const ext = path.extname(entry).toLowerCase();

      // Allow specific files even without standard extension
      if (!ALLOWED_EXTENSIONS.has(ext) && entry !== "Dockerfile" && entry !== "Makefile") continue;

      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        if (content.length < 500000) {
          tree[entry] = content;
        } else {
          console.warn(`File ${fullPath} skipped due to being too large (${content.length} chars)`);
        }
      } catch (error) {
        console.warn(
          `File ${fullPath} skipped due to read/encoding issues: ${(error as Error).message}`
        );
      }
    }
  }

  // Hoist dependency manifests to the top of the tree so the AI reads them first
  const hoisted: { [key: string]: TreeType } = {};
  const rest: { [key: string]: TreeType } = {};
  for (const [key, value] of Object.entries(tree)) {
    if (DEPENDENCY_MANIFESTS.has(key)) {
      hoisted[key] = value;
    } else {
      rest[key] = value;
    }
  }

  return { ...hoisted, ...rest };
}

/**
 * Clones a Git repository to the specified destination handling child_process execution.
 */
export function cloneRepo(repoUrl: string, destDir: string): void {
  console.log(`Cloning ${repoUrl} into ${destDir}...`);
  try {
    execSync(`git clone --depth 1 ${repoUrl} ${destDir}`, { stdio: "pipe" });
  } catch (error: any) {
    console.error(`Failed to clone repository: ${error.message}`);
    if (error.stderr) console.error(error.stderr.toString());
    throw new Error("Git clone failed", { cause: error });
  }
}

/**
 * Saves compiled AGENTS.md back to disk on a standardized path.
 */
export function saveAgentsToDisk(
  repoName: string,
  agentsContent: string,
  baseDir: string = "projects"
): void {
  let cleanContent = agentsContent.trim();
  // Strip surrounding markdown code blocks if the LLM wrapped it completely
  cleanContent = cleanContent.replace(/^```(?:markdown)?\s*\n/, "");
  cleanContent = cleanContent.replace(/```\s*$/, "");
  cleanContent = cleanContent.trim();

  const folderName = repoName.toLowerCase().replace(/\s+/g, "-");
  const targetDir = path.join(baseDir, folderName);

  fs.mkdirSync(targetDir, { recursive: true });

  const filePath = path.join(targetDir, "AGENTS.md");
  try {
    fs.writeFileSync(filePath, cleanContent, "utf-8");
    console.log(`✅ Successfully saved AGENTS.md to: ${filePath}`);
  } catch (error: any) {
    console.error(`Failed to save AGENTS.md to ${filePath}: ${error.message}`);
  }
}

export interface AgentsMdSections {
  projectOverview?: string;
  agentPersona?: string;
  techStack?: string;
  architecture?: string;
  codeStyle?: string;
  antiPatternsAndRestrictions?: string;
  databaseAndState?: string;
  errorHandlingAndLogging?: string;
  testingCommands?: string;
  testingGuidelines?: string;
  securityAndCompliance?: string;
  dependenciesAndEnvironment?: string;
  prAndGitRules?: string;
  documentationStandards?: string;
  commonPatterns?: string;
  agentWorkflow?: string;
  fewShotExamples?: string;
}

const AGENTS_SECTION_HEADINGS: [keyof AgentsMdSections, string][] = [
  ["projectOverview", "Project Overview"],
  ["agentPersona", "Agent Persona"],
  ["techStack", "Tech Stack"],
  ["architecture", "Architecture"],
  ["codeStyle", "Code Style"],
  ["antiPatternsAndRestrictions", "Anti-Patterns & Restrictions"],
  ["databaseAndState", "Database & State Management"],
  ["errorHandlingAndLogging", "Error Handling & Logging"],
  ["testingCommands", "Testing Commands"],
  ["testingGuidelines", "Testing Guidelines"],
  ["securityAndCompliance", "Security & Compliance"],
  ["dependenciesAndEnvironment", "Dependencies & Environment"],
  ["prAndGitRules", "PR & Git Rules"],
  ["documentationStandards", "Documentation Standards"],
  ["commonPatterns", "Common Patterns"],
  ["agentWorkflow", "Agent Workflow / SOP"],
  ["fewShotExamples", "Few-Shot Examples"],
];

/**
 * Joins evaluated section variables together into the uniform AGENTS.md map.
 */
export function compileAgentsMd(sections: AgentsMdSections, repoName: string): string {
  const parts: string[] = [`# AGENTS.md — ${repoName}\n`];

  for (const [key, heading] of AGENTS_SECTION_HEADINGS) {
    const content = sections[key];
    if (content && content.trim() !== "") {
      parts.push(`## ${heading}\n\n${content.trim()}\n`);
    }
  }

  return parts.join("\n");
}
