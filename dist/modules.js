"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentsMdCreator = exports.CodebaseConventionExtractor = void 0;
const ax_1 = require("@ax-llm/ax");
const prompts_1 = require("./prompts");
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
        const agentSig = prompts_1.CODEBASE_ANALYSIS_SIGNATURE;
        // Pass config properties properly conforming to AxAgentConfig
        const analyzer = (0, ax_1.agent)(agentSig, {
            agentIdentity: prompts_1.CODEBASE_ANALYZER_IDENTITY,
            contextFields: ["sourceContext"],
            runtime: new ax_1.AxJSRuntime(),
            maxLlmCalls: this.maxIterations,
        });
        // We run the agent forwarding the generic LLM.
        // We will receive the initialized `llm` instance from the CLI.
        return {
            analyzer,
            contextString,
        };
    }
    async compileMarkdown(llm, extractResult) {
        console.log("=> Compiling Codebase Analysis into Cohesive Markdown...");
        // Equivalent to dspy.ChainOfThought(CompileConventionsMarkdown)
        const compileSig = prompts_1.COMPILE_CONVENTIONS_SIGNATURE;
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
        const sectionSig = prompts_1.EXTRACT_AGENTS_SECTIONS_SIGNATURE;
        const sectionExtractor = (0, ax_1.ax)(sectionSig);
        const sections = await sectionExtractor.forward(llm, {
            conventionsMarkdown,
            repositoryName,
        });
        return sections;
    }
}
exports.AgentsMdCreator = AgentsMdCreator;
