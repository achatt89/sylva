"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsMdCreator = exports.CodebaseConventionExtractor = void 0;
const ax_1 = require("@ax-llm/ax");
// We must serialize the source tree into a text/markdown format to feed into AxAgent context.
function serializeSourceTree(tree, indent = "") {
    let output = "";
    for (const [key, value] of Object.entries(tree)) {
        if (typeof value === "string") {
            output += `${indent}- File: ${key}\n`;
            output += `${indent}  Content:\n\`\`\`\n${value}\n\`\`\`\n\n`;
        }
        else {
            output += `${indent}- Directory: ${key}/\n`;
            output += serializeSourceTree(value, indent + "  ");
        }
    }
    return output;
}
class CodebaseConventionExtractor {
    maxIterations;
    constructor(maxIterations = 35) {
        this.maxIterations = maxIterations;
    }
    async extract(sourceTree) {
        console.log("=> Preparing and serializing Source Tree for RLM analysis...");
        const contextString = serializeSourceTree(sourceTree);
        console.log(`=> Running AxAgent (RLM) for Codebase Analysis on ${Object.keys(sourceTree).length} root modules...`);
        // Use the f() builder for reliable type definition instead of long strings
        const agentSig = (0, ax_1.f)()
            .input("sourceContext", ax_1.f.string())
            .output("projectOverview", ax_1.f.string("Project Overview & Context: Gives the AI a fundamental understanding of what the software does"))
            .output("agentPersona", ax_1.f.string("Agent Persona / Role"))
            .output("techStack", ax_1.f.string("Tech Stack & Versions"))
            .output("directoryStructure", ax_1.f.string("Directory Structure (The Map)"))
            .output("executionCommands", ax_1.f.string("Execution Commands"))
            .output("codeStyleAndFormatting", ax_1.f.string("Code Style & Formatting"))
            .output("architectureAndDesignPatterns", ax_1.f.string("Architecture & Design Patterns"))
            .output("antiPatternsAndRestrictions", ax_1.f.string("Anti-Patterns & Restrictions"))
            .output("dependencyManagement", ax_1.f.string("Dependency Management"))
            .output("stateManagementGuidelines", ax_1.f.string("State Management Guidelines"))
            .output("databaseAndDataHandling", ax_1.f.string("Database & Data Handling"))
            .output("errorHandlingAndLogging", ax_1.f.string("Error Handling & Logging"))
            .output("testingStrategy", ax_1.f.string("Testing Strategy"))
            .output("securityAndCompliance", ax_1.f.string("Security & Compliance"))
            .output("gitAndVersionControl", ax_1.f.string("Git & Version Control"))
            .output("documentationStandards", ax_1.f.string("Documentation Standards"))
            .output("agentWorkflow", ax_1.f.string("Agent Workflow / SOP"))
            .output("fewShotExamples", ax_1.f.string("Few-Shot Examples"))
            .build();
        // Pass config properties properly conforming to AxAgentConfig
        const analyzer = (0, ax_1.agent)(agentSig, {
            agentIdentity: {
                name: "CodebaseAnalyzer",
                description: "Analyze the structural backbone, data flow, and day-to-day coding conventions of the application using recursive analysis of the source code."
            },
            contextFields: ["sourceContext"],
            runtime: new ax_1.AxJSRuntime(),
            maxLlmCalls: this.maxIterations
        });
        // We run the agent forwarding the generic LLM. 
        // We will receive the initialized `llm` instance from the CLI.
        return {
            analyzer,
            contextString
        };
    }
    async compileMarkdown(llm, extractResult) {
        console.log("=> Compiling Codebase Analysis into Cohesive Markdown...");
        // Equivalent to dspy.ChainOfThought(CompileConventionsMarkdown)
        const compileSig = (0, ax_1.f)()
            .input("projectOverview", ax_1.f.string("Project Overview & Context."))
            .input("agentPersona", ax_1.f.string("Agent Persona / Role."))
            .input("techStack", ax_1.f.string("Tech Stack & Versions."))
            .input("directoryStructure", ax_1.f.string("Directory Structure (The Map)."))
            .input("executionCommands", ax_1.f.string("Execution Commands."))
            .input("codeStyleAndFormatting", ax_1.f.string("Code Style & Formatting."))
            .input("architectureAndDesignPatterns", ax_1.f.string("Architecture & Design Patterns."))
            .input("antiPatternsAndRestrictions", ax_1.f.string("Anti-Patterns & Restrictions."))
            .input("dependencyManagement", ax_1.f.string("Dependency Management."))
            .input("stateManagementGuidelines", ax_1.f.string("State Management Guidelines."))
            .input("databaseAndDataHandling", ax_1.f.string("Database & Data Handling."))
            .input("errorHandlingAndLogging", ax_1.f.string("Error Handling & Logging."))
            .input("testingStrategy", ax_1.f.string("Testing Strategy."))
            .input("securityAndCompliance", ax_1.f.string("Security & Compliance."))
            .input("gitAndVersionControl", ax_1.f.string("Git & Version Control."))
            .input("documentationStandards", ax_1.f.string("Documentation Standards."))
            .input("agentWorkflow", ax_1.f.string("Agent Workflow / SOP."))
            .input("fewShotExamples", ax_1.f.string("Few-Shot Examples."))
            .output("markdownDocument", ax_1.f.string("Comprehensive CODEBASE_CONVENTIONS.md document formatted with clear headings, bullet points, and specific code/file snippets as evidence."))
            .build();
        const compiler = (0, ax_1.ax)(compileSig);
        const finalResult = await compiler.forward(llm, extractResult);
        return finalResult.markdownDocument;
    }
}
exports.CodebaseConventionExtractor = CodebaseConventionExtractor;
class AgentsMdCreator {
    async extractAndCompileSections(llm, conventionsMarkdown, repositoryName) {
        console.log(`=> Extracting individual AGENTS.md sections for repository: ${repositoryName}...`);
        // Equivalent to ExtractAgentsSections via ChainOfThought
        const sectionSig = (0, ax_1.f)()
            .input("conventionsMarkdown", ax_1.f.string("The extracted architectural, data flow, and granular coding conventions"))
            .input("repositoryName", ax_1.f.string("The name of the repository or project"))
            .output("projectOverview", ax_1.f.string("Brief description of the project: what it does, its tech stack, primary language, and purpose. 2-4 sentences."))
            .output("techStack", ax_1.f.string("Explicit list of supported languages, frameworks, and tools used in the repository."))
            .output("architecture", ax_1.f.string("High-level map of where things live: directory layout, key modules, entry points, and their responsibilities. Use bullet points with file paths."))
            .output("codeStyle", ax_1.f.string("Specific coding standards observed: language version, formatting, naming conventions, import ordering, type-hinting rules, preferred patterns vs anti-patterns. Use concrete examples from the codebase. All code blocks must be properly opened AND closed with triple backticks."))
            .output("antiPatternsAndRestrictions", ax_1.f.string("Specific anti-patterns and 'NEVER do this' rules the AI must strictly avoid."))
            .output("databaseAndState", ax_1.f.string("Guidelines on how data and state should flow through the application, including databases or state managers."))
            .output("errorHandlingAndLogging", ax_1.f.string("Conventions for handling exceptions and formatting logs, highlighting any specific utilities to use."))
            .output("testingCommands", ax_1.f.string("Exact CLI commands to build, lint, test, and run the project. Include per-file test commands if available. Format as a bullet list of runnable commands. All code blocks must be properly opened AND closed with triple backticks."))
            .output("testingGuidelines", ax_1.f.string("How tests should be written in this project: framework used, file placement conventions, naming patterns, mocking strategies, and coverage expectations. All code blocks must be properly opened AND closed with triple backticks."))
            .output("securityAndCompliance", ax_1.f.string("Strict security guardrails, such as rules against exposing secrets or logging PII."))
            .output("dependenciesAndEnvironment", ax_1.f.string("How to install dependencies, required environment variables, external service setup, and supported runtime versions."))
            .output("prAndGitRules", ax_1.f.string("Commit message format, branch naming conventions, required checks before merging, and any PR review policies observed in the codebase."))
            .output("documentationStandards", ax_1.f.string("Standards for writing docstrings, comments, and updating system/user documentation."))
            .output("commonPatterns", ax_1.f.string("Recurring design patterns, error handling idioms, logging conventions, and strict 'ALWAYS do X / NEVER do Y' rules observed across the codebase. All code blocks must be properly opened AND closed with triple backticks."))
            .output("agentWorkflow", ax_1.f.string("Standard Operating Procedure (SOP) for how the AI should approach generic or specific tasks in this codebase."))
            .output("fewShotExamples", ax_1.f.string("Concrete 'Good' vs 'Bad' code snippets to perfectly align the agent via demonstration. All code blocks must be properly opened AND closed with triple backticks."))
            .build();
        const sectionExtractor = (0, ax_1.ax)(sectionSig);
        const sections = await sectionExtractor.forward(llm, { conventionsMarkdown, repositoryName });
        return sections;
    }
}
exports.AgentsMdCreator = AgentsMdCreator;
