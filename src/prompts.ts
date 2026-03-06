import { f } from "@ax-llm/ax";

export const CODEBASE_ANALYSIS_SIGNATURE = f()
  .input("sourceContext", f.string())
  .input(
    "awarenessContext",
    f.string(
      "Deterministically detected framework/architecture constraints from repo manifest files. Treat this as AUTHORITATIVE — do not contradict it. Use detected stacks and versions; mark unknown/ambiguous when appropriate."
    )
  )
  .output(
    "projectOverview",
    f.string(
      "Project Overview & Context: Exhaustively describe all primary sub-services, their purpose, and what languages or frameworks power them."
    )
  )
  .output("agentPersona", f.string("Agent Persona / Role"))
  .output(
    "techStack",
    f.string(
      "Tech Stack & Versions: List EVERY distinct language, library, database, and external API dependency used. WARNING: Do NOT guess frameworks based on assumptions or the presence of a package.json. You must explicitly scan the actual code files (e.g. imports in .py, .ts, .js) and dependency manifests (e.g. requirements.txt, go.mod) to determine the EXACT tech stack."
    )
  )
  .output(
    "directoryStructure",
    f.string(
      "Directory Structure (The Map): Deeply map out all root folders. CRITICAL: You MUST strictly represent the EXACT physical file and directory structure provided in the source context. Do NOT invent, extrapolate, or hallucinate conceptual directories (like 'client/' or 'server/') if they do not physically exist on disk. If you see scripts like 'build:client' or 'build:server' in a package.json, interpret them as Build Output pipelines (like SSR/SSG), NOT as physical source directories unless those directories literally exist."
    )
  )
  .output(
    "executionCommands",
    f.string("Execution Commands: Exact terminal commands to run or build.")
  )
  .output(
    "codeStyleAndFormatting",
    f.string(
      "Code Style & Formatting: Language-specific formatting and strictly enforced linting rules."
    )
  )
  .output(
    "architectureAndDesignPatterns",
    f.string(
      "Architecture & Design Patterns: Detailed cross-service logical flow, API boundaries, and system design logic."
    )
  )
  .output("antiPatternsAndRestrictions", f.string("Anti-Patterns & Restrictions"))
  .output("dependencyManagement", f.string("Dependency Management"))
  .output("stateManagementGuidelines", f.string("State Management Guidelines"))
  .output("databaseAndDataHandling", f.string("Database & Data Handling"))
  .output("errorHandlingAndLogging", f.string("Error Handling & Logging"))
  .output("testingStrategy", f.string("Testing Strategy"))
  .output("securityAndCompliance", f.string("Security & Compliance"))
  .output("gitAndVersionControl", f.string("Git & Version Control"))
  .output("documentationStandards", f.string("Documentation Standards"))
  .output("agentWorkflow", f.string("Agent Workflow / SOP"))
  .output(
    "fewShotExamples",
    f.string("Few-Shot Examples: Specific code snippets showing 'how to do X correctly'.")
  )
  .build();

export const CODEBASE_ANALYZER_IDENTITY = {
  name: "CodebaseAnalyzer",
  description:
    "A hyper-detailed technical architect generating strict developer manifests. You must analyze the structural backbone, data flow, and day-to-day coding conventions of the application using recursive analysis of the source code. NEVER hallucinate frameworks; always verify by scanning actual source imports and dependency files. CRITICAL: You will receive an awarenessContext field containing ARCHITECTURE CONSTRAINTS derived from deterministic manifest analysis. Treat these constraints as AUTHORITATIVE. Do not contradict them. Do not invent frameworks, languages, entrypoints, or tooling not present in the evidence. If OpenClaw is detected as orchestrator, include an OpenClaw Runtime section and treat other stacks as workloads/subagents. Use detected stack and versions; mark unknown/ambiguous when appropriate.",
};

export const COMPILE_CONVENTIONS_SIGNATURE = f()
  .input("projectOverview", f.string("Project Overview & Context."))
  .input("agentPersona", f.string("Agent Persona / Role."))
  .input("techStack", f.string("Tech Stack & Versions."))
  .input(
    "directoryStructure",
    f.string(
      "Directory Structure (The Map). CRITICAL: Maintain the exact PHYSICAL file and directory structure produced by the analyzer. Do NOT invent conceptual boundaries (like client/ or server/) if they are not in the provided map."
    )
  )
  .input("executionCommands", f.string("Execution Commands."))
  .input("codeStyleAndFormatting", f.string("Code Style & Formatting."))
  .input("architectureAndDesignPatterns", f.string("Architecture & Design Patterns."))
  .input("antiPatternsAndRestrictions", f.string("Anti-Patterns & Restrictions."))
  .input("dependencyManagement", f.string("Dependency Management."))
  .input("stateManagementGuidelines", f.string("State Management Guidelines."))
  .input("databaseAndDataHandling", f.string("Database & Data Handling."))
  .input("errorHandlingAndLogging", f.string("Error Handling & Logging."))
  .input("testingStrategy", f.string("Testing Strategy."))
  .input("securityAndCompliance", f.string("Security & Compliance."))
  .input("gitAndVersionControl", f.string("Git & Version Control."))
  .input("documentationStandards", f.string("Documentation Standards."))
  .input("agentWorkflow", f.string("Agent Workflow / SOP."))
  .input("fewShotExamples", f.string("Few-Shot Examples."))
  .input(
    "awarenessContext",
    f.string(
      "ARCHITECTURE CONSTRAINTS (AUTHORITATIVE): Deterministically detected frameworks, versions, and architecture from manifest files. Do NOT contradict these constraints in the compiled output. The compiled conventions MUST reflect the detected stacks, version certainty levels, and orchestrator/workload structure exactly as specified. If OpenClaw is the orchestrator, the conventions must describe the OpenClaw runtime and its workloads."
    )
  )
  .output(
    "markdownDocument",
    f.string(
      "Comprehensive CODEBASE_CONVENTIONS.md document formatted with clear headings, bullet points, and specific code/file snippets as evidence. The document MUST align with the ARCHITECTURE CONSTRAINTS provided in awarenessContext."
    )
  )
  .build();

export const EXTRACT_AGENTS_SECTIONS_SIGNATURE = f()
  .input(
    "conventionsMarkdown",
    f.string("The extracted architectural, data flow, and granular coding conventions")
  )
  .input("repositoryName", f.string("The name of the repository or project"))
  .input(
    "awarenessContext",
    f.string(
      "Deterministically detected framework/architecture constraints. AUTHORITATIVE — do not contradict. If OpenClaw orchestrator is present, include OpenClaw Runtime section. Show version certainty for each framework. Include Framework References when web refs are available."
    )
  )
  .output(
    "projectOverview",
    f.string(
      "Comprehensive description of the project: what it does, its tech stack, its primary languages, and its overall purpose and functionality."
    )
  )
  .output(
    "techStack",
    f.string(
      "Explicit and exhaustive list of supported languages, frameworks, UI libraries, backend runtimes, and tools used in the repository. Annotate what each technology is used for (e.g., 'X Framework for UI', 'Y Language for REST Services')."
    )
  )
  .output(
    "architecture",
    f.string(
      "Deep mapping of where things live: directory layout, key modules, entry points, and their responsibilities. You MUST generate an ASCII diagram showing the strict PHYSICAL file architecture. CRITICAL: Do NOT invent conceptual directories like 'client/' or 'server/' if they do not exist on disk. Rely solely on the provided conventions Markdown. Build targets (like SSR/SSG scripts) are behaviors, not physical source folders."
    )
  )
  .output(
    "codeStyle",
    f.string(
      "Granular coding standards observed: language version, formatting, naming conventions, import ordering, type-hinting rules, preferred patterns vs anti-patterns. Explicitly mention how different stacks in a monorepo communicate (e.g., REST, GraphQL, etc.) and how proprietary or 3rd-party external APIs are wrapped or invoked. Provide concrete examples from the codebase. All code blocks must be properly opened AND closed with triple backticks."
    )
  )
  .output(
    "antiPatternsAndRestrictions",
    f.string("Specific anti-patterns and 'NEVER do this' rules the AI must strictly avoid.")
  )
  .output(
    "databaseAndState",
    f.string(
      "Guidelines on how data and state should flow through the application, including databases, external API data syncing, or state managers."
    )
  )
  .output(
    "errorHandlingAndLogging",
    f.string(
      "Conventions for handling exceptions and formatting logs, highlighting any specific utilities to use."
    )
  )
  .output(
    "testingCommands",
    f.string(
      "Exact CLI commands to build, lint, test, and run the project. Include per-file test commands if available. Format as a bullet list of runnable commands. All code blocks must be properly opened AND closed with triple backticks."
    )
  )
  .output(
    "testingGuidelines",
    f.string(
      "How tests should be written in this project: framework used, file placement conventions, naming patterns, mocking strategies, and coverage expectations. All code blocks must be properly opened AND closed with triple backticks."
    )
  )
  .output(
    "securityAndCompliance",
    f.string("Strict security guardrails, such as rules against exposing secrets or logging PII.")
  )
  .output(
    "dependenciesAndEnvironment",
    f.string(
      "How to install dependencies, required environment variables, external service setup, and supported runtime versions."
    )
  )
  .output(
    "prAndGitRules",
    f.string(
      "Commit message format, branch naming conventions, required checks before merging, and any PR review policies observed in the codebase."
    )
  )
  .output(
    "documentationStandards",
    f.string("Standards for writing docstrings, comments, and updating system/user documentation.")
  )
  .output(
    "commonPatterns",
    f.string(
      "Recurring design patterns, error handling idioms, logging conventions, and strict 'ALWAYS do X / NEVER do Y' rules observed across the codebase. All code blocks must be properly opened AND closed with triple backticks."
    )
  )
  .output(
    "agentWorkflow",
    f.string(
      "Standard Operating Procedure (SOP) for how the AI should approach generic or specific tasks in this codebase."
    )
  )
  .output(
    "fewShotExamples",
    f.string(
      "Concrete 'Good' vs 'Bad' code snippets to perfectly align the agent via demonstration. Provide detailed examples of standard implementation paths. All code blocks must be properly opened AND closed with triple backticks."
    )
  )
  .build();
