import { f } from "@ax-llm/ax";

export const CODEBASE_ANALYSIS_SIGNATURE = f()
  .input("sourceContext", f.string())
  .output(
    "projectOverview",
    f.string(
      "Project Overview & Context: Gives the AI a fundamental understanding of what the software does"
    )
  )
  .output("agentPersona", f.string("Agent Persona / Role"))
  .output("techStack", f.string("Tech Stack & Versions"))
  .output("directoryStructure", f.string("Directory Structure (The Map)"))
  .output("executionCommands", f.string("Execution Commands"))
  .output("codeStyleAndFormatting", f.string("Code Style & Formatting"))
  .output("architectureAndDesignPatterns", f.string("Architecture & Design Patterns"))
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
  .output("fewShotExamples", f.string("Few-Shot Examples"))
  .build();

export const CODEBASE_ANALYZER_IDENTITY = {
  name: "CodebaseAnalyzer",
  description:
    "Analyze the structural backbone, data flow, and day-to-day coding conventions of the application using recursive analysis of the source code.",
};

export const COMPILE_CONVENTIONS_SIGNATURE = f()
  .input("projectOverview", f.string("Project Overview & Context."))
  .input("agentPersona", f.string("Agent Persona / Role."))
  .input("techStack", f.string("Tech Stack & Versions."))
  .input("directoryStructure", f.string("Directory Structure (The Map)."))
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
  .output(
    "markdownDocument",
    f.string(
      "Comprehensive CODEBASE_CONVENTIONS.md document formatted with clear headings, bullet points, and specific code/file snippets as evidence."
    )
  )
  .build();

export const EXTRACT_AGENTS_SECTIONS_SIGNATURE = f()
  .input(
    "conventionsMarkdown",
    f.string("The extracted architectural, data flow, and granular coding conventions")
  )
  .input("repositoryName", f.string("The name of the repository or project"))
  .output(
    "projectOverview",
    f.string(
      "Brief description of the project: what it does, its tech stack, primary language, and purpose. 2-4 sentences."
    )
  )
  .output(
    "techStack",
    f.string("Explicit list of supported languages, frameworks, and tools used in the repository.")
  )
  .output(
    "architecture",
    f.string(
      "High-level map of where things live: directory layout, key modules, entry points, and their responsibilities. Use bullet points with file paths."
    )
  )
  .output(
    "codeStyle",
    f.string(
      "Specific coding standards observed: language version, formatting, naming conventions, import ordering, type-hinting rules, preferred patterns vs anti-patterns. Use concrete examples from the codebase. All code blocks must be properly opened AND closed with triple backticks."
    )
  )
  .output(
    "antiPatternsAndRestrictions",
    f.string("Specific anti-patterns and 'NEVER do this' rules the AI must strictly avoid.")
  )
  .output(
    "databaseAndState",
    f.string(
      "Guidelines on how data and state should flow through the application, including databases or state managers."
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
      "Concrete 'Good' vs 'Bad' code snippets to perfectly align the agent via demonstration. All code blocks must be properly opened AND closed with triple backticks."
    )
  )
  .build();
