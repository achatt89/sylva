import { agent, ax, AxJSRuntime, f } from "@ax-llm/ax";
import { AgentsMdSections, TreeType } from "./utils";
import {
  CODEBASE_ANALYSIS_SIGNATURE,
  CODEBASE_ANALYZER_IDENTITY,
  COMPILE_CONVENTIONS_SIGNATURE,
  EXTRACT_AGENTS_SECTIONS_SIGNATURE,
} from "./prompts";

// We must serialize the source tree into a text/markdown format to feed into AxAgent context.
function serializeSourceTree(
  tree: { [key: string]: TreeType },
  indent = "",
): string {
  let output = "";
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "string") {
      output += `${indent}- File: ${key}\n`;
      output += `${indent}  Content:\n\`\`\`\n${value}\n\`\`\`\n\n`;
    } else {
      output += `${indent}- Directory: ${key}/\n`;
      output += serializeSourceTree(value, indent + "  ");
    }
  }
  return output;
}

export class CodebaseConventionExtractor {
  private maxIterations: number;

  constructor(maxIterations: number = 35) {
    this.maxIterations = maxIterations;
  }

  public async extract(sourceTree: { [key: string]: TreeType }) {
    console.log("=> Preparing and serializing Source Tree for RLM analysis...");
    const contextString = serializeSourceTree(sourceTree);

    console.log(
      `=> Running AxAgent (RLM) for Codebase Analysis on ${Object.keys(sourceTree).length} root modules...`,
    );

    // Use the f() builder for reliable type definition instead of long strings
    const agentSig = CODEBASE_ANALYSIS_SIGNATURE;

    // Pass config properties properly conforming to AxAgentConfig
    const analyzer = agent(agentSig, {
      agentIdentity: CODEBASE_ANALYZER_IDENTITY,
      contextFields: ["sourceContext" as const],
      runtime: new AxJSRuntime(),
      maxLlmCalls: this.maxIterations,
    });

    // We run the agent forwarding the generic LLM.
    // We will receive the initialized `llm` instance from the CLI.
    return {
      analyzer,
      contextString,
    };
  }

  public async compileMarkdown(llm: any, extractResult: any): Promise<string> {
    console.log("=> Compiling Codebase Analysis into Cohesive Markdown...");

    // Equivalent to dspy.ChainOfThought(CompileConventionsMarkdown)
    const compileSig = COMPILE_CONVENTIONS_SIGNATURE;
    const compiler = ax(compileSig);

    const finalResult = await compiler.forward(llm, extractResult);
    return (finalResult as any).markdownDocument;
  }
}

export class AgentsMdCreator {
  public async extractAndCompileSections(
    llm: any,
    conventionsMarkdown: string,
    repositoryName: string,
  ): Promise<AgentsMdSections> {
    console.log(
      `=> Extracting individual AGENTS.md sections for repository: ${repositoryName}...`,
    );

    // Equivalent to ExtractAgentsSections via ChainOfThought
    const sectionSig = EXTRACT_AGENTS_SECTIONS_SIGNATURE;
    const sectionExtractor = ax(sectionSig);

    const sections = await sectionExtractor.forward(llm, {
      conventionsMarkdown,
      repositoryName,
    });
    return sections as AgentsMdSections;
  }
}
