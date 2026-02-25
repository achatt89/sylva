"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSourceTree = loadSourceTree;
exports.cloneRepo = cloneRepo;
exports.saveAgentsToDisk = saveAgentsToDisk;
exports.compileAgentsMd = compileAgentsMd;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const ALLOWED_EXTENSIONS = new Set([
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
const IGNORED_DIRS = new Set([
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
 * Recursively load the source tree into a nested dictionary,
 * skipping ignored directories and unsupported extensions to save LLM context.
 */
function loadSourceTree(rootDir) {
    const tree = {};
    if (!fs.existsSync(rootDir))
        return tree;
    const entries = fs.readdirSync(rootDir);
    for (const entry of entries) {
        if (IGNORED_DIRS.has(entry) || entry === ".git" || entry === ".DS_Store") {
            continue;
        }
        const fullPath = path.join(rootDir, entry);
        let stat;
        try {
            stat = fs.statSync(fullPath);
        }
        catch (error) {
            console.warn(`Failed to stat file ${fullPath}, skipping.`);
            continue;
        }
        if (stat.isDirectory()) {
            if (!entry.startsWith(".")) {
                const subTree = loadSourceTree(fullPath);
                if (Object.keys(subTree).length > 0) {
                    tree[entry] = subTree;
                }
            }
        }
        else {
            const ext = path.extname(entry).toLowerCase();
            // Allow specific files even without standard extension
            if (!ALLOWED_EXTENSIONS.has(ext) &&
                entry !== "Dockerfile" &&
                entry !== "Makefile")
                continue;
            try {
                const content = fs.readFileSync(fullPath, "utf-8");
                if (content.length < 500000) {
                    tree[entry] = content;
                }
                else {
                    console.warn(`File ${fullPath} skipped due to being too large (${content.length} chars)`);
                }
            }
            catch (error) {
                console.warn(`File ${fullPath} skipped due to read/encoding issues: ${error.message}`);
            }
        }
    }
    return tree;
}
/**
 * Clones a Git repository to the specified destination handling child_process execution.
 */
function cloneRepo(repoUrl, destDir) {
    console.log(`Cloning ${repoUrl} into ${destDir}...`);
    try {
        (0, child_process_1.execSync)(`git clone --depth 1 ${repoUrl} ${destDir}`, { stdio: "pipe" });
    }
    catch (error) {
        console.error(`Failed to clone repository: ${error.message}`);
        if (error.stderr)
            console.error(error.stderr.toString());
        throw new Error("Git clone failed");
    }
}
/**
 * Saves compiled AGENTS.md back to disk on a standardized path.
 */
function saveAgentsToDisk(repoName, agentsContent, baseDir = "projects") {
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
    }
    catch (error) {
        console.error(`Failed to save AGENTS.md to ${filePath}: ${error.message}`);
    }
}
const AGENTS_SECTION_HEADINGS = [
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
function compileAgentsMd(sections, repoName) {
    const parts = [`# AGENTS.md — ${repoName}\n`];
    for (const [key, heading] of AGENTS_SECTION_HEADINGS) {
        const content = sections[key];
        if (content && content.trim() !== "") {
            parts.push(`## ${heading}\n\n${content.trim()}\n`);
        }
    }
    return parts.join("\n");
}
